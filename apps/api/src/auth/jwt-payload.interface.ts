export interface JwtPayload {
  /** The user ID (UUID) – always present */
  sub: string;

  /** The user's email */
  email?: string;

  /** The audience (usually 'authenticated' or 'anon') */
  aud?: string;

  /** The user's role (Supabase role, e.g., 'authenticated') */
  role?: string;

  /** App metadata (custom data you set in Supabase) */
  app_metadata?: {
    provider?: string;
    providers?: string[];
  };

  /** User metadata (custom data from sign-up) */
  user_metadata?: {
    [key: string]: any;
  };

  /** When the token was issued (Unix timestamp) */
  iat?: number;

  /** When the token expires (Unix timestamp) */
  exp?: number;

  /** Issuer (Supabase URL) */
  iss?: string;

  /** Session ID (if available) */
  session_id?: string;

  /** Any additional fields that might be present */
  [key: string]: any;
}