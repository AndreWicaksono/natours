import { AppRole } from '../generated/prisma/enums';

export interface UserPayload {
  /** The user's UUID (from Supabase Auth) */
  id: string;

  /** The user's email (from the JWT) */
  email?: string;

  /** The user's application role (from the `profiles` table) */
  role: AppRole;

  /** The partner ID the user is associated with, or null */
  partnerId: number | null;

  /** User's first name (from `profiles`) */
  firstName: string | null;

  /** User's last name (from `profiles`) */
  lastName: string | null;

  /** User's avatar URL (from `profiles`) */
  avatarUrl: string | null;
}