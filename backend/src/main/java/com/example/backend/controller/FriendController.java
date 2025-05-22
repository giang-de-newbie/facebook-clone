package com.example.backend.controller;

import com.example.backend.model.Friendship;
import com.example.backend.model.User;
import com.example.backend.repository.FriendshipRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendController {
    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    // Gửi lời mời kết bạn
    @PostMapping("/request/{friendId}")
    public ResponseEntity<?> sendFriendRequest(@PathVariable Long friendId, @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
            User friend = userRepository.findById(friendId).orElseThrow();
            
            // Kiểm tra không gửi lời mời cho chính mình
            if (user.getId().equals(friendId)) {
                return ResponseEntity.badRequest().body("Cannot send friend request to yourself");
            }
            
            // Kiểm tra đã có lời mời hoặc đã là bạn bè chưa
            Optional<Friendship> existingFriendship = friendshipRepository.findByUserAndFriend(user, friend);
            if (existingFriendship.isPresent()) {
                return ResponseEntity.badRequest().body("Request already sent or already friends");
            }
            
            Friendship friendship = new Friendship();
            friendship.setUser(user);
            friendship.setFriend(friend);
            friendship.setStatus(Friendship.Status.PENDING);
            friendshipRepository.save(friendship);
            // Tạo notification cho người nhận
            notificationService.createNotification(
                friend,
                "FRIEND_REQUEST",
                user.getFirstName() + " " + user.getLastName() + " sent you a friend request."
            );
            return ResponseEntity.ok(Map.of("message", "Request sent successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Chấp nhận lời mời kết bạn
    @PostMapping("/accept/{friendId}")
    public ResponseEntity<?> acceptFriendRequest(@PathVariable Long friendId, @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        User friend = userRepository.findById(friendId).orElseThrow();
        Optional<Friendship> friendshipOpt = friendshipRepository.findByUserAndFriend(friend, user);
        if (friendshipOpt.isEmpty() || friendshipOpt.get().getStatus() != Friendship.Status.PENDING) {
            return ResponseEntity.badRequest().body("No pending request");
        }
        Friendship friendship = friendshipOpt.get();
        friendship.setStatus(Friendship.Status.ACCEPTED);
        friendshipRepository.save(friendship);
        return ResponseEntity.ok("Friend request accepted");
    }

    // Huỷ kết bạn hoặc huỷ lời mời
    @DeleteMapping("/remove/{friendId}")
    public ResponseEntity<?> removeFriend(@PathVariable Long friendId, @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        User friend = userRepository.findById(friendId).orElseThrow();
        Optional<Friendship> f1 = friendshipRepository.findByUserAndFriend(user, friend);
        Optional<Friendship> f2 = friendshipRepository.findByUserAndFriend(friend, user);
        f1.ifPresent(friendshipRepository::delete);
        f2.ifPresent(friendshipRepository::delete);
        return ResponseEntity.ok("Removed");
    }

    // Lấy danh sách bạn bè
    @GetMapping("/list")
    public ResponseEntity<?> getFriends(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
            List<Friendship> friendships = friendshipRepository.findByUserAndStatus(user, Friendship.Status.ACCEPTED);
            friendships.addAll(friendshipRepository.findByFriendAndStatus(user, Friendship.Status.ACCEPTED));
            
            List<User> friends = friendships.stream()
                .map(f -> f.getUser().equals(user) ? f.getFriend() : f.getUser())
                .distinct()
                .map(friend -> {
                    // Chỉ trả về các thông tin cần thiết
                    User simplifiedUser = new User();
                    simplifiedUser.setId(friend.getId());
                    simplifiedUser.setFirstName(friend.getFirstName());
                    simplifiedUser.setLastName(friend.getLastName());
                    simplifiedUser.setEmail(friend.getEmail());
                    simplifiedUser.setProfilePicture(friend.getProfilePicture());
                    return simplifiedUser;
                })
                .toList();
            
            return ResponseEntity.ok(friends);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Lấy danh sách lời mời đã nhận
    @GetMapping("/requests/received")
    public ResponseEntity<?> getReceivedRequests(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
            List<Friendship> requests = friendshipRepository.findByFriendAndStatus(user, Friendship.Status.PENDING);
            List<User> senders = requests.stream()
                .map(Friendship::getUser)
                .map(sender -> {
                    // Chỉ trả về các thông tin cần thiết
                    User simplifiedUser = new User();
                    simplifiedUser.setId(sender.getId());
                    simplifiedUser.setFirstName(sender.getFirstName());
                    simplifiedUser.setLastName(sender.getLastName());
                    simplifiedUser.setEmail(sender.getEmail());
                    simplifiedUser.setProfilePicture(sender.getProfilePicture());
                    return simplifiedUser;
                })
                .toList();
            return ResponseEntity.ok(senders);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Lấy danh sách lời mời đã gửi
    @GetMapping("/requests/sent")
    public ResponseEntity<?> getSentRequests(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
            List<Friendship> requests = friendshipRepository.findByUserAndStatus(user, Friendship.Status.PENDING);
            List<User> receivers = requests.stream()
                .map(Friendship::getFriend)
                .map(friend -> {
                    // Chỉ trả về các thông tin cần thiết
                    User simplifiedUser = new User();
                    simplifiedUser.setId(friend.getId());
                    simplifiedUser.setFirstName(friend.getFirstName());
                    simplifiedUser.setLastName(friend.getLastName());
                    simplifiedUser.setProfilePicture(friend.getProfilePicture());
                    return simplifiedUser;
                })
                .toList();
            return ResponseEntity.ok(receivers);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Lấy danh sách bạn bè của user bất kỳ
    @GetMapping("/list/{userId}")
    public ResponseEntity<?> getFriendsOfUser(@PathVariable Long userId) {
        try {
            User user = userRepository.findById(userId).orElseThrow();
            List<Friendship> friendships = friendshipRepository.findByUserAndStatus(user, Friendship.Status.ACCEPTED);
            friendships.addAll(friendshipRepository.findByFriendAndStatus(user, Friendship.Status.ACCEPTED));

            List<User> friends = friendships.stream()
                .map(f -> f.getUser().equals(user) ? f.getFriend() : f.getUser())
                .distinct()
                .map(friend -> {
                    User simplifiedUser = new User();
                    simplifiedUser.setId(friend.getId());
                    simplifiedUser.setFirstName(friend.getFirstName());
                    simplifiedUser.setLastName(friend.getLastName());
                    simplifiedUser.setEmail(friend.getEmail());
                    simplifiedUser.setProfilePicture(friend.getProfilePicture());
                    return simplifiedUser;
                })
                .toList();

            return ResponseEntity.ok(friends);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
} 