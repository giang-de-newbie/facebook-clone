import React from 'react';
import { Paper, List, ListItem, ListItemAvatar, Avatar, ListItemText, Typography, Divider } from '@mui/material';
import { Link } from 'react-router-dom';

const getImageUrl = (url) => {
  if (!url) return "/static/images/avatar/2.jpg";
  if (url.startsWith('/uploads/')) return `http://localhost:8080${url}`;
  return url;
};

const SearchResults = ({ results, onClose }) => {
  if (!results || (!results.users?.length && !results.posts?.length)) {
    return (
      <Paper sx={{ mt: 1, p: 2, position: 'absolute', width: '100%', zIndex: 10 }}>
        <Typography variant="body1">No results found</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ mt: 1, maxHeight: 400, overflow: 'auto', position: 'absolute', width: '100%', zIndex: 10 }}>
      {results.users?.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ p: 2, bgcolor: 'grey.100' }}>People</Typography>
          <List>
            {results.users.map((user) => (
              <React.Fragment key={user.id}>
                <ListItem component={Link} to={`/profile/${user.id}`} onClick={onClose}>
                  <ListItemAvatar>
                    <Avatar src={getImageUrl(user.profilePicture)} />
                  </ListItemAvatar>
                  <ListItemText primary={`${user.firstName} ${user.lastName}`} secondary={user.email} />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </>
      )}
      
      {results.posts?.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ p: 2, bgcolor: 'grey.100' }}>Posts</Typography>
          <List>
            {results.posts.map((post) => (
              <React.Fragment key={post.id}>
                <ListItem component={Link} to={`/post/${post.id}`} onClick={onClose}>
                  <ListItemAvatar>
                    <Avatar src={getImageUrl(post.user?.profilePicture)} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={post.content.substring(0, 100) + (post.content.length > 100 ? '...' : '')}
                    secondary={`Posted by ${post.user?.firstName || ''} ${post.user?.lastName || ''}`}
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </>
      )}
    </Paper>
  );
};

export default SearchResults; 