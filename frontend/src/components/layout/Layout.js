import React from 'react';
import { Box, AppBar, Toolbar, Typography, Container, IconButton, Avatar, Menu, MenuItem } from '@mui/material';
import { AccountCircle, Notifications, Message } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f0f2f5' }}>
      <AppBar 
        position="static" 
        sx={{ 
          bgcolor: '#1877f2',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          borderBottom: '1px solid #166fe5'
        }}
      >
        <Container maxWidth="lg">
          <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
            {/* Logo */}
            <Typography
              variant="h6"
              component={Link}
              to="/"
              sx={{
                textDecoration: 'none',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.5rem',
                '&:hover': {
                  color: '#e4e6eb'
                }
              }}
            >
              Facebook Clone
            </Typography>

            {/* Search Bar */}
            <Box
              sx={{
                flexGrow: 1,
                maxWidth: 600,
                mx: 4,
                display: { xs: 'none', md: 'block' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.15)', borderRadius: '20px', px: 2, py: 0.5 }}>
                <svg width="20" height="20" fill="white" style={{ opacity: 0.7, marginRight: 8 }}><path d="M19.707 18.293l-5.387-5.387A7.928 7.928 0 0016 8a8 8 0 10-8 8 7.928 7.928 0 004.906-1.68l5.387 5.387a1 1 0 001.414-1.414zM2 8a6 6 0 1112 0A6 6 0 012 8z"></path></svg>
                <input
                  type="text"
                  placeholder="Search..."
                  style={{
                    width: '100%',
                    padding: '6px 0',
                    border: 'none',
                    background: 'transparent',
                    color: 'white',
                    fontSize: '1rem',
                    outline: 'none',
                    '::placeholder': { color: 'rgba(255,255,255,0.7)' }
                  }}
                />
              </Box>
            </Box>

            {/* Right Side Icons */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton 
                sx={{ 
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.10)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.20)' }
                }}
              >
                <Message />
              </IconButton>
              <IconButton 
                sx={{ 
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.10)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.20)' }
                }}
              >
                <Notifications />
              </IconButton>
              <IconButton
                onClick={handleMenu}
                sx={{ 
                  p: 0,
                  '&:hover': { opacity: 0.8 }
                }}
              >
                <Avatar
                  src={user?.profilePicture}
                  alt={user?.firstName}
                  sx={{ 
                    width: 40, 
                    height: 40,
                    border: '2px solid white'
                  }}
                />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    borderRadius: '8px'
                  }
                }}
              >
                <MenuItem 
                  component={Link} 
                  to="/profile" 
                  onClick={handleClose}
                  sx={{ 
                    py: 1,
                    '&:hover': { bgcolor: '#f0f2f5' }
                  }}
                >
                  Profile
                </MenuItem>
                <MenuItem 
                  onClick={handleLogout}
                  sx={{ 
                    py: 1,
                    color: '#dc3545',
                    '&:hover': { bgcolor: '#f0f2f5' }
                  }}
                >
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Main Content */}
      <Container 
        maxWidth="lg" 
        sx={{ 
          flexGrow: 1,
          py: 3,
          px: { xs: 2, sm: 3 }
        }}
      >
        {children}
      </Container>
    </Box>
  );
};

export default Layout; 