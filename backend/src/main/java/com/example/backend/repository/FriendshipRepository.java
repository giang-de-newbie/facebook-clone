package com.example.backend.repository;

import com.example.backend.model.Friendship;
import com.example.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FriendshipRepository extends JpaRepository<Friendship, Long> {
    Optional<Friendship> findByUserAndFriend(User user, User friend);
    
    @Query("SELECT f FROM Friendship f WHERE (f.user = :user OR f.friend = :user) AND f.status = :status")
    List<Friendship> findByUserOrFriendAndStatus(@Param("user") User user, @Param("status") Friendship.Status status);
    
    List<Friendship> findByFriendAndStatus(User friend, Friendship.Status status);
    List<Friendship> findByUserAndStatus(User user, Friendship.Status status);
} 