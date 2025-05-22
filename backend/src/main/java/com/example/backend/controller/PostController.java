package com.example.backend.controller;

import com.example.backend.dto.post.CommentRequest;
import com.example.backend.dto.post.PostRequest;
import com.example.backend.dto.post.PostResponse;
import com.example.backend.dto.post.CommentResponse;
import com.example.backend.model.Comment;
import com.example.backend.model.Post;
import com.example.backend.model.User;
import com.example.backend.model.PostLike;
import com.example.backend.repository.CommentRepository;
import com.example.backend.repository.PostRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.PostLikeRepository;
import com.example.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final PostLikeRepository postLikeRepository;
    private final NotificationService notificationService;

    @PostMapping
    public ResponseEntity<Post> createPost(@RequestBody PostRequest request, @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        Post post = new Post();
        post.setUser(user);
        post.setContent(request.getContent());
        post.setImage(request.getImage());
        post.setVideo(request.getVideo());
        postRepository.save(post);
        // Gửi notification cho bạn bè (nếu muốn, ví dụ gửi cho chính user để test)
        notificationService.createNotification(
            user,
            "POST",
            "You have posted a new status."
        );
        return ResponseEntity.ok(post);
    }

    @GetMapping
    public ResponseEntity<List<PostResponse>> getAllPosts(@AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        List<Post> posts = postRepository.findAll();
        List<PostResponse> result = posts.stream().map(post -> {
            PostResponse dto = new PostResponse();
            dto.setId(post.getId());
            dto.setContent(post.getContent());
            dto.setImage(post.getImage());
            dto.setLikes(post.getLikes());
            dto.setShares(post.getShares());
            dto.setTimestamp(post.getCreatedAt() != null ? post.getCreatedAt().toString() : "");
            // Kiểm tra user hiện tại đã like post chưa
            boolean likedByCurrentUser = postLikeRepository.findByPostAndUser(post, currentUser).isPresent();
            dto.setLikedByCurrentUser(likedByCurrentUser);
            // User
            PostResponse.UserSummary userDto = new PostResponse.UserSummary();
            userDto.setId(post.getUser().getId());
            userDto.setFirstName(post.getUser().getFirstName());
            userDto.setLastName(post.getUser().getLastName());
            userDto.setProfilePicture(post.getUser().getProfilePicture());
            dto.setUser(userDto);
            // Comments
            List<CommentResponse> commentDtos = post.getComments() != null ? post.getComments().stream().map(comment -> {
                CommentResponse cDto = new CommentResponse();
                cDto.setId(comment.getId());
                cDto.setContent(comment.getContent());
                cDto.setTimestamp(comment.getCreatedAt() != null ? comment.getCreatedAt().toString() : "");
                PostResponse.UserSummary cUser = new PostResponse.UserSummary();
                cUser.setId(comment.getUser().getId());
                cUser.setFirstName(comment.getUser().getFirstName());
                cUser.setLastName(comment.getUser().getLastName());
                cUser.setProfilePicture(comment.getUser().getProfilePicture());
                cDto.setUser(cUser);
                return cDto;
            }).toList() : List.of();
            dto.setComments(commentDtos);
            return dto;
        }).toList();
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(@PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        Post post = postRepository.findById(id).orElseThrow();
        if (!post.getUser().getEmail().equals(userDetails.getUsername())) {
            return ResponseEntity.status(403).body("Not allowed");
        }
        postRepository.delete(post);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<PostResponse> likeOrUnlikePost(@PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        Post post = postRepository.findById(id).orElseThrow();
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();

        java.util.Optional<PostLike> existingLike = postLikeRepository.findByPostAndUser(post, user);
        if (existingLike.isPresent()) {
            postLikeRepository.delete(existingLike.get());
        } else {
            PostLike like = new PostLike();
            like.setPost(post);
            like.setUser(user);
            postLikeRepository.save(like);
            // Tạo notification cho chủ post (nếu không phải tự like)
            if (!post.getUser().getId().equals(user.getId())) {
                notificationService.createNotification(
                    post.getUser(),
                    "LIKE",
                    user.getFirstName() + " " + user.getLastName() + " liked your post."
                );
            }
        }
        // Trả về số lượng like mới nhất
        int likeCount = postLikeRepository.countByPost(post);

        // Map lại PostResponse như ở getAllPosts, nhưng set likes = likeCount
        PostResponse dto = new PostResponse();
        dto.setId(post.getId());
        dto.setContent(post.getContent());
        dto.setImage(post.getImage());
        dto.setLikes(likeCount);
        dto.setShares(post.getShares());
        dto.setTimestamp(post.getCreatedAt() != null ? post.getCreatedAt().toString() : "");
        // Kiểm tra user hiện tại đã like post chưa
        boolean likedByCurrentUser = postLikeRepository.findByPostAndUser(post, user).isPresent();
        dto.setLikedByCurrentUser(likedByCurrentUser);
        // User
        PostResponse.UserSummary userDto = new PostResponse.UserSummary();
        userDto.setId(post.getUser().getId());
        userDto.setFirstName(post.getUser().getFirstName());
        userDto.setLastName(post.getUser().getLastName());
        userDto.setProfilePicture(post.getUser().getProfilePicture());
        dto.setUser(userDto);
        // Comments
        List<CommentResponse> commentDtos = post.getComments() != null ? post.getComments().stream().map(comment -> {
            CommentResponse cDto = new CommentResponse();
            cDto.setId(comment.getId());
            cDto.setContent(comment.getContent());
            cDto.setTimestamp(comment.getCreatedAt() != null ? comment.getCreatedAt().toString() : "");
            PostResponse.UserSummary cUser = new PostResponse.UserSummary();
            cUser.setId(comment.getUser().getId());
            cUser.setFirstName(comment.getUser().getFirstName());
            cUser.setLastName(comment.getUser().getLastName());
            cUser.setProfilePicture(comment.getUser().getProfilePicture());
            cDto.setUser(cUser);
            return cDto;
        }).toList() : List.of();
        dto.setComments(commentDtos);
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/{id}/share")
    public ResponseEntity<PostResponse> sharePost(@PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        Post originalPost = postRepository.findById(id).orElseThrow();
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();

        // Tạo post mới cho user share
        Post sharedPost = new Post();
        sharedPost.setUser(user);
        sharedPost.setContent(originalPost.getContent()); // hoặc cho phép user nhập nội dung mới
        sharedPost.setImage(originalPost.getImage());
        sharedPost.setVideo(originalPost.getVideo());
        sharedPost.setSharedPost(originalPost);
        postRepository.save(sharedPost);

        // Tăng số lượng share cho post gốc
        originalPost.setShares(originalPost.getShares() + 1);
        postRepository.save(originalPost);

        // Map sang PostResponse
        PostResponse dto = new PostResponse();
        dto.setId(sharedPost.getId());
        dto.setContent(sharedPost.getContent());
        dto.setImage(sharedPost.getImage());
        dto.setLikes(sharedPost.getLikes());
        dto.setShares(sharedPost.getShares());
        dto.setTimestamp(sharedPost.getCreatedAt() != null ? sharedPost.getCreatedAt().toString() : "");
        PostResponse.UserSummary userDto = new PostResponse.UserSummary();
        userDto.setId(user.getId());
        userDto.setFirstName(user.getFirstName());
        userDto.setLastName(user.getLastName());
        userDto.setProfilePicture(user.getProfilePicture());
        dto.setUser(userDto);
        dto.setComments(List.of());
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<Comment> addComment(@PathVariable Long id, @RequestBody CommentRequest request, @AuthenticationPrincipal UserDetails userDetails) {
        Post post = postRepository.findById(id).orElseThrow();
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        Comment comment = new Comment();
        comment.setPost(post);
        comment.setUser(user);
        comment.setContent(request.getContent());
        commentRepository.save(comment);
        // Tạo notification cho chủ post (nếu không phải tự bình luận)
        if (!post.getUser().getId().equals(user.getId())) {
            notificationService.createNotification(
                post.getUser(),
                "COMMENT",
                user.getFirstName() + " " + user.getLastName() + " commented on your post."
            );
        }
        return ResponseEntity.ok(comment);
    }

    @PutMapping("/comments/{commentId}")
    public ResponseEntity<Comment> editComment(@PathVariable Long commentId, @RequestBody CommentRequest request, @AuthenticationPrincipal UserDetails userDetails) {
        Comment comment = commentRepository.findById(commentId).orElseThrow();
        if (!comment.getUser().getEmail().equals(userDetails.getUsername())) {
            return ResponseEntity.status(403).build();
        }
        comment.setContent(request.getContent());
        commentRepository.save(comment);
        return ResponseEntity.ok(comment);
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable Long commentId, @AuthenticationPrincipal UserDetails userDetails) {
        Comment comment = commentRepository.findById(commentId).orElseThrow();
        if (!comment.getUser().getEmail().equals(userDetails.getUsername())) {
            return ResponseEntity.status(403).build();
        }
        commentRepository.delete(comment);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/upload-image")
    public ResponseEntity<?> uploadPostImage(@RequestParam("file") MultipartFile file) throws IOException {
        String uploadDir = "uploads";
        File dir = new File(uploadDir);
        if (!dir.exists()) dir.mkdirs();
        String originalName = file.getOriginalFilename();
        int dotIndex = originalName.lastIndexOf('.');
        if (dotIndex == -1) {
            throw new IOException("File must have an extension");
        }
        String ext = originalName.substring(dotIndex).toLowerCase();
        String fileName = UUID.randomUUID() + ext;
        Path filePath = Paths.get(uploadDir, fileName);
        Files.write(filePath, file.getBytes());
        return ResponseEntity.ok(Map.of("url", "/uploads/" + fileName));
    }

    @PostMapping("/upload-video")
    public ResponseEntity<?> uploadPostVideo(@RequestParam("file") MultipartFile file) throws IOException {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Please select a file to upload"));
            }

            String uploadDir = "uploads";
            File dir = new File(uploadDir);
            if (!dir.exists()) dir.mkdirs();

            String originalName = file.getOriginalFilename();
            if (originalName == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid file name"));
            }

            int dotIndex = originalName.lastIndexOf('.');
            if (dotIndex == -1) {
                return ResponseEntity.badRequest().body(Map.of("message", "File must have an extension"));
            }

            String ext = originalName.substring(dotIndex).toLowerCase();
            // Kiểm tra định dạng video
            if (!ext.equals(".mp4") && !ext.equals(".mov") && !ext.equals(".avi")) {
                return ResponseEntity.badRequest().body(Map.of("message", "Only video files (mp4, mov, avi) are allowed"));
            }

            // Kiểm tra kích thước file (ví dụ: max 100MB)
            if (file.getSize() > 100 * 1024 * 1024) {
                return ResponseEntity.badRequest().body(Map.of("message", "File size must be less than 100MB"));
            }

            String fileName = UUID.randomUUID() + ext;
            Path filePath = Paths.get(uploadDir, fileName);
            Files.write(filePath, file.getBytes());

            return ResponseEntity.ok(Map.of("url", "/uploads/" + fileName));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("message", "Error uploading file: " + e.getMessage()));
        }
    }

    @GetMapping("/user/{id}")
    public ResponseEntity<List<PostResponse>> getPostsByUser(@PathVariable Long id) {
        User user = userRepository.findById(id).orElseThrow();
        List<Post> posts = postRepository.findAll().stream()
            .filter(p -> p.getUser().getId().equals(id))
            .toList();
        List<PostResponse> result = posts.stream().map(post -> {
            PostResponse dto = new PostResponse();
            dto.setId(post.getId());
            dto.setContent(post.getContent());
            dto.setImage(post.getImage());
            dto.setLikes(post.getLikes());
            dto.setShares(post.getShares());
            dto.setTimestamp(post.getCreatedAt() != null ? post.getCreatedAt().toString() : "");
            // User
            PostResponse.UserSummary userDto = new PostResponse.UserSummary();
            userDto.setId(user.getId());
            userDto.setFirstName(user.getFirstName());
            userDto.setLastName(user.getLastName());
            userDto.setProfilePicture(user.getProfilePicture());
            dto.setUser(userDto);
            // Comments
            List<CommentResponse> commentDtos = post.getComments() != null ? post.getComments().stream().map(comment -> {
                CommentResponse cDto = new CommentResponse();
                cDto.setId(comment.getId());
                cDto.setContent(comment.getContent());
                cDto.setTimestamp(comment.getCreatedAt() != null ? comment.getCreatedAt().toString() : "");
                PostResponse.UserSummary cUser = new PostResponse.UserSummary();
                cUser.setId(comment.getUser().getId());
                cUser.setFirstName(comment.getUser().getFirstName());
                cUser.setLastName(comment.getUser().getLastName());
                cUser.setProfilePicture(comment.getUser().getProfilePicture());
                cDto.setUser(cUser);
                return cDto;
            }).toList() : List.of();
            dto.setComments(commentDtos);
            return dto;
        }).toList();
        return ResponseEntity.ok(result);
    }
} 