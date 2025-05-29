import axios from 'axios';
import { CCBProvider } from '../ccb';
import { TithelyProvider } from '../tithely';
import { format } from 'date-fns';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Integration Providers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CCB Provider', () => {
    const auth = {
      churchCode: 'testchurch',
      username: 'testuser',
      password: 'testpass'
    };
    const provider = new CCBProvider(auth);

    describe('getPeople', () => {
      it('should fetch and transform people data correctly', async () => {
        const mockResponse = {
          data: {
            response: {
              individuals: [
                {
                  id: '123',
                  first_name: 'John',
                  last_name: 'Doe',
                  email: 'john@example.com',
                  mobile_phone: '123-456-7890',
                  street_address: '123 Main St',
                  city: 'Anytown',
                  state: 'CA',
                  zip: '12345',
                  membership_status: 'active',
                  campus: 'main',
                  groups: { group: [{ id: 'group1' }] },
                  marital_status: 'married',
                  membership_date: '2023-01-01',
                  birth_date: '1990-01-01'
                }
              ]
            }
          }
        };

        mockedAxios.get.mockResolvedValueOnce(mockResponse);

        const result = await provider.getPeople();

        expect(result.data[0]).toMatchObject({
          externalId: '123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '123-456-7890',
          address: {
            street: '123 Main St',
            city: 'Anytown',
            state: 'CA',
            zip: '12345'
          }
        });
        expect(result.count).toBe(1);
        expect(result.hasMore).toBe(false);
      });

      it('should handle API errors gracefully', async () => {
        mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

        await expect(provider.getPeople()).rejects.toThrow('Failed to fetch people from CCB');
      });
    });

    describe('validateCredentials', () => {
      it('should validate correct credentials', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: {} });

        const result = await provider.validateCredentials();
        expect(result).toBe(true);
      });

      it('should reject invalid credentials', async () => {
        mockedAxios.get.mockRejectedValueOnce(new Error('Invalid credentials'));

        await expect(provider.validateCredentials()).rejects.toThrow('Invalid CCB credentials');
      });
    });
  });

  describe('Tithe.ly Provider', () => {
    const auth = {
      apiKey: 'test-api-key',
      organizationId: 'test-org'
    };
    const provider = new TithelyProvider(auth);

    describe('getPeople', () => {
      it('should fetch and transform people data with pagination', async () => {
        const mockResponse = {
          data: {
            data: [
              {
                id: '123',
                first_name: 'Jane',
                last_name: 'Smith',
                email: 'jane@example.com',
                phone: '123-456-7890',
                address_line_1: '123 Main St',
                address_line_2: 'Apt 4B',
                city: 'Anytown',
                state: 'CA',
                postal_code: '12345',
                country: 'USA',
                status: 'active',
                groups: ['group1'],
                membership_status: 'member',
                joined_at: '2023-01-01',
                last_attendance_at: '2023-06-01',
                notes: 'Test notes'
              }
            ],
            meta: {
              current_page: 1,
              total_pages: 2
            }
          }
        };

        mockedAxios.get.mockResolvedValueOnce(mockResponse);

        const result = await provider.getPeople();

        expect(result.data[0]).toMatchObject({
          externalId: '123',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          phone: '123-456-7890',
          address: {
            street: '123 Main St',
            street2: 'Apt 4B',
            city: 'Anytown',
            state: 'CA',
            zip: '12345',
            country: 'USA'
          }
        });
        expect(result.hasMore).toBe(true);
        expect(result.nextPage).toBe(2);
      });

      it('should handle API errors gracefully', async () => {
        mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

        await expect(provider.getPeople()).rejects.toThrow('Failed to fetch people from Tithe.ly');
      });
    });

    describe('sync', () => {
      it('should sync all capabilities successfully', async () => {
        const mockPeopleResponse = {
          data: {
            data: [{ id: '1' }],
            meta: { current_page: 1, total_pages: 1 }
          }
        };
        const mockGroupsResponse = {
          data: {
            data: [{ id: '1' }],
            meta: { current_page: 1, total_pages: 1 }
          }
        };
        const mockDonationsResponse = {
          data: {
            data: [{ id: '1' }],
            meta: { current_page: 1, total_pages: 1 }
          }
        };

        mockedAxios.get
          .mockResolvedValueOnce(mockPeopleResponse)
          .mockResolvedValueOnce(mockGroupsResponse)
          .mockResolvedValueOnce(mockDonationsResponse);

        const result = await provider.sync(['people', 'groups', 'giving']);

        expect(result.stats).toEqual({
          people: { synced: 1, errors: 0 },
          groups: { synced: 1, errors: 0 },
          giving: { synced: 1, errors: 0 }
        });
        expect(result.error).toBeNull();
      });

      it('should handle partial sync failures', async () => {
        mockedAxios.get
          .mockResolvedValueOnce({ data: { data: [], meta: { current_page: 1, total_pages: 1 } } })
          .mockRejectedValueOnce(new Error('API Error'))
          .mockResolvedValueOnce({ data: { data: [], meta: { current_page: 1, total_pages: 1 } } });

        const result = await provider.sync(['people', 'groups', 'giving']);

        expect(result.stats.groups.errors).toBe(1);
        expect(result.error).toBeNull(); // Overall sync should continue despite partial failure
      });
    });
  });
}); 