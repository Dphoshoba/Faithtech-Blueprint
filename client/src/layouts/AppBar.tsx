import React from 'react';
import {
  AppBar as MuiAppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Chip,
  Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { useAuth } from '../lib/auth';

interface Props {
  onMenuToggle: () => void;
}

export default function AppBar({ onMenuToggle }: Props) {
  const { user } = useAuth();

  return (
    <MuiAppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: 'linear-gradient(135deg, #1a365d 0%, #2b6cb0 100%)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
      }}
    >
      <Toolbar sx={{ px: { xs: 1, sm: 2 } }}>
        <IconButton
          color="inherit"
          aria-label="open menu"
          edge="start"
          onClick={onMenuToggle}
          sx={{ mr: 1 }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          component="div"
          sx={{
            fontWeight: 700,
            letterSpacing: '-0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <span style={{ fontSize: 22 }}>✝</span>
          FaithTech Blueprint
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        {user && (
          <Box display="flex" alignItems="center" gap={1.5}>
            <Chip
              label={user.role === 'admin' ? 'Admin' : 'Member'}
              size="small"
              sx={{
                backgroundColor: 'rgba(255,255,255,0.15)',
                color: 'white',
                fontWeight: 600,
              }}
            />
            <Tooltip title={user.email}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <AccountCircle sx={{ color: 'white' }} />
              </Box>
            </Tooltip>
          </Box>
        )}
      </Toolbar>
    </MuiAppBar>
  );
}