package com.example.backend.dto.post;

import lombok.Data;
import java.util.List;

@Data
public class PostResponse {
    private Long id;
    private String content;
    private String image;
    private int likes;
    private int shares;
    private String timestamp;
    private UserSummary user;
    private List<CommentResponse> comments;
    private boolean likedByCurrentUser;

    @Data
    public static class UserSummary {
        private Long id;
        private String firstName;
        private String lastName;
        private String profilePicture;
    }
} 