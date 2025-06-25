import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import connectToDatabase from '../../utils/database';
import Lead, { ILead } from '../../models/Lead'; // ILead will be used now
import { FilterQuery } from 'mongoose';
import AdminNavbar from '../../components/admin/AdminNavbar';
import withAdminAuth from '../../components/admin/withAdminAuth';

interface LeadsPageProps {
  initialLeads: Array<{
    _id: string;
    name: string;
    email: string;
    churchName: string;
    churchSize: string;
    status: string;
    createdAt: string;
  }>;
  totalCount: number;
}

function LeadsPage({ initialLeads, totalCount }: LeadsPageProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  
  const pageSize = 20;
  const totalPages = Math.ceil(totalCount / pageSize);

  const fetchLeads = async (page: number, status: string, search: string) => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', pageSize.toString());
      
      if (status !== 'all') {
        queryParams.append('status', status);
      }
      
      if (search) {
        queryParams.append('search', search);
      }
      
      const response = await fetch(`/api/admin/leads?${queryParams.toString()}`);
      const data = await response.json();
      
      if (response.ok) {
        setLeads(data.data.leads);
        setCurrentPage(page);
      } else {
        console.error('Failed to fetch leads:', data.message);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    fetchLeads(page, filter, searchTerm);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFilter = e.target.value;
    setFilter(newFilter);
    fetchLeads(1, newFilter, searchTerm);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeads(1, filter, searchTerm);
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        // Update lead status in the UI
        setLeads(leads.map(lead => 
          lead._id === leadId ? { ...lead, status: newStatus } : lead
        ));
      } else {
        console.error('Failed to update lead status');
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  };

  const handleLeadSelect = (leadId: string) => {
    setSelectedLead(leadId === selectedLead ? null : leadId);
  };

  return (
    <>
      <Head>
        <title>Lead Management | FaithTech Blueprint</title>
      </Head>
      <div className="min-h-screen bg-gray-100">
        <AdminNavbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold mb-8">Lead Management</h1>
        
        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap items-center justify-between">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <label htmlFor="status-filter" className="font-medium">Filter by Status:</label>
            <select
              id="status-filter"
              value={filter}
              onChange={handleFilterChange}
              className="border rounded-md px-3 py-2"
            >
              <option value="all">All Leads</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="disqualified">Disqualified</option>
            </select>
          </div>
          
          <form onSubmit={handleSearch} className="flex w-full md:w-auto">
            <input
              type="text"
              placeholder="Search by name, email, or church"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border rounded-l-md px-4 py-2 w-full md:w-64"
            />
            <button 
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700"
            >
              Search
            </button>
          </form>
        </div>
        
        {/* Leads Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">Loading leads...</div>
          ) : leads.length === 0 ? (
            <div className="p-8 text-center">No leads found</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Church
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.map((lead) => (
                  <React.Fragment key={lead._id}>
                    <tr 
                      className={`hover:bg-gray-50 cursor-pointer ${selectedLead === lead._id ? 'bg-blue-50' : ''}`}
                      onClick={() => handleLeadSelect(lead._id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{lead.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-500">{lead.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-500">{lead.churchName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-500">{lead.churchSize}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${lead.status === 'new' ? 'bg-blue-100 text-blue-800' : 
                            lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' : 
                            lead.status === 'qualified' ? 'bg-green-100 text-green-800' : 
                            'bg-red-100 text-red-800'}`}
                        >
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-500">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                          className="border rounded px-2 py-1 text-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="qualified">Qualified</option>
                          <option value="disqualified">Disqualified</option>
                        </select>
                      </td>
                    </tr>
                    {selectedLead === lead._id && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 bg-gray-50">
                          <div className="text-sm">
                            <h4 className="font-medium mb-2">Lead Details</h4>
                            <p className="mb-2"><strong>Message:</strong> {lead.message || 'No message provided'}</p>
                            <div className="flex space-x-2 mt-4">
                              <button 
                                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                                onClick={() => window.open(`mailto:${lead.email}`)}
                              >
                                Send Email
                              </button>
                              <button 
                                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                              >
                                Add Note
                              </button>
                              <button 
                                className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
                              >
                                Add to Campaign
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * pageSize, totalCount)}
                    </span>{' '}
                    of <span className="font-medium">{totalCount}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border ${
                          page === currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        } text-sm font-medium`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === totalPages ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Export the component wrapped with authentication
export default withAdminAuth(LeadsPage);

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Connect to database
    await connectToDatabase();
    
    // Get page from query params or default to 1
    const page = context.query.page ? parseInt(context.query.page as string) : 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    
    // Get status filter from query params
    const statusFilter = context.query.status as string;
    
    // Build query
    const query: FilterQuery<ILead> = {};
    if (statusFilter && statusFilter !== 'all') {
      query.status = statusFilter as ILead['status'];
    }
    
    // Get search term from query params
    const search = context.query.search as string;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { churchName: { $regex: search, $options: 'i' } },
      ];
    }
    
    // Get leads from database
    const leads = await Lead.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count for pagination
    const totalCount = await Lead.countDocuments(query);
    
    // Convert MongoDB documents to plain objects and format dates
    const formattedLeads = leads.map((lead: ILead) => ({
      _id: lead._id.toString(),
      name: lead.name,
      email: lead.email,
      churchName: lead.churchName,
      churchSize: lead.churchSize,
      status: lead.status,
      message: lead.message,
      createdAt: lead.createdAt.toISOString(),
    }));
    
    return {
      props: {
        initialLeads: formattedLeads,
        totalCount,
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        initialLeads: [],
        totalCount: 0,
        error: 'Failed to fetch leads',
      },
    };
  }
};
