import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Chip, 
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Tooltip,
  LinearProgress
} from '@mui/material';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ShareIcon from '@mui/icons-material/Share';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4]
  }
}));

interface RecommendationsViewProps {
  recommendations: any;
  onTemplateSelect: (templateId: string) => void;
  onResourceSelect: (resourceId: string) => void;
  onSaveRecommendation?: (recommendationId: string) => void;
  onShareRecommendation?: (recommendationId: string) => void;
  onMarkImplemented?: (recommendationId: string) => void;
}

const RecommendationsView: React.FC<RecommendationsViewProps> = ({
  recommendations,
  onTemplateSelect,
  onResourceSelect,
  onSaveRecommendation,
  onShareRecommendation,
  onMarkImplemented
}) => {
  const [activeTab, setActiveTab] = React.useState(0);
  const [activeCategory, setActiveCategory] = React.useState('all');
  
  const categories = Object.keys(recommendations.groupedRecommendations || {});
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Filter recommendations by category
  const filteredRecommendations = activeCategory === 'all' 
    ? recommendations.recommendations 
    : recommendations.groupedRecommendations[activeCategory] || [];
  
  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  // Format category name for display
  const formatCategoryName = (category: string) => {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  return (
    <Box>
      {/* Header Section */}
      <Box mb={4}>
        <Typography variant="h4" component="h2" gutterBottom>
          Your Ministry Technology Recommendations
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Based on your assessment results, we've identified {recommendations.recommendations.length} recommendations to enhance your ministry technology strategy.
        </Typography>
      </Box>
      
      {/* Top Recommendations */}
      <Box mb={6}>
        <Typography variant="h5" gutterBottom>
          Top Priorities
        </Typography>
        <Grid container spacing={3}>
          {recommendations.topRecommendations.map((rec: any) => (
            <Grid item xs={12} md={4} key={rec.id}>
              <StyledCard>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Chip 
                      icon={<PriorityHighIcon />} 
                      label={rec.priority.toUpperCase()} 
                      color={getPriorityColor(rec.priority) as any}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Typography variant="overline" color="textSecondary">
                      {formatCategoryName(rec.category)}
                    </Typography>
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {rec.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {rec.description}
                  </Typography>
                  
                  {/* Implementation Progress */}
                  {rec.implementationStatus && (
                    <Box mb={2}>
                      <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                        Implementation Progress
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={rec.implementationStatus.progress} 
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="caption" color="textSecondary">
                        {rec.implementationStatus.status.replace('_', ' ').toUpperCase()} - {rec.implementationStatus.progress}%
                      </Typography>
                    </Box>
                  )}
                </CardContent>
                <CardActions>
                  {rec.templateDetails && rec.templateDetails.length > 0 && (
                    <Button 
                      variant="contained" 
                      color="primary"
                      size="small"
                      onClick={() => onTemplateSelect(rec.templateDetails[0]._id)}
                      sx={{ mr: 1 }}
                    >
                      View Template
                    </Button>
                  )}
                  {rec.resourceDetails && rec.resourceDetails.length > 0 && (
                    <Button 
                      variant="outlined" 
                      color="primary"
                      size="small"
                      onClick={() => onResourceSelect(rec.resourceDetails[0]._id)}
                    >
                      View Resource
                    </Button>
                  )}
                  <Box flexGrow={1} />
                  {onSaveRecommendation && (
                    <Tooltip title="Save Recommendation">
                      <IconButton 
                        size="small"
                        onClick={() => onSaveRecommendation(rec.id)}
                      >
                        <BookmarkIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {onShareRecommendation && (
                    <Tooltip title="Share Recommendation">
                      <IconButton 
                        size="small"
                        onClick={() => onShareRecommendation(rec.id)}
                      >
                        <ShareIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {onMarkImplemented && (
                    <Tooltip title="Mark as Implemented">
                      <IconButton 
                        size="small"
                        onClick={() => onMarkImplemented(rec.id)}
                        color={rec.implementationStatus?.status === 'completed' ? 'success' : 'default'}
                      >
                        <CheckCircleIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </CardActions>
              </StyledCard>
            </Grid>
          ))}
        </Grid>
      </Box>
      
      {/* All Recommendations */}
      <Box>
        <Typography variant="h5" gutterBottom>
          All Recommendations
        </Typography>
        
        {/* Category filters */}
        <Box mb={2}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="All Categories" onClick={() => setActiveCategory('all')} />
            {categories.map((cat, idx) => (
              <Tab 
                key={cat} 
                label={formatCategoryName(cat)}
                onClick={() => setActiveCategory(cat)}
              />
            ))}
          </Tabs>
        </Box>
        
        {/* Filtered Recommendations */}
        <Grid container spacing={3}>
          {filteredRecommendations.map((rec: any) => (
            <Grid item xs={12} md={6} key={rec.id}>
              <StyledCard>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Chip 
                      icon={<PriorityHighIcon />} 
                      label={rec.priority.toUpperCase()} 
                      color={getPriorityColor(rec.priority) as any}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Typography variant="overline" color="textSecondary">
                      {formatCategoryName(rec.category)}
                    </Typography>
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {rec.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {rec.description}
                  </Typography>
                  
                  {/* Implementation Progress */}
                  {rec.implementationStatus && (
                    <Box mb={2}>
                      <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                        Implementation Progress
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={rec.implementationStatus.progress} 
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="caption" color="textSecondary">
                        {rec.implementationStatus.status.replace('_', ' ').toUpperCase()} - {rec.implementationStatus.progress}%
                      </Typography>
                    </Box>
                  )}
                </CardContent>
                <CardActions>
                  {rec.templateDetails && rec.templateDetails.length > 0 && (
                    <Button 
                      variant="contained" 
                      color="primary"
                      size="small"
                      onClick={() => onTemplateSelect(rec.templateDetails[0]._id)}
                      sx={{ mr: 1 }}
                    >
                      View Template
                    </Button>
                  )}
                  {rec.resourceDetails && rec.resourceDetails.length > 0 && (
                    <Button 
                      variant="outlined" 
                      color="primary"
                      size="small"
                      onClick={() => onResourceSelect(rec.resourceDetails[0]._id)}
                    >
                      View Resource
                    </Button>
                  )}
                  <Box flexGrow={1} />
                  {onSaveRecommendation && (
                    <Tooltip title="Save Recommendation">
                      <IconButton 
                        size="small"
                        onClick={() => onSaveRecommendation(rec.id)}
                      >
                        <BookmarkIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {onShareRecommendation && (
                    <Tooltip title="Share Recommendation">
                      <IconButton 
                        size="small"
                        onClick={() => onShareRecommendation(rec.id)}
                      >
                        <ShareIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {onMarkImplemented && (
                    <Tooltip title="Mark as Implemented">
                      <IconButton 
                        size="small"
                        onClick={() => onMarkImplemented(rec.id)}
                        color={rec.implementationStatus?.status === 'completed' ? 'success' : 'default'}
                      >
                        <CheckCircleIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </CardActions>
              </StyledCard>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default RecommendationsView; 