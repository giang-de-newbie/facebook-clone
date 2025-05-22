package com.example.backend.controller;

import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.PostRepository;
import com.example.backend.dto.UserProfileResponse;
import com.example.backend.dto.UpdateProfileRequest;
import com.example.backend.dto.post.PostResponse;
import com.example.backend.dto.post.CommentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
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
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {
    private final UserRepository userRepository;
    private final PostRepository postRepository;

    @Value("${upload.dir:uploads}")
    private String uploadDir;

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
        ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".svg"
    );

    @PostMapping("/avatar")
    public ResponseEntity<UserProfileResponse> updateAvatar(@RequestParam("file") MultipartFile file, @AuthenticationPrincipal UserDetails userDetails) throws IOException {
        String email = userDetails.getUsername();
        User user = userRepository.findByEmail(email).orElseThrow();
        String fileName = saveFile(file);
        user.setProfilePicture("/uploads/" + fileName);
        userRepository.save(user);
        return ResponseEntity.ok(new UserProfileResponse(
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getProfilePicture(),
            user.getCoverPhoto(),
            user.getBio(),
            user.getLocation(),
            user.getWork(),
            user.getEducation(),
            null
        ));
    }

    @PostMapping("/cover")
    public ResponseEntity<?> updateCover(@RequestParam("file") MultipartFile file, @AuthenticationPrincipal UserDetails userDetails) {
        try {
            String email = userDetails.getUsername();
            User user = userRepository.findByEmail(email).orElseThrow();
            String fileName = saveFile(file);
            user.setCoverPhoto("/uploads/" + fileName);
            userRepository.save(user);
            return ResponseEntity.ok(new UserProfileResponse(
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getProfilePicture(),
                user.getCoverPhoto(),
                user.getBio(),
                user.getLocation(),
                user.getWork(),
                user.getEducation(),
                null
            ));
        } catch (Exception e) {
            e.printStackTrace(); // log lỗi chi tiết ra console
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails.getUsername();
        User user = userRepository.findByEmail(email).orElseThrow();
        return ResponseEntity.ok(new UserProfileResponse(
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getProfilePicture(),
            user.getCoverPhoto(),
            user.getBio(),
            user.getLocation(),
            user.getWork(),
            user.getEducation(),
            null
        ));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails.getUsername();
        User user = userRepository.findByEmail(email).orElseThrow();
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setBio(request.getBio());
        user.setLocation(request.getLocation());
        user.setWork(request.getWork());
        user.setEducation(request.getEducation());
        userRepository.save(user);
        return ResponseEntity.ok(new UserProfileResponse(
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getProfilePicture(),
            user.getCoverPhoto(),
            user.getBio(),
            user.getLocation(),
            user.getWork(),
            user.getEducation(),
            null
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserProfileResponse> getUserById(@PathVariable Long id) {
        User user = userRepository.findById(id).orElseThrow();
        // Lấy danh sách bài viết của user
        List<com.example.backend.model.Post> posts = postRepository.findAll().stream().filter(p -> p.getUser().getId().equals(id)).toList();
        List<PostResponse> postResponses = posts.stream().map(post -> {
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
        return ResponseEntity.ok(new UserProfileResponse(
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getProfilePicture(),
            user.getCoverPhoto(),
            user.getBio(),
            user.getLocation(),
            user.getWork(),
            user.getEducation(),
            postResponses
        ));
    }

    private String saveFile(MultipartFile file) throws IOException {
        File dir = new File(uploadDir);
        if (!dir.exists()) dir.mkdirs();
        String originalName = file.getOriginalFilename();
        int dotIndex = originalName.lastIndexOf('.');
        if (dotIndex == -1) {
            throw new IOException("File must have an extension");
        }
        String ext = originalName.substring(dotIndex).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new IOException("File extension not allowed");
        }
        String fileName = UUID.randomUUID() + ext;
        Path filePath = Paths.get(uploadDir, fileName);
        Files.write(filePath, file.getBytes());
        return fileName;
    }
} 