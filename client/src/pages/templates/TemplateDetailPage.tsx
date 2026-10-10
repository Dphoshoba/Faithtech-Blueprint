import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Skeleton,
  Chip,
  Divider,
  LinearProgress,
  Pagination,
} from '@mui/material';
import { Search as SearchIcon, Download as DownloadIcon, FilterList as FilterListIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';

interface Template {
  _id: string;
  id?: string;
  title: string;
  description: string;
  category: string;
  tags?: string[];
  downloads?: number;
  isPublic?: boolean;
  thumbnail?: string;
}

export default function TemplateDetailPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filtered, setFiltered] = useState<Template[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 9;

  const { pushToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data } = await api.get<Template[]>('/templates');
        if (mounted) {
          setTemplates(data);
          setFiltered(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError((err as Error).message);
          pushToast({ variant: 'error', title: 'Failed to load templates', message: (err as Error).message });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [pushToast]);

  useEffect(() => {
    const q = search.trim().toLowerCase();
    setFiltered(
      templates.filter(
        (t) =>
          (!q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) &&
          (category === 'all' || t.category === category)
      )
    );
    setPage(1);
  }, [search, category, templates]);

  const categories = ['all', ...new Set(templates.map((t) => t.category))];
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const pages = Math.max(1, Math.ceil(filtered.length / perPage));

  if (loading) {
    return (
      <Box>
        <Skeleton height={60} sx={{ mb: 2 }} />
        <Skeleton height={200} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Templates
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Browse and customize church ministry templates
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => navigate('/templates/build')}>
          Create Template
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ position: 'relative', flex: 1, minWidth: 240, maxWidth: 400 }}>
          <SearchIcon sx={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'text.secondary' }} />
          <input
            placeholder="Search templates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 40px',
              border: '1px solid #cbd5e0',
              borderRadius: 8,
              fontSize: 14,
              outline: 'none',
            }}
          />
        </Box>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{
            padding: '10px 14px',
            border: '1px solid #cbd5e0',
            borderRadius: 8,
            fontSize: 14,
            background: 'white',
          }}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === 'all' ? 'All Categories' : c}
            </option>
          ))}
        </select>
      </Box>

      {paginated.length === 0 ? (
        <Alert severity="info">No templates found. Create the first one!</Alert>
      ) : (
        <>
          <Grid container spacing={3}>
            {paginated.map((t) => (
              <Grid item xs={12} sm={6} lg={4} key={t._id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Chip label={t.category} size="small" color="primary" variant="outlined" sx={{ mb: 1 }} />
                    <Typography variant="h6" component="h3" sx={{ mb: 1 }}>
                      {t.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {t.description}
                    </Typography>
                    {t.tags && t.tags.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                        {t.tags.slice(0, 3).map((tag, i) => (
                          <Chip key={i} label={tag} size="small" variant="outlined" />
                        ))}
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        <DownloadIcon sx={{ verticalAlign: 'middle', mr: 0.5, fontSize: 15 }} />
                        {t.downloads ?? 0} downloads
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardContent sx={{ pt: 0 }}>
                    <Button variant="outlined" fullWidth startIcon={<DownloadIcon />} onClick={() => navigate(`/templates/build/${t._id}`)}>
                      Customize
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          {pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination count={pages} page={page} onChange={(_, p) => setPage(p)} />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
