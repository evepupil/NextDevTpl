export interface AuthNavigation {
  afterSignIn: string | null;
  afterSignOut: string;
}

export const authNavigation: AuthNavigation = {
  afterSignIn: "/dashboard",
  afterSignOut: "/",
};
