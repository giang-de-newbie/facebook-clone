import React, { useState, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
  InputBase,
} from '@mui/material';
import {
  Search as SearchIcon,
  AccountCircle,
  Home as HomeIcon,
  People as PeopleIcon,
  Message as MessageIcon,
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import SearchResults from '../components/search/SearchResults';
import NotificationBell from '../components/NotificationBell';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: 20,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

const MainLayout = () => {
  const navigate = useNavigate();
  const [anchorElUser, setAnchorElUser] = useState(null);

  // State và logic cho search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef(null);

  const triggerSearch = async (query) => {
    if (query.trim()) {
      try {
        const response = await fetch(`http://localhost:8080/api/search?query=${encodeURIComponent(query)}`, {
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new TypeError("Response was not JSON");
        }

        const data = await response.json();
        
        // Validate and sanitize the response data
        const sanitizedData = {
          users: Array.isArray(data.users) ? data.users.map(user => ({
            id: user.id,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            profilePicture: user.profilePicture || ''
          })) : [],
          posts: Array.isArray(data.posts) ? data.posts.map(post => ({
            id: post.id,
            content: post.content || '',
            user: post.user ? {
              id: post.user.id,
              firstName: post.user.firstName || '',
              lastName: post.user.lastName || '',
              profilePicture: post.user.profilePicture || ''
            } : null
          })) : []
        };

        setSearchResults(sanitizedData);
        setShowResults(true);
      } catch (error) {
        console.error('Error searching:', error);
        setSearchResults(null);
        setShowResults(false);
      }
    } else {
      setSearchResults(null);
      setShowResults(false);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setShowResults(true);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      triggerSearch(query);
    }, 300);
  };

  const handleClickOutside = (e) => {
    if (!e.target.closest('.search-container')) {
      setShowResults(false);
    }
  };

  React.useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    handleCloseUserMenu();
    navigate('/login');
  };

  const user = JSON.parse(localStorage.getItem('user'));
  const getImageUrl = (url) => {
    if (!url) return undefined;
    if (url.startsWith('/uploads/')) {
      return `http://localhost:8080${url}`;
    }
    return url;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" sx={{ bgcolor: '#1877f2', color: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', borderBottom: '1px solid #166fe5' }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ display: { xs: 'none', sm: 'flex' }, mr: 2, color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.5rem', '&:hover': { color: '#e4e6eb' } }}
              onClick={() => navigate('/home')}
            >
              Facebook Clone
            </Typography>

            {/* Search Bar mới */}
            <Box sx={{ position: 'relative', minWidth: 250, mx: 2 }} className="search-container">
              <InputBase
                fullWidth
                size="small"
                placeholder="Search…"
                value={searchQuery}
                onChange={handleSearch}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    triggerSearch(searchQuery);
                  }
                }}
                startAdornment={
                  <IconButton
                    onClick={() => triggerSearch(searchQuery)}
                    edge="start"
                    size="small"
                    aria-label="search"
                    tabIndex={0}
                    sx={{ color: 'white' }}
                  >
                    <SearchIcon />
                  </IconButton>
                }
                sx={{
                  bgcolor: 'rgba(255,255,255,0.15)',
                  borderRadius: 2,
                  pl: 4,
                  pr: 1,
                  height: 40,
                  boxShadow: 1,
                  color: 'white',
                  '& input': { color: 'white' },
                  '& input::placeholder': { color: 'rgba(255,255,255,0.7)' }
                }}
                inputProps={{ 'aria-label': 'search' }}
              />
              {showResults && searchResults && (
                <SearchResults
                  results={searchResults}
                  onClose={() => setShowResults(false)}
                />
              )}
            </Box>

            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
              <IconButton sx={{ color: 'white' }} onClick={() => navigate('/home')}>
                <HomeIcon />
              </IconButton>
              <IconButton sx={{ color: 'white' }} onClick={() => navigate('/friends')}>
                <PeopleIcon />
              </IconButton>
              <IconButton sx={{ color: 'white' }}>
                <MessageIcon />
              </IconButton>
            </Box>

            <Box sx={{ flexGrow: 0 }}>
              <NotificationBell />

              <Tooltip title="Open settings">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0, ml: 2 }}>
                  <Avatar alt="User Name" src={getImageUrl(user?.avatar) || "/static/images/avatar/2.jpg"} />
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: '45px' }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                <MenuItem onClick={() => { navigate('/profile/me'); handleCloseUserMenu(); }}>
                  <Typography textAlign="center">Profile</Typography>
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <Typography textAlign="center">Logout</Typography>
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', py: 3 }}>
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default MainLayout; 