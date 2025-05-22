import React, { useState, useEffect, useRef } from 'react';
import { Badge, IconButton, Menu, MenuItem, Typography, Box } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axios from '../axiosInstance';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [anchorEl, setAnchorEl] = useState(null);
    const stompClient = useRef(null);

    useEffect(() => {
        // Kết nối WebSocket
        const socket = new SockJS('http://localhost:8080/ws');
        stompClient.current = new Client({
            webSocketFactory: () => socket,
            connectHeaders: {
                Authorization: 'Bearer ' + localStorage.getItem('token')
            },
            onConnect: () => {
                console.log('Connected to WebSocket');
                // Subscribe to notifications
                stompClient.current.subscribe('/user/queue/notifications', (message) => {
                    const notification = JSON.parse(message.body);
                    setNotifications(prev => [notification, ...prev]);
                });
                // Subscribe to unread count
                stompClient.current.subscribe('/user/queue/unread-count', (message) => {
                    setUnreadCount(parseInt(message.body));
                });
            },
            onDisconnect: () => {
                console.log('Disconnected from WebSocket');
            }
        });

        stompClient.current.activate();

        // Load initial notifications
        loadNotifications();

        return () => {
            if (stompClient.current) {
                stompClient.current.deactivate();
            }
        };
    }, []);

    const loadNotifications = async () => {
        try {
            const response = await axios.get('/api/notifications');
            setNotifications(response.data);
            const unreadResponse = await axios.get('/api/notifications/unread');
            setUnreadCount(unreadResponse.data.length);
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    };

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleMarkAllAsRead = async () => {
        try {
            await axios.post('/api/notifications/mark-read');
            setUnreadCount(0);
            setNotifications(prev => 
                prev.map(notification => ({ ...notification, read: true }))
            );
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
    };

    return (
        <>
            <IconButton color="inherit" onClick={handleClick}>
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                    style: {
                        maxHeight: 400,
                        width: 360,
                    },
                }}
            >
                {notifications.length > 0 ? (
                    <>
                        <MenuItem onClick={handleMarkAllAsRead}>
                            <Typography variant="body2" color="primary">
                                Mark all as read
                            </Typography>
                        </MenuItem>
                        {notifications.map((notification) => (
                            <MenuItem key={notification.id} onClick={handleClose}>
                                <Box>
                                    <Typography variant="body2">
                                        {notification.message}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {new Date(notification.createdAt).toLocaleString()}
                                    </Typography>
                                </Box>
                            </MenuItem>
                        ))}
                    </>
                ) : (
                    <MenuItem>
                        <Typography variant="body2">No notifications</Typography>
                    </MenuItem>
                )}
            </Menu>
        </>
    );
};

export default NotificationBell; 