export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  created_at?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  full_name?: string;
}

export interface RegisterResponse extends User {}

export interface Credential {
  credential_id: string;
  schema_id: string;
  cred_def_id: string;
  state: string;
  connection_id: string;
  attrs?: Record<string, string>;
  created_at?: string;
}

export interface Connection {
  connection_id: string;
  their_label?: string;
  state?: string;
  their_did?: string;
  my_did?: string;
  created_at?: string;
}

export interface ConnectionInvitation {
  connection_id: string;
  invitation: Record<string, unknown>;
  invitation_url: string;
}

export interface ConnectionInvitationRequest {
  alias?: string;
  auto_accept?: boolean;
  multi_use?: boolean;
}

export interface ReceiveInvitationPayload {
  invitation?: Record<string, unknown>;
  invitation_url?: string;
  alias?: string;
  auto_accept?: boolean;
}

export interface RequestedAttribute {
  name: string;
  restrictions?: Restriction[];
}

export interface RequestedPredicate {
  name: string;
  p_type: '>=' | '>' | '<=' | '<';
  p_value: number;
  restrictions?: Restriction[];
}

export interface Restriction {
  schema_id?: string;
  schema_issuer_did?: string;
  schema_name?: string;
  schema_version?: string;
  issuer_did?: string;
  cred_def_id?: string;
}

export interface ProofRequest {
  presentation_exchange_id: string;
  connection_id: string;
  state: string;
  requested_attributes: Record<string, RequestedAttribute>;
  requested_predicates: Record<string, RequestedPredicate>;
  created_at?: string;
  verified?: boolean | null;
}

export interface CredentialOffer {
  credential_exchange_id: string;
  connection_id?: string;
  schema_id?: string;
  created_at?: string;
  state?: string;
  attributes?: Record<string, string>;
  issuer?: string;
  comment?: string;
}

export type NotificationType = 'connection' | 'credential' | 'proof' | string;

export interface Notification {
  id: number;
  user_id?: number;
  type: NotificationType;
  title: string;
  message: string;
  related_id?: string;
  is_read?: boolean;
  created_at?: string;
}

export interface WalletInfo {
  wallet_id: string;
  created_at?: string;
  key_management_mode?: string;
}

export interface WalletDid {
  did: string;
  verkey: string;
  metadata?: Record<string, unknown>;
}
