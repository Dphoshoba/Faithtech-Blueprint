type ApiResponse<T> = {
  data?: T;
  error?: string;
};

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`/api/${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return { data: data as T };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Something went wrong',
    };
  }
}

export async function submitLead(leadData: {
  name: string;
  email: string;
  churchName: string;
  churchSize: string;
  message?: string;
}) {
  return fetchApi('leads', {
    method: 'POST',
    body: JSON.stringify(leadData),
  });
} 