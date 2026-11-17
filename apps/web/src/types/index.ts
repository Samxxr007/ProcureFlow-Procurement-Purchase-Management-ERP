export * from '@procureflow/shared';

export interface AuthContextType {
  user: any | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchUserRole: (email: string, password: string) => Promise<void>;
}
