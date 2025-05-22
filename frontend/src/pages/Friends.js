import React, { useState, useEffect } from 'react';
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
  TextField,
  InputAdornment,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

const Friends = () => {
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const token = localStorage.getItem('token');

  const getImageUrl = (url) => {
    if (!url) return "/static/images/avatar/2.jpg";
    if (url.startsWith('/uploads/')) {
      return `http://localhost:8080${url}`;
    }
    return url;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Lấy danh sách bạn bè
        const friendsRes = await fetch('http://localhost:8080/api/friends/list', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!friendsRes.ok) throw new Error('Failed to fetch friends');
        const friendsData = await friendsRes.json();
        setFriends(Array.isArray(friendsData) ? friendsData : []);

        // Lấy danh sách lời mời đã nhận
        const requestsRes = await fetch('http://localhost:8080/api/friends/requests/received', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!requestsRes.ok) throw new Error('Failed to fetch friend requests');
        const requestsData = await requestsRes.json();
        console.log('Received friend requests:', requestsData); // Debug log
        setFriendRequests(Array.isArray(requestsData) ? requestsData : []);

        // Lấy danh sách lời mời đã gửi
        const sentRequestsRes = await fetch('http://localhost:8080/api/friends/requests/sent', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!sentRequestsRes.ok) throw new Error('Failed to fetch sent requests');
        const sentRequestsData = await sentRequestsRes.json();
        console.log('Sent friend requests:', sentRequestsData); // Debug log
      } catch (error) {
        console.error('Error fetching data:', error);
        setFriends([]);
        setFriendRequests([]);
      }
    };

    fetchData();
  }, [token]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleAcceptRequest = async (id) => {
    try {
      const res = await fetch(`http://localhost:8080/api/friends/accept/${id}`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!res.ok) throw new Error('Failed to accept friend request');
      
      setFriendRequests(reqs => reqs.filter(r => r.id !== id));
      // Sau khi accept, reload friends list
      const friendsRes = await fetch('http://localhost:8080/api/friends/list', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!friendsRes.ok) throw new Error('Failed to fetch updated friends list');
      const friendsData = await friendsRes.json();
      if (Array.isArray(friendsData)) {
        setFriends(friendsData);
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('Failed to accept friend request');
    }
  };

  const handleRejectRequest = async (id) => {
    try {
      const res = await fetch(`http://localhost:8080/api/friends/remove/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!res.ok) throw new Error('Failed to reject friend request');
      setFriendRequests(reqs => reqs.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      alert('Failed to reject friend request');
    }
  };

  const handleUnfriend = async (id) => {
    try {
      const res = await fetch(`http://localhost:8080/api/friends/remove/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!res.ok) throw new Error('Failed to unfriend');
      setFriends(frs => frs.filter(f => f.id !== id));
    } catch (error) {
      console.error('Error unfriending:', error);
      alert('Failed to unfriend');
    }
  };

  const filteredFriends = friends.filter((friend) =>
    (`${friend.firstName} ${friend.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Container maxWidth="lg">
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
        >
          <Tab label={`Friend Requests (${friendRequests.length})`} />
          <Tab label={`All Friends (${friends.length})`} />
        </Tabs>
      </Paper>

      {tabValue === 0 ? (
        // Friend Requests Tab
        <Box>
          {friendRequests.length === 0 ? (
            <Typography variant="body1" sx={{ textAlign: 'center', mt: 3 }}>
              No pending friend requests
            </Typography>
          ) : (
            <Grid container spacing={3}>
              {friendRequests.map((request) => (
                <Grid item xs={12} sm={6} md={4} key={request.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                          component={Link}
                          to={`/profile/${request.id}`}
                          src={getImageUrl(request.profilePicture)}
                          sx={{ width: 60, height: 60, mr: 2 }}
                        />
                        <Box>
                          <Typography
                            component={Link}
                            to={`/profile/${request.id}`}
                            variant="subtitle1"
                            sx={{ textDecoration: 'none', color: 'inherit' }}
                          >
                            {request.firstName} {request.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {request.email}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          startIcon={<CheckIcon />}
                          onClick={() => handleAcceptRequest(request.id)}
                          fullWidth
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<CloseIcon />}
                          onClick={() => handleRejectRequest(request.id)}
                          fullWidth
                        >
                          Decline
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      ) : (
        // All Friends Tab
        <Box>
          <TextField
            fullWidth
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Grid container spacing={3}>
            {filteredFriends.map((friend) => (
              <Grid item xs={12} sm={6} md={4} key={friend.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        component={Link}
                        to={`/profile/${friend.id}`}
                        src={getImageUrl(friend.profilePicture)}
                        sx={{ width: 60, height: 60, mr: 2 }}
                      />
                      <Box>
                        <Typography
                          component={Link}
                          to={`/profile/${friend.id}`}
                          variant="subtitle1"
                          sx={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          {friend.firstName} {friend.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {friend.email}
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleUnfriend(friend.id)}
                      fullWidth
                    >
                      Unfriend
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Container>
  );
};

export default Friends; 