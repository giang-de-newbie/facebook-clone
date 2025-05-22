package com.example.backend.service;

import com.example.backend.model.Notification;
import com.example.backend.model.User;
import java.util.List;

public interface NotificationService {
    Notification createNotification(User user, String type, String message);
    List<Notification> getUnreadNotifications(User user);
    List<Notification> getAllNotifications(User user);
    void markAllAsRead(User user);
} 