const DEFAULT_BASE_URLS = {
  holder: 'https://super-duper-spoon-7v77qpj4pjw6hwrj9-8002.app.github.dev',
  issuer: 'https://super-duper-spoon-7v77qpj4pjw6hwrj9-8000.app.github.dev',
  verifier: 'https://super-duper-spoon-7v77qpj4pjw6hwrj9-8001.app.github.dev',
} as const;

export type ApiService = keyof typeof DEFAULT_BASE_URLS;

export const API_BASE_URLS: Record<ApiService, string> = {
  holder:
    process.env.NEXT_PUBLIC_HOLDER_API_BASE_URL?.trim() || DEFAULT_BASE_URLS.holder,
  issuer:
    process.env.NEXT_PUBLIC_ISSUER_API_BASE_URL?.trim() || DEFAULT_BASE_URLS.issuer,
  verifier:
    process.env.NEXT_PUBLIC_VERIFIER_API_BASE_URL?.trim() || DEFAULT_BASE_URLS.verifier,
};

// Log API configuration in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('API Configuration:', {
    holder: API_BASE_URLS.holder,
    issuer: API_BASE_URLS.issuer,
    verifier: API_BASE_URLS.verifier,
  });
}

export function resolveApiUrl(service: ApiService, path: string): string {
  const baseUrl = API_BASE_URLS[service];
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return `${normalizedBase}${normalizedPath}`;
}
