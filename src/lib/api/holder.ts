import { ApiError, apiFetch, apiFetchJson } from './http';
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

export async function registerUser(payload: RegisterRequest) {
  return apiFetchJson<RegisterResponse>('/auth/register', payload, {
    method: 'POST',
  });
}

export async function loginUser(username: string, password: string) {
  const body = new URLSearchParams({ username, password });
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
}

export async function getCurrentUser(token: string) {
  return apiFetch<User>('/auth/me', {
    method: 'GET',
    token,
  });
}

export async function getCredentials(token: string) {
  const response = await apiFetch<
    | Credential[]
    | { results?: Credential[]; credentials?: Credential[]; items?: Credential[] }
    | null
  >('/credentials', {
    method: 'GET',
    token,
    cache: 'no-store',
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

export async function getCredential(token: string, credentialId: string) {
  return apiFetch<Credential>(`/credentials/${credentialId}`, {
    method: 'GET',
    token,
  });
}

export async function deleteCredential(token: string, credentialId: string) {
  return apiFetch<{ message: string }>(`/credentials/${credentialId}`, {
    method: 'DELETE',
    token,
  });
}

export async function getCredentialOffers(token: string) {
  try {
    const response = await apiFetch<
      | CredentialOffer[]
      | { results?: CredentialOffer[]; offers?: CredentialOffer[]; items?: CredentialOffer[] }
      | null
    >('/credentials/offers', {
      method: 'GET',
      token,
      cache: 'no-store',
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

export async function acceptCredentialOffer(token: string, credentialExchangeId: string) {
  return apiFetch<{ message: string; credential_id?: string }>(
    `/credentials/${credentialExchangeId}/accept`,
    {
      method: 'POST',
      token,
    },
  );
}

export async function getConnections(token: string) {
  const response = await apiFetch<
    | Connection[]
    | { results?: Connection[]; connections?: Connection[]; items?: Connection[] }
    | null
  >('/connections', {
    method: 'GET',
    token,
    cache: 'no-store',
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
) {
  return apiFetchJson<ConnectionInvitation>('/connections/create-invitation', payload, {
    method: 'POST',
    token,
  });
}

export async function acceptConnectionInvitation(
  token: string,
  payload: ReceiveInvitationPayload,
) {
  return apiFetchJson<Connection>('/connections', payload, {
    method: 'POST',
    token,
  });
}

export async function deleteConnection(token: string, connectionId: string) {
  return apiFetch<{ message: string }>(`/connections/${connectionId}`, {
    method: 'DELETE',
    token,
  });
}

export async function getConnection(token: string, connectionId: string) {
  return apiFetch<Connection>(`/connections/${connectionId}`, {
    method: 'GET',
    token,
  });
}

export async function getProofRequests(token: string) {
  const response = await apiFetch<
    | ProofRequest[]
    | { results?: ProofRequest[]; proofs?: ProofRequest[]; items?: ProofRequest[] }
    | null
  >('/proofs/requests', {
    method: 'GET',
    token,
    cache: 'no-store',
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

export async function getProofRequest(token: string, proofId: string) {
  return apiFetch<ProofRequest>(`/proofs/requests/${proofId}`, {
    method: 'GET',
    token,
  });
}

export async function sendProofPresentation(
  token: string,
  proofId: string,
  payload: Record<string, unknown>,
) {
  return apiFetchJson(`/proofs/requests/${proofId}/present`, payload, {
    method: 'POST',
    token,
  });
}

export async function getNotifications(token: string) {
  try {
    return await apiFetch<Notification[]>('/notifications', {
      method: 'GET',
      token,
      cache: 'no-store',
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return [];
    }
    throw error;
  }
}

export async function markNotificationAsRead(token: string, notificationId: number) {
  try {
    return await apiFetch<{ message: string }>(`/notifications/${notificationId}/read`, {
      method: 'PUT',
      token,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { message: 'Notifications service unavailable' };
    }
    throw error;
  }
}

export async function markAllNotificationsAsRead(token: string) {
  try {
    return await apiFetch<{ message: string; count: number }>('/notifications/read-all', {
      method: 'PUT',
      token,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { message: 'Notifications service unavailable', count: 0 };
    }
    throw error;
  }
}

export async function getWalletInfo(token: string) {
  return apiFetch<WalletInfo>('/wallet/info', {
    method: 'GET',
    token,
  });
}

export async function getWalletDid(token: string) {
  return apiFetch<WalletDid>('/wallet/did', {
    method: 'GET',
    token,
  });
}
