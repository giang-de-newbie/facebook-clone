package com.example.backend.dto;

import com.example.backend.dto.post.PostResponse;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserProfileResponse {
    private String email;
    private String firstName;
    private String lastName;
    private String profilePicture;
    private String coverPhoto;
    private String bio;
    private String location;
    private String work;
    private String education;
    private List<PostResponse> posts;
} 