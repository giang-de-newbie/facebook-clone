package com.example.backend.repository;

import com.example.backend.model.Post;
import com.example.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findByContentContainingIgnoreCase(String content);
    List<Post> findByUser(User user);
    
    Page<Post> findByContentContainingIgnoreCase(String content, Pageable pageable);
} 