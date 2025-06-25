import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  VStack,
  Heading,
  Text,
  useToast,
  Radio,
  RadioGroup,
  Stack,
  HStack,
  Icon,
} from '@chakra-ui/react';
import { BetaFeedback, FeedbackType, FeedbackCategory } from '../types/BetaChurch';
import { FaBug, FaLightbulb, FaTools, FaComment } from 'react-icons/fa';

interface FeedbackCollectorProps {
  onSubmit: (feedback: Partial<BetaFeedback>) => Promise<void>;
  userId: string;
}

export const FeedbackCollector: React.FC<FeedbackCollectorProps> = ({ onSubmit, userId }) => {
  const [feedback, setFeedback] = useState<Partial<BetaFeedback>>({
    type: FeedbackType.GENERAL,
    category: FeedbackCategory.USER_EXPERIENCE,
    rating: 5,
    status: 'new',
    userId,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(feedback);
      toast({
        title: 'Feedback Submitted',
        description: 'Thank you for your feedback!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      // Reset form
      setFeedback({
        type: FeedbackType.GENERAL,
        category: FeedbackCategory.USER_EXPERIENCE,
        rating: 5,
        status: 'new',
        userId,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit feedback. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFeedbackTypeIcon = (type: FeedbackType) => {
    switch (type) {
      case FeedbackType.BUG:
        return FaBug;
      case FeedbackType.FEATURE_REQUEST:
        return FaLightbulb;
      case FeedbackType.IMPROVEMENT:
        return FaTools;
      default:
        return FaComment;
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit} p={6} bg="white" borderRadius="lg" shadow="md">
      <VStack spacing={6} align="stretch">
        <Heading size="lg">Share Your Feedback</Heading>
        <Text color="gray.600">
          Help us improve by sharing your thoughts, reporting issues, or suggesting new features.
        </Text>

        <FormControl isRequired>
          <FormLabel>Feedback Type</FormLabel>
          <RadioGroup
            value={feedback.type}
            onChange={value => setFeedback(prev => ({ ...prev, type: value as FeedbackType }))}
          >
            <Stack direction="row" spacing={4}>
              {Object.values(FeedbackType).map(type => (
                <Radio key={type} value={type}>
                  <HStack>
                    <Icon as={getFeedbackTypeIcon(type)} />
                    <Text>{type.replace('_', ' ').toLowerCase()}</Text>
                  </HStack>
                </Radio>
              ))}
            </Stack>
          </RadioGroup>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Category</FormLabel>
          <Select
            value={feedback.category}
            onChange={e => setFeedback(prev => ({ ...prev, category: e.target.value as FeedbackCategory }))}
          >
            {Object.values(FeedbackCategory).map(category => (
              <option key={category} value={category}>
                {category.replace('_', ' ').toLowerCase()}
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Your Feedback</FormLabel>
          <Textarea
            value={feedback.content || ''}
            onChange={e => setFeedback(prev => ({ ...prev, content: e.target.value }))}
            placeholder="Please describe your feedback in detail..."
            rows={4}
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>How would you rate your experience?</FormLabel>
          <RadioGroup
            value={feedback.rating?.toString()}
            onChange={value => setFeedback(prev => ({ ...prev, rating: parseInt(value) }))}
          >
            <Stack direction="row" spacing={4}>
              {[1, 2, 3, 4, 5].map(rating => (
                <Radio key={rating} value={rating.toString()}>
                  {rating}
                </Radio>
              ))}
            </Stack>
          </RadioGroup>
        </FormControl>

        <Button
          type="submit"
          colorScheme="blue"
          size="lg"
          isLoading={isSubmitting}
          loadingText="Submitting..."
        >
          Submit Feedback
        </Button>
      </VStack>
    </Box>
  );
}; 