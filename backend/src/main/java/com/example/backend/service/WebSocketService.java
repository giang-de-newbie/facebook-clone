package com.example.backend.service;

import com.example.backend.model.Notification;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class WebSocketService {
    private final SimpMessagingTemplate messagingTemplate;

    public void sendNotification(Notification notification) {
        messagingTemplate.convertAndSendToUser(
            notification.getUser().getEmail(),
            "/topic/notifications",
            notification
        );
    }

    public void sendUnreadCount(Long userId, int count) {
        messagingTemplate.convertAndSendToUser(
            userId.toString(),
            "/topic/unread-count",
            count
        );
    }
} 