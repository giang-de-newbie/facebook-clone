package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "notifications")
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user; // người nhận thông báo

    private String type; // LIKE, COMMENT, FRIEND_REQUEST, POST
    private String message;
    @Column(name = "is_read")
    private boolean isRead = false;
    private LocalDateTime createdAt = LocalDateTime.now();
} 