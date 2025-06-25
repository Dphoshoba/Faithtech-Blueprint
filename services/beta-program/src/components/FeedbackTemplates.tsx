import React from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  useColorModeValue,
  Grid,
  GridItem,
  Textarea,
  FormControl,
  FormLabel,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import { BetaFeedback, FeedbackType, FeedbackCategory } from '../types/BetaChurch';

interface FeedbackTemplate {
  id: string;
  title: string;
  description: string;
  type: FeedbackType;
  category: FeedbackCategory;
  questions: string[];
  ratingScale: number;
}

const feedbackTemplates: FeedbackTemplate[] = [
  {
    id: 'feature-evaluation',
    title: 'Feature Evaluation',
    description: 'Evaluate a specific feature of the platform',
    type: FeedbackType.FEATURE_REQUEST,
    category: FeedbackCategory.FUNCTIONALITY,
    questions: [
      'How would you rate the feature\'s ease of use?',
      'Did the feature meet your expectations?',
      'What improvements would you suggest?',
      'How likely are you to use this feature regularly?',
    ],
    ratingScale: 5,
  },
  {
    id: 'usability-test',
    title: 'Usability Test',
    description: 'Provide feedback on the platform\'s usability',
    type: FeedbackType.IMPROVEMENT,
    category: FeedbackCategory.USER_EXPERIENCE,
    questions: [
      'How intuitive was the interface?',
      'Did you encounter any difficulties?',
      'What aspects were most user-friendly?',
      'What aspects need improvement?',
    ],
    ratingScale: 5,
  },
  {
    id: 'performance-review',
    title: 'Performance Review',
    description: 'Evaluate the platform\'s performance',
    type: FeedbackType.IMPROVEMENT,
    category: FeedbackCategory.PERFORMANCE,
    questions: [
      'How would you rate the platform\'s speed?',
      'Did you experience any delays or lag?',
      'How reliable was the platform?',
      'What performance issues did you notice?',
    ],
    ratingScale: 5,
  },
  {
    id: 'integration-feedback',
    title: 'Integration Feedback',
    description: 'Provide feedback on platform integrations',
    type: FeedbackType.IMPROVEMENT,
    category: FeedbackCategory.INTEGRATION,
    questions: [
      'How well did the integration work?',
      'Did you encounter any sync issues?',
      'What integration features were most useful?',
      'What integration features need improvement?',
    ],
    ratingScale: 5,
  },
];

interface FeedbackTemplatesProps {
  onSubmit: (feedback: Partial<BetaFeedback>) => Promise<void>;
  userId: string;
}

export const FeedbackTemplates: React.FC<FeedbackTemplatesProps> = ({ onSubmit, userId }) => {
  const [selectedTemplate, setSelectedTemplate] = React.useState<FeedbackTemplate | null>(null);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [ratings, setRatings] = React.useState<Record<string, number>>({});
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleSubmit = async () => {
    if (!selectedTemplate) return;

    const feedback: Partial<BetaFeedback> = {
      type: selectedTemplate.type,
      category: selectedTemplate.category,
      content: JSON.stringify({
        template: selectedTemplate.id,
        answers,
        ratings,
      }),
      rating: Object.values(ratings).reduce((a, b) => a + b, 0) / Object.values(ratings).length,
      userId,
      status: 'new',
    };

    await onSubmit(feedback);
  };

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">Feedback Templates</Heading>
        <Text color="gray.600">
          Choose a template to provide structured feedback about your experience with the platform.
        </Text>

        <Grid templateColumns="repeat(2, 1fr)" gap={6}>
          {feedbackTemplates.map((template) => (
            <GridItem
              key={template.id}
              p={6}
              bg={bgColor}
              borderRadius="lg"
              border="1px"
              borderColor={borderColor}
              cursor="pointer"
              onClick={() => setSelectedTemplate(template)}
              _hover={{ shadow: 'md' }}
            >
              <VStack align="start" spacing={4}>
                <Heading size="md">{template.title}</Heading>
                <Text color="gray.600">{template.description}</Text>
                <Text fontSize="sm" color="blue.500">
                  {template.questions.length} questions
                </Text>
              </VStack>
            </GridItem>
          ))}
        </Grid>

        {selectedTemplate && (
          <Box
            p={6}
            bg={bgColor}
            borderRadius="lg"
            border="1px"
            borderColor={borderColor}
          >
            <VStack spacing={6} align="stretch">
              <Heading size="md">{selectedTemplate.title}</Heading>
              <Text color="gray.600">{selectedTemplate.description}</Text>

              {selectedTemplate.questions.map((question, index) => (
                <FormControl key={index}>
                  <FormLabel>{question}</FormLabel>
                  <Textarea
                    value={answers[question] || ''}
                    onChange={(e) => setAnswers({ ...answers, [question]: e.target.value })}
                    placeholder="Your answer..."
                    rows={3}
                  />
                  <FormLabel mt={2}>Rating (1-{selectedTemplate.ratingScale})</FormLabel>
                  <NumberInput
                    min={1}
                    max={selectedTemplate.ratingScale}
                    value={ratings[question] || 1}
                    onChange={(_, value) => setRatings({ ...ratings, [question]: value })}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              ))}

              <Button
                colorScheme="blue"
                size="lg"
                onClick={handleSubmit}
                isDisabled={Object.keys(answers).length !== selectedTemplate.questions.length}
              >
                Submit Feedback
              </Button>
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
}; 