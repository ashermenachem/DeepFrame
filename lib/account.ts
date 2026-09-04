export type AccountPlan = 'free' | 'pro' | 'studio';
export type AccountRole = 'user' | 'admin';
export type AccountStatus = 'active' | 'banned' | 'deletion_pending';

export type AccountProfile = {
  id: string;
  username: string;
  email: string | null;
  auth_provider: string;
  role: AccountRole;
  plan: AccountPlan;
  account_status: AccountStatus;
  terms_version: string | null;
  terms_accepted_at: string | null;
  privacy_version: string | null;
  privacy_accepted_at: string | null;
  created_at: string;
  last_seen_at: string | null;
};

export const plans = {
  free: {
    name: 'Free',
    price: '$0',
    uploads: 1,
    removals: 0,
    description: 'A simple daily look beneath one photo.',
  },
  pro: {
    name: 'DeepFrame Pro',
    price: '$9',
    uploads: 25,
    removals: 10,
    description: 'For creators who inspect and clean photos regularly.',
  },
  studio: {
    name: 'DeepFrame Studio',
    price: '$24',
    uploads: 250,
    removals: 100,
    description: 'High-volume tools for professional image workflows.',
  },
} as const;
