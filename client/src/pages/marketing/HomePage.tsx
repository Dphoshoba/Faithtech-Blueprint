import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
} from '@mui/material';
import {
  Church as ChurchIcon,
  People as PeopleIcon,
  Handshake as HandshakeIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function HomePageMarketing() {
  const navigate = useNavigate();

  return (
    <Box>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1a365d 0%, #2b6cb0 100%)',
          color: 'white',
          py: { xs: 8, md: 10 },
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Chip label="For Churches & Ministries" sx={{ mb: 2, background: 'rgba(255,255,255,0.15)' }} />
              <Typography variant="h2" component="h1" sx={{ fontWeight: 800, mb: 2, lineHeight: 1.15 }}>
                Transform Your Ministry With Technology
              </Typography>
              <Typography variant="h6" sx={{ mb: 3, opacity: 0.9, maxWidth: 560 }}>
                FaithTech Blueprint gives churches the tools to streamline operations,
                engage communities, and grow ministries all in one platform.
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button variant="contained" size="large" sx={{ background: '#d69e2e', color: '#1a2023', '&:hover': { background: '#b7791f' } }} onClick={() => navigate('/assessments')}>
                  Start Free Assessment
                </Button>
                <Button variant="outlined" size="large" sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }} onClick={() => navigate('/login')}>
                  Sign In
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={5}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <ChurchIcon sx={{ fontSize: 220, opacity: 0.15 }} />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" component="h2" align="center" sx={{ mb: 1, fontWeight: 700 }}>
          Everything Your Church Needs
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 5, maxWidth: 600, mx: 'auto' }}>
          From health assessments to community engagement, FaithTech Blueprint
          brings all your ministry operations together.
        </Typography>
        <Grid container spacing={3}>
          {[
            { icon: <ChurchIcon />, title: 'Church Health Assessments', desc: '5 question types, automatic scoring, personalized recommendations.' },
            { icon: <PeopleIcon />, title: 'Community Engagement', desc: 'Track members, groups, and attendance with real-time analytics.' },
            { icon: <HandshakeIcon />, title: 'Volunteer Coordination', desc: 'Schedule, assign, and recognize volunteers across ministries.' },
            { icon: <TrendingUpIcon />, title: 'Growth Analytics', desc: 'Data-driven insights to guide strategic ministry decisions.' },
          ].map((f, i) => (
            <Grid item xs={12} sm={6} lg={3} key={i}>
              <Card sx={{ height: '100%', textAlign: 'left' }}>
                <CardContent>
                  <Box sx={{ color: 'primary.main', mb: 1 }}>{f.icon}</Box>
                  <Typography variant="h6" sx={{ mb: 1 }}>{f.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{f.desc}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Box sx={{ background: '#f7fafc', py: 8 }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h3" component="h2" sx={{ mb: 2, fontWeight: 700 }}>
            Ready to get started?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Join churches across the country using FaithTech Blueprint.
          </Typography>
          <Button variant="contained" size="large" onClick={() => navigate('/register')}>
            Create Free Account
          </Button>
        </Container>
      </Box>
    </Box>
  );
}
