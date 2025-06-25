import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import LeadsPage from '../leads'; // The component itself, not the default export
import { ILead } from '../../../models/Lead';
import withAdminAuth from '../../../components/admin/withAdminAuth';

// Mock withAdminAuth HOC to return the component directly
jest.mock('../../../components/admin/withAdminAuth', () => ({
  __esModule: true,
  default: (Component: React.ComponentType<any>) => (props: any) => <Component {...props} />,
}));

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/admin/leads',
    query: {},
    asPath: '/admin/leads',
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Mock global fetch
global.fetch = jest.fn();

const mockLeads: Array<LeadsPageProps['initialLeads'][0]> = [
  { _id: '1', name: 'Lead One', email: 'one@example.com', churchName: 'Church Alpha', churchSize: '1-50', status: 'new', createdAt: new Date().toISOString(), message: 'Test message 1' },
  { _id: '2', name: 'Lead Two', email: 'two@example.com', churchName: 'Church Beta', churchSize: '51-200', status: 'contacted', createdAt: new Date().toISOString(), message: 'Test message 2' },
];

interface LeadsPageProps {
  initialLeads: Array<{
    _id: string;
    name: string;
    email: string;
    churchName: string;
    churchSize: string;
    status: string;
    createdAt: string;
    message?: string; // Added message here to match mockLeads
  }>;
  totalCount: number;
}


