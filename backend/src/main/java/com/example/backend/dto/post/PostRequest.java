package com.example.backend.dto.post;

import lombok.Data;
 
@Data
public class PostRequest {
    private String content;
    private String image;
    private String video;
} 