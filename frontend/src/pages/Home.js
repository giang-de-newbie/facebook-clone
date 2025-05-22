import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Avatar,
  IconButton,
  TextField,
  Button,
  Divider,
  Grid,
  Paper,
} from '@mui/material';
import {
  Photo as PhotoIcon,
  VideoLibrary as VideoIcon,
  EmojiEmotions as EmojiIcon,
  ThumbUp as ThumbUpIcon,
  ChatBubbleOutline as CommentIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { Link } from 'react-router-dom';
import axios from '../axiosInstance';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ content: '', media: null, mediaType: null });
  const [commentContent, setCommentContent] = useState({});
  const [editingComment, setEditingComment] = useState({});
  const [editCommentContent, setEditCommentContent] = useState({});

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'video/*': ['.mp4', '.mov'],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      const isVideo = file.type.startsWith('video/');
      setNewPost({
        ...newPost,
        media: file,
        mediaType: isVideo ? 'video' : 'image'
      });
    },
  });

  // Lấy thông tin user từ localStorage
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  const getImageUrl = (url) => {
    if (!url) return undefined;
    if (url.startsWith('/uploads/')) {
      return `http://localhost:8080${url}`;
    }
    return url;
  };

  // Lấy danh sách bài viết từ backend
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get('/api/posts', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = response.data;
        // Ensure data is an array and each post has a comments array
        const postsArray = Array.isArray(data) ? data : [];
        const postsWithComments = postsArray.map(post => ({
          ...post,
          comments: Array.isArray(post.comments) ? post.comments : [],
          likes: post.likes || 0 // Đảm bảo có số lượt like
        }));
        setPosts(postsWithComments.reverse());
      } catch (error) {
        console.error('Error fetching posts:', error);
        setPosts([]);
      }
    };

    if (token) {
      fetchPosts();
    }
  }, [token]);

  // Đăng bài mới
  const handlePostSubmit = async () => {
    try {
    if (!newPost.content.trim() && !newPost.media) return;
      
      let mediaUrl = '';
    if (newPost.media) {
        // Upload media qua endpoint riêng
      const formData = new FormData();
      formData.append('file', newPost.media);
        console.log('Uploading media:', {
          type: newPost.mediaType,
          file: newPost.media,
          fileName: newPost.media.name,
          fileSize: newPost.media.size,
          fileType: newPost.media.type
        });

        const endpoint = newPost.mediaType === 'video' ? 'http://localhost:8080/api/posts/upload-video' : 'http://localhost:8080/api/posts/upload-image';
        
        try {
          const uploadResponse = await axios.post(endpoint, formData, {
            headers: { 
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${token}`
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
          });
          mediaUrl = uploadResponse.data.url;
          console.log('Upload successful:', mediaUrl);
        } catch (uploadError) {
          console.error('Error uploading media:', uploadError);
          if (uploadError.response) {
            console.error('Error data:', uploadError.response.data);
            console.error('Error status:', uploadError.response.status);
            console.error('Error headers:', uploadError.response.headers);
            throw new Error(uploadError.response.data.message || 'Failed to upload media. Please try again.');
          } else if (uploadError.request) {
            console.error('No response received:', uploadError.request);
            throw new Error('No response from server. Please check your connection.');
          } else {
            console.error('Error message:', uploadError.message);
            throw new Error(uploadError.message || 'Failed to upload media. Please try again.');
          }
        }
      }

      // Đảm bảo content không rỗng và media là string
    const postData = {
      content: newPost.content.trim() || ' ',
        image: newPost.mediaType === 'image' ? mediaUrl : null,
        video: newPost.mediaType === 'video' ? mediaUrl : null
    };

      console.log('Creating post with data:', postData);

      const response = await axios.post('http://localhost:8080/api/posts', postData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const post = response.data;
      console.log('Post created successfully:', post);
      
    // Ensure comments is always an array
    const newPostWithComments = { ...post, comments: post.comments || [] };
    setPosts([newPostWithComments, ...posts]);
      setNewPost({ content: '', media: null, mediaType: null });
    } catch (error) {
      console.error('Error creating post:', error);
      alert(error.message || 'Failed to create post. Please try again.');
    }
  };

  const handleVideoUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        console.log('Selected video file:', file);
        setNewPost({
          ...newPost,
          media: file,
          mediaType: 'video'
        });
      }
    };
    input.click();
  };

  // Like post
  const handleLike = async (postId) => {
    if (!token) {
      console.error('No token found');
      return;
    }

    try {
      const response = await axios.post(`http://localhost:8080/api/posts/${postId}/like`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const updatedPost = response.data;
      
      // Cập nhật state với post mới
      setPosts(currentPosts => 
        currentPosts.map(p => 
          p.id === updatedPost.id 
            ? {
                ...updatedPost,
                comments: Array.isArray(updatedPost.comments) ? updatedPost.comments : [],
                likes: updatedPost.likes || 0
              }
            : p
        )
      );
    } catch (error) {
      console.error('Error liking/unliking post:', error);
      alert('Failed to like/unlike post. Please try again.');
    }
  };

  // Share post
  const handleShare = async (postId) => {
    try {
      const response = await axios.post(`http://localhost:8080/api/posts/${postId}/share`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const sharedPost = response.data;
      console.log('Shared post response:', sharedPost);
      // Thêm post mới vào đầu danh sách, bổ sung mặc định các trường nếu thiếu
      setPosts(posts => [
        {
          ...sharedPost,
          comments: Array.isArray(sharedPost.comments) ? sharedPost.comments : [],
          likes: typeof sharedPost.likes === 'number' ? sharedPost.likes : 0,
          shares: typeof sharedPost.shares === 'number' ? sharedPost.shares : 0,
          user: sharedPost.user || user
        },
        ...posts
      ]);
      alert('Share post thành công!');
    } catch (error) {
      console.error('Error sharing post:', error);
      alert(error?.response?.data?.message || error.message || 'Failed to share post. Please try again.');
    }
  };

  // Xoá post
  const handleDeletePost = async (postId) => {
    try {
      await axios.delete(`http://localhost:8080/api/posts/${postId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setPosts(posts => posts.filter(p => p.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    }
  };

  // Thêm comment
  const handleAddComment = async (postId) => {
    if (!commentContent[postId]?.trim()) return;
    try {
      const response = await axios.post(`http://localhost:8080/api/posts/${postId}/comments`, 
        { content: commentContent[postId] },
        {
      headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const comment = response.data;
        setPosts(posts => posts.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              comments: Array.isArray(p.comments) ? [...p.comments, comment] : [comment]
            };
          }
          return p;
        }));
        setCommentContent({ ...commentContent, [postId]: '' });
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    }
  };

  // Sửa comment
  const handleEditComment = (commentId, postId) => {
    fetch(`http://localhost:8080/api/posts/comments/${commentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ content: editCommentContent[commentId] })
    })
      .then(res => res.json())
      .then(updatedComment => {
        setPosts(posts => posts.map(p =>
          p.id === postId ? {
            ...p,
            comments: p.comments.map(c => c.id === commentId ? updatedComment : c)
          } : p
        ));
        setEditingComment({ ...editingComment, [commentId]: false });
      });
  };

  // Xoá comment
  const handleDeleteComment = (commentId, postId) => {
    fetch(`http://localhost:8080/api/posts/comments/${commentId}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(() => {
        setPosts(posts => posts.map(p =>
          p.id === postId ? {
            ...p,
            comments: p.comments.filter(c => c.id !== commentId)
          } : p
        ));
      });
  };

  return (
    <>
      {/* Thông tin người dùng đăng nhập */}
      <Box sx={{ mb: 3, p: 2, background: '#f5f5f5', borderRadius: 2, display: 'flex', alignItems: 'center' }}>
        <Avatar src={getImageUrl(user?.profilePicture || user?.avatar) || "/static/images/avatar/2.jpg"} sx={{ width: 56, height: 56, mr: 2 }} />
        <Box>
          <Typography variant="h6">{user ? `${user.firstName} ${user.lastName}` : 'User'}</Typography>
          <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
        </Box>
      </Box>
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        {/* Create Post Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                  src={getImageUrl(user?.profilePicture || user?.avatar) || "/static/images/avatar/2.jpg"}
                sx={{ width: 40, height: 40, mr: 2 }}
              />
              <TextField
                fullWidth
                placeholder="What's on your mind?"
                variant="outlined"
                multiline
                rows={2}
                value={newPost.content}
                onChange={(e) =>
                  setNewPost({ ...newPost, content: e.target.value })
                }
              />
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  startIcon={<PhotoIcon />}
                  color="primary"
                  {...getRootProps()}
                >
                  Photo
                  <input {...getInputProps()} />
                </Button>
                <Button 
                  startIcon={<VideoIcon />} 
                  color="primary"
                  onClick={handleVideoUpload}
                >
                  Video
                </Button>
                <Button startIcon={<EmojiIcon />} color="primary">
                  Feeling
                </Button>
              </Box>
              <Button
                variant="contained"
                color="primary"
                onClick={handlePostSubmit}
                disabled={!newPost.content.trim() && !newPost.media}
              >
                Post
              </Button>
            </Box>
            {newPost.media && (
              <Box sx={{ mt: 2 }}>
                {newPost.mediaType === 'video' ? (
                  <video
                    src={URL.createObjectURL(newPost.media)}
                    controls
                    style={{ maxWidth: '100%', maxHeight: 300 }}
                  />
                ) : (
                <img
                  src={URL.createObjectURL(newPost.media)}
                  alt="Preview"
                  style={{ maxWidth: '100%', maxHeight: 300 }}
                />
                )}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Posts Feed */}
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
              {post.image && (
                <CardMedia
                  component="img"
                  image={getImageUrl(post.image)}
                  alt="Post image"
                  sx={{ borderRadius: 1, mb: 2 }}
                />
              )}
              {post.video && (
                <CardMedia
                  component="video"
                  src={getImageUrl(post.video)}
                  controls
                  sx={{ borderRadius: 1, mb: 2 }}
                />
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Button
                  startIcon={<ThumbUpIcon />}
                  onClick={() => handleLike(post.id)}
                  variant={post.likedByCurrentUser ? "contained" : "text"}
                  size="small"
                  sx={{
                    color: post.likedByCurrentUser ? 'white' : 'text.primary',
                    backgroundColor: post.likedByCurrentUser ? 'primary.main' : 'transparent',
                    '&:hover': {
                      backgroundColor: post.likedByCurrentUser ? 'primary.dark' : 'action.hover'
                    },
                    minWidth: '100px'
                  }}
                >
                  {post.likes} {post.likedByCurrentUser ? "Unlike" : "Like"}
                </Button>
                <Button 
                  startIcon={<CommentIcon />}
                  variant="text"
                  size="small"
                >
                  {(post.comments || []).length} Comments
                </Button>
                <Button 
                  startIcon={<ShareIcon />}
                  variant="text"
                  size="small"
                  onClick={() => handleShare(post.id)}
                >
                  {post.shares} Shares
                </Button>
              </Box>
              <Divider />
                {/* Danh sách comment */}
                <Box sx={{ mt: 2, mb: 1 }}>
                  {(post.comments || []).map((comment) => (
                    <Box key={comment.id} sx={{ display: 'flex', alignItems: 'center', mt: 1, ml: 4 }}>
                      <Avatar
                        component={Link}
                        to={`/profile/${comment.user?.id}`}
                        src={getImageUrl(comment.user?.profilePicture || comment.user?.avatar) || "/static/images/avatar/2.jpg"}
                        sx={{ width: 28, height: 28, mr: 1 }}
                      />
                      <Box>
                        <Typography
                          component={Link}
                          to={`/profile/${comment.user?.id}`}
                          variant="subtitle2"
                          fontWeight="bold"
                          sx={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          {comment.user ? `${comment.user.firstName || ""} ${comment.user.lastName || ""}`.trim() || "Unknown" : "Unknown"}
                        </Typography>
                        {editingComment[comment.id] ? (
                          <>
                            <TextField
                              value={editCommentContent[comment.id] || comment.content}
                              onChange={e => setEditCommentContent({ ...editCommentContent, [comment.id]: e.target.value })}
                              size="small"
                              sx={{ mb: 1 }}
                            />
                            <Button size="small" onClick={() => handleEditComment(comment.id, post.id)}>Save</Button>
                            <Button size="small" onClick={() => setEditingComment({ ...editingComment, [comment.id]: false })}>Cancel</Button>
                          </>
                        ) : (
                          <>
                            <Typography variant="body2">{comment.content}</Typography>
                            {comment.user && user && String(comment.user.id) === String(user.id) && (
                              <>
                                <Button size="small" onClick={() => setEditingComment({ ...editingComment, [comment.id]: true })}>Edit</Button>
                                <Button size="small" color="error" onClick={() => handleDeleteComment(comment.id, post.id)}>Delete</Button>
                              </>
                            )}
                          </>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Avatar src={getImageUrl(user?.profilePicture || user?.avatar) || "/static/images/avatar/2.jpg"} sx={{ width: 32, height: 32 }} />
                <TextField
                  fullWidth
                  placeholder="Write a comment..."
                  variant="outlined"
                  size="small"
                    value={commentContent[post.id] || ''}
                    onChange={(e) => setCommentContent({ ...commentContent, [post.id]: e.target.value })}
                />
              </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => handleAddComment(post.id)}
                  >
                    Add Comment
                  </Button>
                </Box>
            </CardContent>
          </Card>
        ))}
      </Grid>

      {/* Right Sidebar */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Suggested Friends
          </Typography>
          {/* Add suggested friends list here */}
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Trending Topics
          </Typography>
          {/* Add trending topics list here */}
        </Paper>
      </Grid>
    </Grid>
    </>
  );
};

export default Home; 