import React from 'react';
import {
  Drawer,
  Box,
  Toolbar,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Assessment as AssessmentIcon,
  Build as BuildIcon,
  Build as TemplateIcon,
  People as PeopleIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  PersonAdd as LeadIcon,
  Person as PersonIcon,
  ExitToApp as ExitToAppIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  to: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <DashboardIcon />, to: '/dashboard' },
  { label: 'Assessments', icon: <AssessmentIcon />, to: '/assessments' },
  { label: 'Templates', icon: <TemplateIcon />, to: '/templates' },
  { label: 'Profile', icon: <PersonIcon />, to: '/profile' },
  { label: 'Admin: Assessments', icon: <AssessmentIcon />, to: '/admin/assessments', adminOnly: true },
  { label: 'Admin: Templates', icon: <BuildIcon />, to: '/admin/templates', adminOnly: true },
  { label: 'Admin: Users', icon: <PeopleIcon />, to: '/admin/users', adminOnly: true },
  { label: 'Admin: Analytics', icon: <AnalyticsIcon />, to: '/admin/analytics', adminOnly: true },
  { label: 'Admin: Leads', icon: <LeadIcon />, to: '/admin/leads', adminOnly: true },
  { label: 'Admin: Settings', icon: <SettingsIcon />, to: '/admin/settings', adminOnly: true },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ background: 'linear-gradient(135deg, #1a365d 0%, #2b6cb0 100%)', color: 'white' }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
          ✝ FaithTech
        </Typography>
      </Toolbar>

      <Box sx={{ overflowY: 'auto', py: 1 }}>
        <List disablePadding>
          {visibleItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <ListItemButton
                key={item.to}
                selected={active}
                onClick={() => {
                  navigate(item.to);
                  if (isMobile) onClose();
                }}
                sx={{
                  mx: 1,
                  my: 0.5,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.light',
                    color: 'primary.dark',
                    '&:hover': { backgroundColor: 'primary.light' },
                  },
                  '&:hover': { backgroundColor: 'action.hover' },
                }}
              >
                <ListItemIcon sx={{ color: active ? 'primary.main' : 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      <Divider />

      <Box sx={{ p: 2, mt: 'auto' }}>
        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2b6cb0, #1a365d)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
            }}
          >
            {user?.firstName?.charAt(0) || 'U'}
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
        </Box>
        <ListItemButton
          onClick={logout}
          sx={{ mx: 0, borderRadius: 1, '&:hover': { color: 'error.main', backgroundColor: 'error.light' } }}
        >
          <ListItemIcon>
            <ExitToAppIcon sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText primary="Sign out" />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={open}
      onClose={onClose}
      sx={{
        width: 260,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 260,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}