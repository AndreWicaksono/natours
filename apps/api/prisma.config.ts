import path from 'node:path';
import { config } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
    shadowDatabaseUrl: env('DATABASE_SHADOW_URL'),
  },
  experimental: {
    externalTables: true,
  },
  tables: {
    external: [
      'auth.users',
      'auth.identities',
      'auth.sessions',
      'auth.refresh_tokens',
      'auth.mfa_factors',
      'auth.mfa_challenges',
      'auth.mfa_amr_claims',
      'auth.sso_providers',
      'auth.sso_domains',
      'auth.saml_providers',
      'auth.saml_relay_states',
      'auth.flow_state',
      'auth.one_time_tokens',
      'auth.audit_log_entries',
      'auth.instances',
      'auth.schema_migrations',
      'auth.oauth_clients',
      'auth.custom_oauth_providers',
      'auth.oauth_authorizations',
      'auth.oauth_client_states',
      'auth.oauth_consents',
      'auth.webauthn_challenges',
      'auth.webauthn_credentials',
    ],
  },
  enums: {
    external: [
      'auth.factor_type',
      'auth.factor_status',
      'auth.aal_level',
      'auth.code_challenge_method',
      'auth.one_time_token_type',
      'auth.oauth_authorization_status',
      'auth.oauth_client_type',
      'auth.oauth_registration_type',
      'auth.oauth_response_type',
    ],
  },
});
