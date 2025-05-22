package com.example.backend.dto.post;

import lombok.Data;

@Data
public class CommentResponse {
    private Long id;
    private String content;
    private String timestamp;
    private PostResponse.UserSummary user;
} 