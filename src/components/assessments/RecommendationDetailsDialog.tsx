import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  LinearProgress,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Assignment as AssignmentIcon,
  Timeline as TimelineIcon,
  Note as NoteIcon
} from '@mui/icons-material';

interface RecommendationDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  recommendation: any;
  onUpdateProgress: (progress: number) => void;
  onAddNote: (note: string) => void;
}

const RecommendationDetailsDialog: React.FC<RecommendationDetailsDialogProps> = ({
  open,
  onClose,
  recommendation,
  onUpdateProgress,
  onAddNote
}) => {
  const [progress, setProgress] = React.useState(recommendation?.implementationStatus?.progress || 0);
  const [note, setNote] = React.useState('');

  const handleProgressChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = Math.min(100, Math.max(0, Number(event.target.value)));
    setProgress(newProgress);
  };

  const handleProgressSubmit = () => {
    onUpdateProgress(progress);
  };

  const handleNoteSubmit = () => {
    if (note.trim()) {
      onAddNote(note);
      setNote('');
    }
  };

  if (!recommendation) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">{recommendation.title}</Typography>
          <Chip
            label={recommendation.priority.toUpperCase()}
            color={
              recommendation.priority === 'high' ? 'error' :
              recommendation.priority === 'medium' ? 'warning' : 'info'
            }
            size="small"
          />
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <List>
          {/* Description */}
          <ListItem>
            <ListItemIcon>
              <DescriptionIcon />
            </ListItemIcon>
            <ListItemText
              primary="Description"
              secondary={recommendation.description}
            />
          </ListItem>
          
          <Divider />
          
          {/* Implementation Steps */}
          <ListItem>
            <ListItemIcon>
              <AssignmentIcon />
            </ListItemIcon>
            <ListItemText
              primary="Implementation Steps"
              secondary={
                <List>
                  {recommendation.steps?.map((step: string, index: number) => (
                    <ListItem key={index}>
                      <ListItemText primary={`${index + 1}. ${step}`} />
                    </ListItem>
                  ))}
                </List>
              }
            />
          </ListItem>
          
          <Divider />
          
          {/* Progress Tracking */}
          <ListItem>
            <ListItemIcon>
              <TimelineIcon />
            </ListItemIcon>
            <ListItemText
              primary="Implementation Progress"
              secondary={
                <Box mt={1}>
                  <LinearProgress 
                    variant="determinate" 
                    value={progress} 
                    sx={{ mb: 1 }}
                  />
                  <Box display="flex" alignItems="center" gap={2}>
                    <TextField
                      type="number"
                      label="Progress (%)"
                      value={progress}
                      onChange={handleProgressChange}
                      size="small"
                      inputProps={{ min: 0, max: 100 }}
                      sx={{ width: 120 }}
                    />
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleProgressSubmit}
                    >
                      Update Progress
                    </Button>
                  </Box>
                </Box>
              }
            />
          </ListItem>
          
          <Divider />
          
          {/* Implementation Notes */}
          <ListItem>
            <ListItemIcon>
              <NoteIcon />
            </ListItemIcon>
            <ListItemText
              primary="Implementation Notes"
              secondary={
                <Box mt={1}>
                  <List>
                    {recommendation.implementationStatus?.notes?.map((note: string, index: number) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={note}
                          secondary={new Date().toLocaleDateString()}
                        />
                      </ListItem>
                    ))}
                  </List>
                  <Box display="flex" gap={2} mt={2}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Add Note"
                      value={note}
                      onChange={(e) => setNote((e.target as HTMLTextAreaElement).value)}
                    />
                    <Button
                      variant="contained"
                      onClick={handleNoteSubmit}
                      disabled={!note.trim()}
                    >
                      Add Note
                    </Button>
                  </Box>
                </Box>
              }
            />
          </ListItem>
        </List>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecommendationDetailsDialog; 