import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import AdminNavbar from '../AdminNavbar';
import useAdminAuth from '../../../hooks/useAdminAuth'; // Actual hook
import { useRouter } from 'next/router'; // Actual hook

// Mock the hooks
jest.mock('../../../hooks/useAdminAuth', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('next/router', () => ({
  __esModule: true,
  useRouter: jest.fn(),
}));

describe('AdminNavbar component', () => {
  const mockLogout = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementations
    (useAdminAuth as jest.Mock).mockReturnValue({
      logout: mockLogout,
      // Add other properties returned by useAdminAuth if your component uses them
    });
    (useRouter as jest.Mock).mockReturnValue({
      pathname: '/',
      push: mockPush,
      // Add other router properties if needed
    });
  });

  it('renders the title, navigation links, and logout button', () => {
    render(<AdminNavbar />);
    expect(screen.getByRole('heading', { name: /FaithTech Admin/i })).toBeInTheDocument();
    
    // Query within the desktop navigation for more specific targeting
    const desktopNav = screen.getByTestId('desktop-nav-links');
    expect(within(desktopNav).getByRole('link', { name: /Leads/i })).toBeInTheDocument();
    expect(within(desktopNav).getByRole('link', { name: /Analytics/i })).toBeInTheDocument();
    
    expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument();
  });

  it('calls logout function when logout button is clicked', async () => {
    render(<AdminNavbar />);
    fireEvent.click(screen.getByRole('button', { name: /Logout/i }));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('calls onLogout prop when logout button is clicked and onLogout is provided', async () => {
    const mockOnLogoutProp = jest.fn();
    render(<AdminNavbar onLogout={mockOnLogoutProp} />);
    fireEvent.click(screen.getByRole('button', { name: /Logout/i }));
    expect(mockOnLogoutProp).toHaveBeenCalledTimes(1);
    expect(mockLogout).not.toHaveBeenCalled(); // Ensure original logout isn't called
  });

  it('highlights "Leads" link when current path is /admin/leads', () => {
    (useRouter as jest.Mock).mockReturnValue({
      pathname: '/admin/leads',
      push: mockPush,
    });
    render(<AdminNavbar />);
    const desktopNav = screen.getByTestId('desktop-nav-links');
    const leadsLink = within(desktopNav).getByRole('link', { name: /Leads/i }).firstChild;
    expect(leadsLink).toHaveClass('border-blue-500 text-blue-600');
    const analyticsLink = within(desktopNav).getByRole('link', { name: /Analytics/i }).firstChild;
    expect(analyticsLink).toHaveClass('border-transparent text-gray-500');
  });

  it('highlights "Analytics" link when current path is /admin/analytics', () => {
    (useRouter as jest.Mock).mockReturnValue({
      pathname: '/admin/analytics',
      push: mockPush,
    });
    render(<AdminNavbar />);
    const desktopNav = screen.getByTestId('desktop-nav-links');
    const analyticsLink = within(desktopNav).getByRole('link', { name: /Analytics/i }).firstChild;
    expect(analyticsLink).toHaveClass('border-blue-500 text-blue-600');
    const leadsLink = within(desktopNav).getByRole('link', { name: /Leads/i }).firstChild;
    expect(leadsLink).toHaveClass('border-transparent text-gray-500');
  });
});