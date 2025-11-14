import { ApiService, resolveApiUrl } from './config';

export interface ApiErrorDetails {
  detail?: unknown;
  message?: string;
}

export class ApiError extends Error {
  status: number;
  details?: ApiErrorDetails | unknown;

  constructor(status: number, message: string, details?: ApiErrorDetails | unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export interface ApiFetchOptions extends RequestInit {
  service?: ApiService;
  token?: string;
}

function isFormLike(body: unknown): body is FormData | URLSearchParams {
  return body instanceof FormData || body instanceof URLSearchParams;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  const text = await response.text();
  return text as unknown as T;
}

export async function apiFetch<T>(path: string, init: ApiFetchOptions = {}): Promise<T> {
  const { service = 'holder', token, headers, ...rest } = init;
  const url = resolveApiUrl(service, path);
  const requestHeaders = new Headers(headers);

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  if (
    rest.body !== undefined &&
    !isFormLike(rest.body) &&
    !requestHeaders.has('Content-Type')
  ) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: requestHeaders,
      mode: 'cors',
    });
  } catch (networkError) {
    // Handle network failures (CORS, connection refused, timeout, etc.)
    const errorMessage = networkError instanceof Error 
      ? networkError.message 
      : 'Network request failed';
    
    console.error(`Network error for ${url}:`, errorMessage);
    throw new ApiError(
      0, 
      `Unable to connect to the server. Please check your connection and ensure the API is running.`,
      { detail: errorMessage, url }
    );
  }

  if (!response.ok) {
    let errorDetails: unknown;
    try {
      errorDetails = await parseResponse<ApiErrorDetails | unknown>(response);
    } catch (parseError) {
      errorDetails = { detail: 'Unable to parse error response', message: String(parseError) };
    }

    const message =
      typeof errorDetails === 'object' && errorDetails !== null && 'detail' in errorDetails
        ? String((errorDetails as Record<string, unknown>).detail)
        : response.statusText || 'Request failed';

    throw new ApiError(response.status, message, errorDetails);
  }

  return parseResponse<T>(response);
}

export async function apiFetchJson<T>(
  path: string,
  body: unknown,
  init: ApiFetchOptions = {},
): Promise<T> {
  const preparedBody = body === undefined ? undefined : JSON.stringify(body);
  return apiFetch<T>(path, {
    ...init,
    body: preparedBody,
  });
}
