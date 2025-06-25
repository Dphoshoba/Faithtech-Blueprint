import React from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Button,
  Link,
  List,
  ListItem,
  ListIcon,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaCheckCircle, FaDownload, FaVideo, FaBook, FaUsers } from 'react-icons/fa';

interface OnboardingStep {
  title: string;
  description: string;
  resources: {
    type: 'document' | 'video' | 'guide';
    title: string;
    url: string;
  }[];
  checklist: string[];
}

const onboardingSteps: OnboardingStep[] = [
  {
    title: 'Welcome to Beta Program',
    description: 'Get started with our beta program and learn about the platform.',
    resources: [
      {
        type: 'video',
        title: 'Welcome Video',
        url: '/videos/welcome.mp4',
      },
      {
        type: 'guide',
        title: 'Getting Started Guide',
        url: '/guides/getting-started.pdf',
      },
    ],
    checklist: [
      'Complete account setup',
      'Review welcome materials',
      'Set up team access',
      'Configure basic settings',
    ],
  },
  {
    title: 'Platform Setup',
    description: 'Configure your church profile and initial settings.',
    resources: [
      {
        type: 'document',
        title: 'Platform Configuration Guide',
        url: '/docs/platform-setup.pdf',
      },
      {
        type: 'video',
        title: 'Setup Walkthrough',
        url: '/videos/setup.mp4',
      },
    ],
    checklist: [
      'Configure church profile',
      'Set up member categories',
      'Configure event types',
      'Set up contribution funds',
    ],
  },
  {
    title: 'Data Migration',
    description: 'Import your existing data into the platform.',
    resources: [
      {
        type: 'guide',
        title: 'Data Migration Guide',
        url: '/guides/data-migration.pdf',
      },
      {
        type: 'document',
        title: 'Data Templates',
        url: '/templates/data-import.xlsx',
      },
    ],
    checklist: [
      'Download data templates',
      'Prepare member data',
      'Import member records',
      'Verify data accuracy',
    ],
  },
  {
    title: 'Team Training',
    description: 'Train your team on using the platform effectively.',
    resources: [
      {
        type: 'video',
        title: 'Team Training Series',
        url: '/videos/team-training.mp4',
      },
      {
        type: 'guide',
        title: 'Role-Based Guides',
        url: '/guides/roles.pdf',
      },
    ],
    checklist: [
      'Assign team roles',
      'Complete role-based training',
      'Practice common workflows',
      'Set up team permissions',
    ],
  },
  {
    title: 'Integration Setup',
    description: 'Connect with your existing tools and services.',
    resources: [
      {
        type: 'document',
        title: 'Integration Guide',
        url: '/docs/integrations.pdf',
      },
      {
        type: 'video',
        title: 'Integration Tutorial',
        url: '/videos/integrations.mp4',
      },
    ],
    checklist: [
      'Review available integrations',
      'Configure essential integrations',
      'Test integration workflows',
      'Verify data sync',
    ],
  },
];

export const OnboardingMaterials: React.FC = () => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box p={6}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="lg" mb={4}>Beta Program Onboarding</Heading>
          <Text color="gray.600">
            Welcome to the beta program! Follow these steps to get started with the platform.
            Each section includes resources and a checklist to help you through the process.
          </Text>
        </Box>

        <Accordion allowMultiple>
          {onboardingSteps.map((step, index) => (
            <AccordionItem
              key={index}
              border="1px"
              borderColor={borderColor}
              borderRadius="md"
              mb={4}
            >
              <AccordionButton
                py={4}
                _hover={{ bg: 'gray.50' }}
                bg={bgColor}
              >
                <Box flex="1" textAlign="left">
                  <Heading size="md">{step.title}</Heading>
                  <Text color="gray.600" fontSize="sm">{step.description}</Text>
                </Box>
                <AccordionIcon />
              </AccordionButton>

              <AccordionPanel pb={4}>
                <VStack spacing={6} align="stretch">
                  {/* Resources */}
                  <Box>
                    <Heading size="sm" mb={3}>Resources</Heading>
                    <List spacing={3}>
                      {step.resources.map((resource, idx) => (
                        <ListItem key={idx}>
                          <ListIcon
                            as={
                              resource.type === 'video' ? FaVideo :
                              resource.type === 'document' ? FaBook :
                              FaUsers
                            }
                            color="blue.500"
                          />
                          <Link href={resource.url} isExternal color="blue.500">
                            {resource.title}
                          </Link>
                          <Button
                            size="sm"
                            leftIcon={<FaDownload />}
                            ml={2}
                            variant="outline"
                          >
                            Download
                          </Button>
                        </ListItem>
                      ))}
                    </List>
                  </Box>

                  {/* Checklist */}
                  <Box>
                    <Heading size="sm" mb={3}>Checklist</Heading>
                    <List spacing={2}>
                      {step.checklist.map((item, idx) => (
                        <ListItem key={idx}>
                          <ListIcon as={FaCheckCircle} color="green.500" />
                          {item}
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </VStack>
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>

        <Box textAlign="center" mt={8}>
          <Text color="gray.600" mb={4}>
            Need help? Contact our beta program support team
          </Text>
          <Button colorScheme="blue" size="lg">
            Contact Support
          </Button>
        </Box>
      </VStack>
    </Box>
  );
}; 