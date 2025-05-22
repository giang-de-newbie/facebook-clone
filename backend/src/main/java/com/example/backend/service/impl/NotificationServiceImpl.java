package com.example.backend.service.impl;

import com.example.backend.model.Notification;
import com.example.backend.model.User;
import com.example.backend.repository.NotificationRepository;
import com.example.backend.service.NotificationService;
import com.example.backend.service.WebSocketService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {
    private final NotificationRepository notificationRepository;
    private final WebSocketService webSocketService;

    @Override
    public Notification createNotification(User user, String type, String message) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(type);
        notification.setMessage(message);
        notification.setRead(false);
        notification = notificationRepository.save(notification);
        
        // Gửi thông báo realtime
        webSocketService.sendNotification(notification);
        
        // Gửi số lượng thông báo chưa đọc
        int unreadCount = notificationRepository.findByUserAndIsReadFalse(user).size();
        webSocketService.sendUnreadCount(user.getId(), unreadCount);
        
        return notification;
    }

    @Override
    public List<Notification> getUnreadNotifications(User user) {
        return notificationRepository.findByUserAndIsReadFalse(user);
    }

    @Override
    public List<Notification> getAllNotifications(User user) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(user);
    }

    @Override
    public void markAllAsRead(User user) {
        List<Notification> notifications = notificationRepository.findByUserAndIsReadFalse(user);
        for (Notification n : notifications) {
            n.setRead(true);
        }
        notificationRepository.saveAll(notifications);
        
        // Gửi số lượng thông báo chưa đọc (0) sau khi đánh dấu đã đọc
        webSocketService.sendUnreadCount(user.getId(), 0);
    }
} 