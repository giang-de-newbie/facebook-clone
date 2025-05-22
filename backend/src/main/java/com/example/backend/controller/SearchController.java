package com.example.backend.controller;

import com.example.backend.model.Post;
import com.example.backend.model.User;
import com.example.backend.repository.PostRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {
    private final UserRepository userRepository;
    private final PostRepository postRepository;

    @GetMapping
    public ResponseEntity<?> search(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);

            // Tìm kiếm users với giới hạn kết quả
            Page<User> userPage = userRepository.findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                query, query, query, pageable
            );

            // Tạo bản rút gọn để trả về frontend
            List<User> users = userPage.getContent().stream().map(user -> {
                User simplifiedUser = new User();
                simplifiedUser.setId(user.getId());
                simplifiedUser.setFirstName(user.getFirstName());
                simplifiedUser.setLastName(user.getLastName());
                simplifiedUser.setEmail(user.getEmail());
                simplifiedUser.setProfilePicture(user.getProfilePicture());
                return simplifiedUser;
            }).toList();

            // Tìm kiếm posts với giới hạn kết quả
            Page<Post> postPage = postRepository.findByContentContainingIgnoreCase(query, pageable);
            List<Post> posts = postPage.getContent();

            Map<String, Object> response = new HashMap<>();
            response.put("users", users);
            response.put("posts", posts);
            response.put("totalUsers", userPage.getTotalElements());
            response.put("totalPosts", postPage.getTotalElements());
            response.put("totalPages", Math.max(userPage.getTotalPages(), postPage.getTotalPages()));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Error performing search: " + e.getMessage()));
        }
    }
} 