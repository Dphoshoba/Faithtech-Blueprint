import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  Box,
  Toolbar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AppBar from './AppBar';
import Sidebar from './Sidebar';

export default function AppLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar onMenuToggle={() => setSidebarOpen((o) => !o)} />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          background: 'background.default',
        }}
      >
        <Toolbar /> // spacer for AppBar
        <Box sx={{ p: { xs: 1.5, md: 3 }, maxWidth: 1400, width: '100%', mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}