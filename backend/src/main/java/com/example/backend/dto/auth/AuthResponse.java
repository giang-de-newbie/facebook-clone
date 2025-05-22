package com.example.backend.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private Long id;
    private String token;
    private String email;
    private String firstName;
    private String lastName;
    private String profilePicture;
    private String coverPhoto;
    private String bio;
    private String location;
    private String work;
    private String education;
    private String role;
} 