describe('LeadsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default fetch mock
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ 
        data: { leads: [], pagination: { totalCount: 0, totalPages: 0, page: 1, limit: 20 } },
        message: 'Success' 
      }),
    });
  });

  const renderLeadsPage = (props?: Partial<LeadsPageProps>) => {
    const defaultProps: LeadsPageProps = {
      initialLeads: mockLeads,
      totalCount: mockLeads.length,
    };
    return render(<LeadsPage {...defaultProps} {...props} />);
  };

  test('renders initial leads and page elements', () => {
    renderLeadsPage();
    expect(screen.getByRole('heading', { name: /Lead Management/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Filter by Status:/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search by name, email, or church/i)).toBeInTheDocument();
    
    // Check for table headers
    expect(screen.getByRole('columnheader', { name: /Name/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Email/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Church/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Status/i })).toBeInTheDocument();

    // Check for initial leads
    mockLeads.forEach(lead => {
      expect(screen.getByText(lead.name)).toBeInTheDocument();
      expect(screen.getByText(lead.email)).toBeInTheDocument();
    });
  });

  test('filters leads when status filter changes', async () => {
    renderLeadsPage();
    const filterSelect = screen.getByLabelText(/Filter by Status:/i);
    
    const newFilteredLeads = [
      { _id: '3', name: 'Lead Three (New)', email: 'three@example.com', churchName: 'Church Gamma', churchSize: '201-500', status: 'new', createdAt: new Date().toISOString(), message: 'Filtered lead' },
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { leads: newFilteredLeads, pagination: { totalCount: 1, totalPages: 1, page: 1, limit: 20 } }, message: 'Filtered' }),
    });

    fireEvent.change(filterSelect, { target: { value: 'new' } });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/admin/leads?page=1&limit=20&status=new'));
    });
    
    await waitFor(() => {
      expect(screen.getByText('Lead Three (New)')).toBeInTheDocument();
      expect(screen.queryByText('Lead One')).not.toBeInTheDocument(); // From initialLeads
    });
  });

  test('searches leads when search form is submitted', async () => {
    renderLeadsPage();
    const searchInput = screen.getByPlaceholderText(/Search by name, email, or church/i);
    const searchButton = screen.getByRole('button', { name: /Search/i });

    const searchedLeads = [
      { _id: '1', name: 'Lead One', email: 'one@example.com', churchName: 'Church Alpha', churchSize: '1-50', status: 'new', createdAt: new Date().toISOString(), message: 'Test message 1' },
    ];
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { leads: searchedLeads, pagination: { totalCount: 1, totalPages: 1, page: 1, limit: 20 } }, message: 'Searched' }),
    });

    fireEvent.change(searchInput, { target: { value: 'Lead One' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/admin/leads?page=1&limit=20&search=Lead+One'));
    });

    await waitFor(() => {
      expect(screen.getByText('Lead One')).toBeInTheDocument();
      expect(screen.queryByText('Lead Two')).not.toBeInTheDocument();
    });
  });

  test('updates lead status when status is changed in table', async () => {
    renderLeadsPage();
    
    // Find the status dropdown for the first lead
    // This assumes the first lead is 'Lead One' and its status dropdown is identifiable
    // We might need a more robust selector if the table structure is complex or dynamic
    const leadOneRow = screen.getByText('Lead One').closest('tr');
    if (!leadOneRow) throw new Error('Lead One row not found');
    
    const statusSelect = within(leadOneRow).getByRole('combobox'); // Assuming the select has a combobox role

    (fetch as jest.Mock).mockResolvedValueOnce({ // For the PATCH request
      ok: true,
      json: async () => ({ data: { ...mockLeads[0], status: 'contacted' }, message: 'Status updated' }),
    });

    fireEvent.change(statusSelect, { target: { value: 'contacted' } });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `/api/admin/leads/${mockLeads[0]._id}`,
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 'contacted' }),
        })
      );
    });

    // Check if the status in the UI updated (this might require re-querying or checking class changes)
    // For simplicity, we'll check if the select value changed, assuming it reflects the state.
    // A more robust test would check the visual status indicator.
    await waitFor(() => {
        const updatedStatusSelect = within(leadOneRow).getByRole('combobox') as HTMLSelectElement;
        expect(updatedStatusSelect.value).toBe('contacted');
    });
  });

  test('expands and collapses lead details on row click', async () => {
    renderLeadsPage();
    const leadOneRow = screen.getByText('Lead One').closest('tr');
    if (!leadOneRow) throw new Error('Lead One row not found');

    // Initially, details should not be visible
    const expectedMessageContent = mockLeads[0].message || 'No message provided';
    const findMessageParagraph = () => screen.queryByText((content, element) => {
      const hasStrongMessage = element?.tagName.toLowerCase() === 'strong' && content.startsWith('Message:');
      if (!hasStrongMessage) return false;
      const parentParagraph = element?.parentElement;
      return parentParagraph?.tagName.toLowerCase() === 'p' && (parentParagraph?.textContent?.includes(expectedMessageContent) ?? false);
    });

    expect(findMessageParagraph()).toBeNull(); // The <strong> tag itself should not be found initially

    // Click to expand
    fireEvent.click(leadOneRow);
    await waitFor(() => {
      const messageStrongTag = findMessageParagraph();
      expect(messageStrongTag).toBeInTheDocument(); // The <strong> tag should be found
      expect(messageStrongTag?.parentElement).toHaveTextContent(`Message: ${expectedMessageContent}`); // Check parent <p>
      expect(screen.getByRole('button', { name: /Send Email/i})).toBeInTheDocument();
    });

    // Click again to collapse
    fireEvent.click(leadOneRow);
    await waitFor(() => {
      expect(findMessageParagraph()).toBeNull(); // The <strong> tag should not be found after collapsing
    });
  });

  // Add more tests for pagination if totalCount > pageSize
  test('handles pagination when multiple pages exist', async () => {
    const manyLeads = Array.from({ length: 25 }, (_, i) => ({
      _id: `lead-${i}`, name: `Lead ${i}`, email: `lead${i}@example.com`, 
      churchName: `Church ${i}`, churchSize: '1-50', status: 'new', 
      createdAt: new Date().toISOString(), message: `Message ${i}`
    }));

    renderLeadsPage({ initialLeads: manyLeads.slice(0, 20), totalCount: 25 });
    
    // Target the "Next" button within the desktop pagination controls
    const desktopPaginationNav = screen.getByRole('navigation', { name: /Pagination/i });
    const nextButton = within(desktopPaginationNav).getByRole('button', { name: /Next/i });
    const prevButton = within(desktopPaginationNav).getByRole('button', { name: /Previous/i });

    expect(nextButton).toBeInTheDocument();
    expect(prevButton).toBeDisabled(); // Assuming it's disabled on page 1

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { leads: manyLeads.slice(20, 25), pagination: { totalCount: 25, totalPages: 2, page: 2, limit: 20 } }, message: 'Page 2' }),
    });
    
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/admin/leads?page=2&limit=20'));
    });

    await waitFor(() => {
      // Check for a lead that would be on page 2
      expect(screen.getByText('Lead 20')).toBeInTheDocument(); 
      expect(screen.queryByText('Lead 0')).not.toBeInTheDocument(); // From page 1
    });
  });

});