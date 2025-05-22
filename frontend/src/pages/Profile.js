import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Avatar,
  Button,
  Tab,
  Tabs,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
  Add as AddIcon,
  ThumbUp as ThumbUpIcon,
  ChatBubbleOutline as CommentIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

const Profile = () => {
  const { id } = useParams();
  const loggedInUser = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  const [profileUser, setProfileUser] = useState(null);
  const [friendStatus, setFriendStatus] = useState(''); // '', 'friends', 'sent', 'not_friends'
  const [tabValue, setTabValue] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [coverPreview, setCoverPreview] = useState(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [posts, setPosts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [editProfile, setEditProfile] = useState({
    firstName: JSON.parse(localStorage.getItem('user'))?.firstName || '',
    lastName: JSON.parse(localStorage.getItem('user'))?.lastName || '',
    bio: JSON.parse(localStorage.getItem('user'))?.bio || '',
    location: JSON.parse(localStorage.getItem('user'))?.location || '',
    work: JSON.parse(localStorage.getItem('user'))?.work || '',
    education: JSON.parse(localStorage.getItem('user'))?.education || ''
  });

  // Lấy thông tin user đăng nhập
  const [avatar, setAvatar] = useState(
    (loggedInUser && loggedInUser.avatar) || '/static/images/avatar/2.jpg'
  );

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Kiểm tra triệt để: id là undefined, null, 'me', hoặc trùng user hiện tại
        if (!id || id === 'me' || String(id) === String(loggedInUser?.id)) {
          setProfileUser({
            ...loggedInUser,
            avatar: loggedInUser?.profilePicture || loggedInUser?.avatar || '/static/images/avatar/2.jpg',
          });
          setFriendStatus('me');
          // Fetch posts của user hiện tại
          const postsRes = await fetch('http://localhost:8080/api/posts', {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          if (postsRes.ok) {
            const postsData = await postsRes.json();
            setPosts(postsData.filter(post => String(post.user?.id) === String(loggedInUser?.id)));
          }
          // Fetch friends của user hiện tại
          const friendsRes = await fetch('http://localhost:8080/api/friends/list', {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          if (friendsRes.ok) {
            const friends = await friendsRes.json();
            setFriends(friends);
          }
          return;
        }

        // Lấy thông tin user khác
        const userRes = await fetch(`http://localhost:8080/api/user/${id}`, {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!userRes.ok) throw new Error('Failed to fetch user data');
        const userData = await userRes.json();
        setProfileUser(userData);

        // Fetch posts của user này
        const postsRes = await fetch(`http://localhost:8080/api/posts/user/${id}`, {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (postsRes.ok) {
          const postsData = await postsRes.json();
          setPosts(postsData);
        }

        // Fetch friends của user này
        const friendsRes = await fetch(`http://localhost:8080/api/friends/list/${id}`, {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (friendsRes.ok) {
          const friends = await friendsRes.json();
          setFriends(friends);
        }

        // Kiểm tra trạng thái bạn bè
        try {
          const myFriendsRes = await fetch('http://localhost:8080/api/friends/list', {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          if (myFriendsRes.ok) {
            const myFriends = await myFriendsRes.json();
            if (Array.isArray(myFriends) && myFriends.some(f => String(f.id) === String(id))) {
              setFriendStatus('friends');
              return;
            }
          }
        } catch (error) {
          console.error('Error fetching friends list:', error);
        }

        // Nếu không phải bạn bè, kiểm tra lời mời đã gửi
        try {
          const sentRes = await fetch('http://localhost:8080/api/friends/requests/sent', {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          if (sentRes.ok) {
            const sent = await sentRes.json();
            if (Array.isArray(sent) && sent.some(u => String(u.id) === String(id))) {
              setFriendStatus('sent');
              return;
            }
          }
        } catch (error) {
          console.error('Error fetching sent requests:', error);
        }

        // Nếu không phải bạn bè và chưa gửi lời mời
        setFriendStatus('not_friends');
      } catch (error) {
        console.error('Error fetching profile data:', error);
        if (profileUser) {
          setFriendStatus('not_friends');
        }
      }
    };

    fetchUserData();
  }, [id, loggedInUser?.id, token]);

  const handleSendFriendRequest = async () => {
    if (!id || String(id) === String(loggedInUser?.id)) return;
    try {
      const res = await fetch(`http://localhost:8080/api/friends/request/${id}`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to send friend request');
      }
      setFriendStatus('sent');
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert(error.message);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      fetch('http://localhost:8080/api/user/avatar', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token
        },
        body: formData
      })
        .then(res => res.json())
        .then(updatedUser => {
          localStorage.setItem('user', JSON.stringify({
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            avatar: updatedUser.profilePicture,
            coverPhoto: updatedUser.coverPhoto
          }));
          window.location.reload();
        })
        .catch(() => alert('Cập nhật avatar thất bại!'));
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      fetch('http://localhost:8080/api/user/cover', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token
        },
        body: formData
      })
        .then(res => res.json())
        .then(updatedUser => {
          // Sau khi upload cover thành công, lấy lại thông tin user mới nhất từ backend
          fetch('http://localhost:8080/api/user/me', {
            headers: {
              'Authorization': 'Bearer ' + token
            }
          })
            .then(res => res.json())
            .then(userInfo => {
              localStorage.setItem('user', JSON.stringify({
                email: userInfo.email,
                firstName: userInfo.firstName,
                lastName: userInfo.lastName,
                avatar: userInfo.profilePicture,
                coverPhoto: userInfo.coverPhoto
              }));
              setCoverPreview(getImageUrl(userInfo.coverPhoto));
            });
        })
        .catch(() => alert('Cập nhật cover photo thất bại!'));
    }
  };

  const getImageUrl = (url) => {
    if (!url) return undefined;
    if (url.startsWith('/uploads/')) {
      return `http://localhost:8080${url}`;
    }
    return url;
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleEditProfile = () => {
    setEditProfileOpen(true);
    setEditProfile({
      firstName: profileUser?.firstName || '',
      lastName: profileUser?.lastName || '',
      bio: profileUser?.bio || '',
      location: profileUser?.location || '',
      work: profileUser?.work || '',
      education: profileUser?.education || ''
    });
  };

  const handleSaveProfile = () => {
    fetch('http://localhost:8080/api/user/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(editProfile)
    })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Cập nhật profile thất bại!');
        }
        return res.json();
      })
      .then(updatedUser => {
        // Cập nhật lại profileUser và localStorage, không reload toàn trang
        setProfileUser(prev => ({
          ...prev,
          ...updatedUser,
          avatar: updatedUser.profilePicture || prev.avatar,
          coverPhoto: updatedUser.coverPhoto || prev.coverPhoto
        }));
        localStorage.setItem('user', JSON.stringify({
          ...JSON.parse(localStorage.getItem('user')),
          ...updatedUser,
          avatar: updatedUser.profilePicture,
          coverPhoto: updatedUser.coverPhoto
        }));
        setEditProfileOpen(false);
      })
      .catch((err) => alert(err.message));
  };

  return (
    <Box>
      {/* Cover Photo */}
      <Box
        sx={{
          height: 300,
          position: 'relative',
          backgroundImage: `url(${coverPreview || getImageUrl(profileUser?.coverPhoto) || '/static/images/cover.jpg'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {friendStatus === 'me' && (
          <>
            <input
              id="cover-upload"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleCoverChange}
            />
            <Button
              variant="contained"
              size="small"
              sx={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }}
              onClick={() => document.getElementById('cover-upload').click()}
            >
              Đổi ảnh bìa
            </Button>
          </>
        )}
        <Box
          sx={{
            position: 'absolute',
            bottom: -60,
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
          }}
        >
          <Avatar
            src={getImageUrl(profileUser?.avatar || profileUser?.profilePicture || '/static/images/avatar/2.jpg')}
            sx={{
              width: 120,
              height: 120,
              border: '4px solid white',
              cursor: friendStatus === 'me' ? 'pointer' : 'default',
            }}
            onClick={() => friendStatus === 'me' && document.getElementById('avatar-upload').click()}
          />
          {friendStatus === 'me' && (
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          )}
        </Box>
      </Box>

      {/* Profile Info */}
      <Container maxWidth="lg" sx={{ mt: 8 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Avatar
                src={getImageUrl(profileUser?.avatar || profileUser?.profilePicture || '/static/images/avatar/2.jpg')}
                sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
              />
              <Typography variant="h5" gutterBottom>
                {profileUser ? `${profileUser.firstName} ${profileUser.lastName}` : 'Loading...'}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {profileUser?.email}
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {profileUser?.bio || 'No bio yet'}
              </Typography>
              
              {/* Friend Status Buttons */}
              {friendStatus === 'me' && (
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={handleEditProfile}
                  sx={{ mb: 2 }}
                >
                  Edit Profile
                </Button>
              )}
              {friendStatus === 'not_friends' && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleSendFriendRequest}
                  sx={{ mb: 2 }}
                >
                  Add Friend
                </Button>
              )}
              {friendStatus === 'sent' && (
                <Button variant="outlined" disabled sx={{ mb: 2 }}>
                  Friend Request Sent
                </Button>
              )}
              {friendStatus === 'friends' && (
                <Button variant="outlined" color="success" disabled sx={{ mb: 2 }}>
                  Friends
                </Button>
              )}

              <Divider sx={{ my: 2 }} />
              
              {/* Profile Details */}
              <Box sx={{ textAlign: 'left' }}>
                {profileUser?.location && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <strong>Location:</strong> {profileUser.location}
                  </Typography>
                )}
                {profileUser?.work && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <strong>Work:</strong> {profileUser.work}
                  </Typography>
                )}
                {profileUser?.education && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <strong>Education:</strong> {profileUser.education}
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper sx={{ mb: 3 }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="fullWidth"
              >
                <Tab label="Posts" />
                <Tab label="Friends" />
              </Tabs>
            </Paper>

            {/* Posts Tab */}
            {tabValue === 0 && (
              <Box>
                {posts.map((post) => (
                  <Card key={post.id} sx={{ mb: 3 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                          component={Link}
                          to={`/profile/${post.user?.id}`}
                          src={getImageUrl(post.user?.profilePicture || post.user?.avatar) || "/static/images/avatar/2.jpg"}
                          sx={{ mr: 2 }}
                        />
                        <Box>
                          <Typography
                            component={Link}
                            to={`/profile/${post.user?.id}`}
                            variant="subtitle1"
                            fontWeight="bold"
                            sx={{ textDecoration: 'none', color: 'inherit' }}
                          >
                            {post.user ? `${post.user.firstName || ""} ${post.user.lastName || ""}`.trim() || "Unknown" : "Unknown"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {post.timestamp}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {post.content}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Button startIcon={<ThumbUpIcon />}>
                          {post.likes || 0} Likes
                        </Button>
                        <Button startIcon={<CommentIcon />}>
                          {(post.comments || []).length} Comments
                        </Button>
                        <Button startIcon={<ShareIcon />}>
                          {post.shares || 0} Shares
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
                {posts.length === 0 && (
                  <Typography sx={{ textAlign: 'center', mt: 3 }}>
                    No posts yet
                  </Typography>
                )}
              </Box>
            )}

            {/* Friends Tab */}
            {tabValue === 1 && (
              <Grid container spacing={2}>
                {friends.map((friend) => (
                  <Grid item xs={12} sm={6} md={4} key={friend.id}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Avatar
                          src={getImageUrl(friend.profilePicture)}
                          sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }}
                        />
                        <Typography variant="subtitle1">
                          {friend.firstName} {friend.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {friend.email}
                        </Typography>
                        <Button
                          component={Link}
                          to={`/profile/${friend.id}`}
                          variant="outlined"
                          size="small"
                          sx={{ mt: 1 }}
                        >
                          View Profile
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
                {friends.length === 0 && (
                  <Typography sx={{ textAlign: 'center', mt: 3, width: '100%' }}>
                    No friends yet
                  </Typography>
                )}
              </Grid>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* Edit Profile Dialog */}
      {editProfileOpen && (
        <Box sx={{ mt: 2, textAlign: 'left' }}>
          <Typography variant="subtitle1">Edit Profile</Typography>
          <input
            type="text"
            placeholder="First Name"
            value={editProfile.firstName}
            onChange={e => setEditProfile({ ...editProfile, firstName: e.target.value })}
            style={{ width: '100%', marginBottom: 8 }}
          />
          <input
            type="text"
            placeholder="Last Name"
            value={editProfile.lastName}
            onChange={e => setEditProfile({ ...editProfile, lastName: e.target.value })}
            style={{ width: '100%', marginBottom: 8 }}
          />
          <input
            type="text"
            placeholder="Bio"
            value={editProfile.bio}
            onChange={e => setEditProfile({ ...editProfile, bio: e.target.value })}
            style={{ width: '100%', marginBottom: 8 }}
          />
          <input
            type="text"
            placeholder="Location"
            value={editProfile.location}
            onChange={e => setEditProfile({ ...editProfile, location: e.target.value })}
            style={{ width: '100%', marginBottom: 8 }}
          />
          <input
            type="text"
            placeholder="Work"
            value={editProfile.work}
            onChange={e => setEditProfile({ ...editProfile, work: e.target.value })}
            style={{ width: '100%', marginBottom: 8 }}
          />
          <input
            type="text"
            placeholder="Education"
            value={editProfile.education}
            onChange={e => setEditProfile({ ...editProfile, education: e.target.value })}
            style={{ width: '100%', marginBottom: 8 }}
          />
          <Button variant="contained" color="primary" onClick={handleSaveProfile} sx={{ mr: 1 }}>Save</Button>
          <Button variant="outlined" color="secondary" onClick={() => setEditProfileOpen(false)}>Cancel</Button>
        </Box>
      )}
    </Box>
  );
};

export default Profile; 