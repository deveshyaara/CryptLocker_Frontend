import { ApiError, apiFetch, apiFetchJson } from './http';
import type { ApiService } from './config';
import type {
  Credential,
  LoginResponse,
  Notification,
  ProofRequest,
  RegisterRequest,
  RegisterResponse,
  User,
  WalletInfo,
  WalletDid,
  Connection,
  ConnectionInvitation,
  ConnectionInvitationRequest,
  ReceiveInvitationPayload,
  CredentialOffer,
} from '@/types/api';

export async function registerUser(payload: RegisterRequest, service: ApiService = 'holder') {
  return apiFetchJson<RegisterResponse>('/auth/register', payload, {
    method: 'POST',
    service,
  });
}

export async function loginUser(
  username: string,
  password: string,
  service: ApiService = 'holder',
) {
  const body = new URLSearchParams({ username, password });
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    service,
  });
}

export async function getCurrentUser(token: string, service: ApiService = 'holder') {
  return apiFetch<User>('/auth/me', {
    method: 'GET',
    token,
    service,
  });
}

export async function getCredentials(token: string, service: ApiService = 'holder') {
  const response = await apiFetch<
    | Credential[]
    | { results?: Credential[]; credentials?: Credential[]; items?: Credential[] }
    | null
  >('/credentials', {
    method: 'GET',
    token,
    cache: 'no-store',
    service,
  });

  if (Array.isArray(response)) {
    return response;
  }

  if (response && typeof response === 'object') {
    if (Array.isArray(response.results)) {
      return response.results;
    }
    if (Array.isArray(response.credentials)) {
      return response.credentials;
    }
    if (Array.isArray(response.items)) {
      return response.items;
    }
  }

  return [];
}

export async function getCredential(
  token: string,
  credentialId: string,
  service: ApiService = 'holder',
) {
  return apiFetch<Credential>(`/credentials/${credentialId}`, {
    method: 'GET',
    token,
    service,
  });
}

export async function deleteCredential(
  token: string,
  credentialId: string,
  service: ApiService = 'holder',
) {
  return apiFetch<{ message: string }>(`/credentials/${credentialId}`, {
    method: 'DELETE',
    token,
    service,
  });
}

export async function getCredentialOffers(token: string, service: ApiService = 'holder') {
  try {
    const response = await apiFetch<
      | CredentialOffer[]
      | { results?: CredentialOffer[]; offers?: CredentialOffer[]; items?: CredentialOffer[] }
      | null
    >('/credentials/offers', {
      method: 'GET',
      token,
      cache: 'no-store',
      service,
    });

    if (Array.isArray(response)) {
      return response;
    }

    if (response && typeof response === 'object') {
      if (Array.isArray(response.results)) {
        return response.results;
      }
      if (Array.isArray(response.offers)) {
        return response.offers;
      }
      if (Array.isArray(response.items)) {
        return response.items;
      }
    }

    return [];
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return [];
    }
    throw error;
  }
}

export async function acceptCredentialOffer(
  token: string,
  credentialExchangeId: string,
  service: ApiService = 'holder',
) {
  return apiFetch<{ message: string; credential_id?: string }>(
    `/credentials/${credentialExchangeId}/accept`,
    {
      method: 'POST',
      token,
      service,
    },
  );
}

export async function getConnections(token: string, service: ApiService = 'holder') {
  const response = await apiFetch<
    | Connection[]
    | { results?: Connection[]; connections?: Connection[]; items?: Connection[] }
    | null
  >('/connections', {
    method: 'GET',
    token,
    cache: 'no-store',
    service,
  });

  if (Array.isArray(response)) {
    return response;
  }

  if (response && typeof response === 'object') {
    if (Array.isArray(response.results)) {
      return response.results;
    }
    if (Array.isArray(response.connections)) {
      return response.connections;
    }
    if (Array.isArray(response.items)) {
      return response.items;
    }
  }

  return [];
}

export async function createConnectionInvitation(
  token: string,
  payload: ConnectionInvitationRequest = {},
  service: ApiService = 'holder',
) {
  return apiFetchJson<ConnectionInvitation>('/connections/create-invitation', payload, {
    method: 'POST',
    token,
    service,
  });
}

export async function acceptConnectionInvitation(
  token: string,
  payload: ReceiveInvitationPayload,
  service: ApiService = 'holder',
) {
  return apiFetchJson<Connection>('/connections', payload, {
    method: 'POST',
    token,
    service,
  });
}

export async function deleteConnection(
  token: string,
  connectionId: string,
  service: ApiService = 'holder',
) {
  return apiFetch<{ message: string }>(`/connections/${connectionId}`, {
    method: 'DELETE',
    token,
    service,
  });
}

export async function getConnection(
  token: string,
  connectionId: string,
  service: ApiService = 'holder',
) {
  return apiFetch<Connection>(`/connections/${connectionId}`, {
    method: 'GET',
    token,
    service,
  });
}

export async function getProofRequests(token: string, service: ApiService = 'holder') {
  const response = await apiFetch<
    | ProofRequest[]
    | { results?: ProofRequest[]; proofs?: ProofRequest[]; items?: ProofRequest[] }
    | null
  >('/proofs/requests', {
    method: 'GET',
    token,
    cache: 'no-store',
    service,
  });

  if (Array.isArray(response)) {
    return response;
  }

  if (response && typeof response === 'object') {
    if (Array.isArray(response.results)) {
      return response.results;
    }
    if (Array.isArray(response.proofs)) {
      return response.proofs;
    }
    if (Array.isArray(response.items)) {
      return response.items;
    }
  }

  return [];
}

export async function getProofRequest(
  token: string,
  proofId: string,
  service: ApiService = 'holder',
) {
  return apiFetch<ProofRequest>(`/proofs/requests/${proofId}`, {
    method: 'GET',
    token,
    service,
  });
}

export async function sendProofPresentation(
  token: string,
  proofId: string,
  payload: Record<string, unknown>,
  service: ApiService = 'holder',
) {
  return apiFetchJson(`/proofs/requests/${proofId}/present`, payload, {
    method: 'POST',
    token,
    service,
  });
}

export async function getNotifications(token: string, service: ApiService = 'holder') {
  try {
    return await apiFetch<Notification[]>('/notifications', {
      method: 'GET',
      token,
      cache: 'no-store',
      service,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return [];
    }
    throw error;
  }
}

export async function markNotificationAsRead(
  token: string,
  notificationId: number,
  service: ApiService = 'holder',
) {
  try {
    return await apiFetch<{ message: string }>(`/notifications/${notificationId}/read`, {
      method: 'PUT',
      token,
      service,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { message: 'Notifications service unavailable' };
    }
    throw error;
  }
}

export async function markAllNotificationsAsRead(
  token: string,
  service: ApiService = 'holder',
) {
  try {
    return await apiFetch<{ message: string; count: number }>('/notifications/read-all', {
      method: 'PUT',
      token,
      service,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { message: 'Notifications service unavailable', count: 0 };
    }
    throw error;
  }
}

export async function getWalletInfo(token: string, service: ApiService = 'holder') {
  return apiFetch<WalletInfo>('/wallet/info', {
    method: 'GET',
    token,
    service,
  });
}

export async function getWalletDid(token: string, service: ApiService = 'holder') {
  return apiFetch<WalletDid>('/wallet/did', {
    method: 'GET',
    token,
    service,
  });
}
