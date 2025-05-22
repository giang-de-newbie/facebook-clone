package com.example.backend.controller;

import com.example.backend.model.User;
import com.example.backend.model.Post;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.PostRepository;
import com.example.backend.dto.post.PostResponse;
import com.example.backend.dto.post.CommentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
    private final UserRepository userRepository;
    private final PostRepository postRepository;

    private boolean isAdmin(UserDetails userDetails) {
        return userDetails.getUsername().equals("admin@gmail.com");
    }

    // Lấy danh sách user
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(@AuthenticationPrincipal UserDetails userDetails) {
        if (!isAdmin(userDetails)) return ResponseEntity.status(403).body("Access denied");
        List<User> users = userRepository.findAll();
        return ResponseEntity.ok(users);
    }

    // Xoá user
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        if (!isAdmin(userDetails)) return ResponseEntity.status(403).body("Access denied");
        userRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // Lấy danh sách post
    @GetMapping("/posts")
    public ResponseEntity<?> getAllPosts(@AuthenticationPrincipal UserDetails userDetails) {
        if (!isAdmin(userDetails)) return ResponseEntity.status(403).body("Access denied");
        List<Post> posts = postRepository.findAll();
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
            userDto.setId(post.getUser().getId());
            userDto.setFirstName(post.getUser().getFirstName());
            userDto.setLastName(post.getUser().getLastName());
            userDto.setProfilePicture(post.getUser().getProfilePicture());
            dto.setUser(userDto);
            // Comments (nếu cần, có thể map comments, ở đây để rỗng)
            dto.setComments(List.of());
            return dto;
        }).toList();
        return ResponseEntity.ok(result);
    }

    // Xoá post
    @DeleteMapping("/posts/{id}")
    public ResponseEntity<?> deletePost(@PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        if (!isAdmin(userDetails)) return ResponseEntity.status(403).body("Access denied");
        postRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
} 