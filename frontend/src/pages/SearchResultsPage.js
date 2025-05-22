import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Box, Typography, Grid, Card, CardContent, Avatar, List, ListItem, ListItemAvatar, ListItemText, Divider, Tab, Tabs, InputAdornment, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Link } from 'react-router-dom';

const getImageUrl = (url) => {
  if (!url) return "/static/images/avatar/2.jpg";
  if (url.startsWith('/uploads/')) return `http://localhost:8080${url}`;
  return url;
};

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const SearchResultsPage = () => {
  const query = useQuery().get('q') || '';
  const [searchResults, setSearchResults] = useState({ users: [], posts: [] });
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [searchInput, setSearchInput] = useState(query);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    fetch(`http://localhost:8080/api/search?query=${encodeURIComponent(query)}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(res => res.json())
      .then(data => setSearchResults({
        users: Array.isArray(data.users) ? data.users : [],
        posts: Array.isArray(data.posts) ? data.posts : []
      }))
      .catch(() => setSearchResults({ users: [], posts: [] }))
      .finally(() => setLoading(false));
  }, [query, token]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSearchInput = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    window.location.href = `/search?q=${encodeURIComponent(searchInput)}`;
  };

  const users = Array.isArray(searchResults.users) ? searchResults.users : [];
  const posts = Array.isArray(searchResults.posts) ? searchResults.posts : [];

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <form onSubmit={handleSearchSubmit}>
          <TextField
            fullWidth
            placeholder="Search for people or posts..."
            value={searchInput}
            onChange={handleSearchInput}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </form>
        <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth" sx={{ mb: 2 }}>
          <Tab label={`People (${users.length})`} />
          <Tab label={`Posts (${posts.length})`} />
        </Tabs>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : (
          <>
            {tabValue === 0 ? (
              <Grid container spacing={3}>
                {users.map((user) => (
                  <Grid item xs={12} sm={6} md={4} key={user.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar src={getImageUrl(user.profilePicture)} sx={{ width: 60, height: 60, mr: 2 }} />
                          <Box>
                            <Typography component={Link} to={`/profile/${user.id}`} variant="subtitle1" sx={{ textDecoration: 'none', color: 'inherit' }}>
                              {user.firstName} {user.lastName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
                {users.length === 0 && <Typography sx={{ mt: 3, width: '100%', textAlign: 'center' }}>No people found</Typography>}
              </Grid>
            ) : (
              <Box>
                {users.length > 0 ? (
                  users.map((user) => {
                    const userPosts = posts.filter(
                      (post) => post.user && String(post.user.id) === String(user.id)
                    );
                    return (
                      <Box key={user.id} sx={{ mb: 4 }}>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                          Bài viết của {user.firstName} {user.lastName}
                        </Typography>
                        {userPosts.length > 0 ? (
                          userPosts.map((post) => (
                            <Card key={post.id} sx={{ mb: 2 }}>
                              <CardContent>
                                <Typography variant="body1" sx={{ mb: 2 }}>
                                  {post.content}
                                </Typography>
                                {post.image && (
                                  <Box
                                    component="img"
                                    src={getImageUrl(post.image)}
                                    alt="Post image"
                                    sx={{
                                      width: '100%',
                                      maxHeight: 400,
                                      objectFit: 'contain',
                                      borderRadius: 1,
                                    }}
                                  />
                                )}
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <Typography color="text.secondary">
                            Người dùng này chưa có bài viết nào.
                          </Typography>
                        )}
                      </Box>
                    );
                  })
                ) : (
                  <>
                    {posts.map((post) => (
                      <Card key={post.id} sx={{ mb: 3 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar src={getImageUrl(post.user?.profilePicture)} sx={{ mr: 2 }} />
                            <Box>
                              <Typography component={Link} to={`/profile/${post.user?.id}`} variant="subtitle1" sx={{ textDecoration: 'none', color: 'inherit' }}>
                                {post.user ? `${post.user.firstName} ${post.user.lastName}` : 'Unknown'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">{new Date(post.timestamp).toLocaleString()}</Typography>
                            </Box>
                          </Box>
                          <Typography variant="body1" sx={{ mb: 2 }}>{post.content}</Typography>
                          {post.image && (
                            <Box component="img" src={getImageUrl(post.image)} alt="Post image" sx={{ width: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: 1 }} />
                          )}
                        </CardContent>
                      </Card>
                    ))}
                    {posts.length === 0 && (
                      <Typography sx={{ mt: 3, textAlign: 'center' }}>
                        No posts found
                      </Typography>
                    )}
                  </>
                )}
              </Box>
            )}
          </>
        )}
      </Box>
    </Container>
  );
};

export default SearchResultsPage; 