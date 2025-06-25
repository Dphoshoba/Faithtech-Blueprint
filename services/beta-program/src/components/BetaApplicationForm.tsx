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
  Grid,
  GridItem,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import { BetaChurchProfile, ChurchSize } from '../types/BetaChurch';

interface BetaApplicationFormProps {
  onSubmit: (data: Partial<BetaChurchProfile>) => Promise<void>;
}

export const BetaApplicationForm: React.FC<BetaApplicationFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<Partial<BetaChurchProfile>>({
    applicationStatus: 'draft',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      toast({
        title: 'Application Submitted',
        description: 'Thank you for applying to our beta program!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit application. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Box as="form" onSubmit={handleSubmit} p={6} bg="white" borderRadius="lg" shadow="md">
      <VStack spacing={6} align="stretch">
        <Heading size="lg">Beta Program Application</Heading>
        <Text color="gray.600">
          Please fill out this form to apply for our beta program. We're looking for churches
          of all sizes to help us shape the future of church management software.
        </Text>

        <Grid templateColumns="repeat(2, 1fr)" gap={6}>
          <GridItem>
            <FormControl isRequired>
              <FormLabel>Church Name</FormLabel>
              <Input
                value={formData.name || ''}
                onChange={e => handleChange('name', e.target.value)}
                placeholder="Enter your church name"
              />
            </FormControl>
          </GridItem>

          <GridItem>
            <FormControl isRequired>
              <FormLabel>Denomination</FormLabel>
              <Input
                value={formData.denomination || ''}
                onChange={e => handleChange('denomination', e.target.value)}
                placeholder="Enter your denomination"
              />
            </FormControl>
          </GridItem>

          <GridItem>
            <FormControl isRequired>
              <FormLabel>Church Size</FormLabel>
              <Select
                value={formData.size || ''}
                onChange={e => handleChange('size', e.target.value)}
                placeholder="Select church size"
              >
                {Object.values(ChurchSize).map(size => (
                  <option key={size} value={size}>
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </option>
                ))}
              </Select>
            </FormControl>
          </GridItem>

          <GridItem>
            <FormControl isRequired>
              <FormLabel>Staff Count</FormLabel>
              <NumberInput min={1}>
                <NumberInputField
                  value={formData.staffCount || ''}
                  onChange={e => handleChange('staffCount', parseInt(e.target.value))}
                  placeholder="Enter staff count"
                />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
          </GridItem>

          <GridItem>
            <FormControl isRequired>
              <FormLabel>Annual Budget (USD)</FormLabel>
              <NumberInput min={0}>
                <NumberInputField
                  value={formData.annualBudget || ''}
                  onChange={e => handleChange('annualBudget', parseInt(e.target.value))}
                  placeholder="Enter annual budget"
                />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
          </GridItem>

          <GridItem>
            <FormControl isRequired>
              <FormLabel>Current ChMS</FormLabel>
              <Input
                value={formData.currentChms || ''}
                onChange={e => handleChange('currentChms', e.target.value)}
                placeholder="Enter your current ChMS"
              />
            </FormControl>
          </GridItem>
        </Grid>

        <FormControl isRequired>
          <FormLabel>Contact Person</FormLabel>
          <Grid templateColumns="repeat(2, 1fr)" gap={4}>
            <Input
              value={formData.contactPerson?.name || ''}
              onChange={e => handleChange('contactPerson', { ...formData.contactPerson, name: e.target.value })}
              placeholder="Full Name"
            />
            <Input
              value={formData.contactPerson?.title || ''}
              onChange={e => handleChange('contactPerson', { ...formData.contactPerson, title: e.target.value })}
              placeholder="Title"
            />
            <Input
              value={formData.contactPerson?.email || ''}
              onChange={e => handleChange('contactPerson', { ...formData.contactPerson, email: e.target.value })}
              placeholder="Email"
              type="email"
            />
            <Input
              value={formData.contactPerson?.phone || ''}
              onChange={e => handleChange('contactPerson', { ...formData.contactPerson, phone: e.target.value })}
              placeholder="Phone"
              type="tel"
            />
          </Grid>
        </FormControl>

        <FormControl>
          <FormLabel>Why do you want to join our beta program?</FormLabel>
          <Textarea
            value={formData.feedback?.[0]?.content || ''}
            onChange={e => handleChange('feedback', [{ content: e.target.value }])}
            placeholder="Tell us why you're interested in joining our beta program"
            rows={4}
          />
        </FormControl>

        <Button
          type="submit"
          colorScheme="blue"
          size="lg"
          isLoading={isSubmitting}
          loadingText="Submitting..."
        >
          Submit Application
        </Button>
      </VStack>
    </Box>
  );
}; 