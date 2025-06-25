import React from 'react';
import { render, screen } from '@testing-library/react';
import FeatureCard from '../FeatureCard';
import { FaBeer } from 'react-icons/fa';

describe('FeatureCard component', () => {
  const mockProps = {
    icon: <FaBeer data-testid="feature-icon" />,
    title: 'Test Feature Title',
    description: 'This is a test feature description.',
  };

  it('renders the icon, title, and description correctly', () => {
    render(<FeatureCard {...mockProps} />);

    // Check for the icon (using data-testid as FaBeer might not have an accessible role by default)
    expect(screen.getByTestId('feature-icon')).toBeInTheDocument();

    // Check for the title
    expect(screen.getByRole('heading', { name: mockProps.title })).toBeInTheDocument();

    // Check for the description
    expect(screen.getByText(mockProps.description)).toBeInTheDocument();
  });

  it('applies hover animation class (visual test, Jest cannot truly test motion)', () => {
    const { container } = render(<FeatureCard {...mockProps} />);
    // motion.div is the first child
    expect(container.firstChild).toHaveClass('p-6 bg-white rounded-xl shadow-lg');
    // We can't easily test the `whileHover={{ y: -10 }}` directly in Jest,
    // as it requires actual user interaction and browser rendering.
    // This part would typically be covered by E2E tests.
  });
});