import type { FormEventHandler, ReactNode } from "react";

export type EmptyAuthViewProps = Record<never, never>;

export interface AuthLayoutViewProps {
  children: ReactNode;
}

export interface SignInModel {
  email: string;
  password: string;
  passwordVisible: boolean;
}

export interface SignInState {
  error: string | null;
  isLoading: boolean;
  resendCooldown: number;
  showResend: boolean;
}

export interface SignInActions {
  onEmailChange: (value: string) => void;
  onGoogleSignIn: () => Promise<void>;
  onPasswordChange: (value: string) => void;
  onPasswordVisibilityToggle: () => void;
  onResendVerificationEmail: () => Promise<void>;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

export interface SignInController {
  actions: SignInActions;
  model: SignInModel;
  state: SignInState;
}

export interface SignUpModel {
  confirmPassword: string;
  email: string;
  name: string;
  password: string;
  passwordVisible: boolean;
}

export interface SignUpState {
  emailSent: boolean;
  error: string | null;
  isLoading: boolean;
  resendCooldown: number;
}

export interface SignUpActions {
  onConfirmPasswordChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onGoogleSignUp: () => Promise<void>;
  onNameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onPasswordVisibilityToggle: () => void;
  onResendVerificationEmail: () => Promise<void>;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

export interface SignUpController {
  actions: SignUpActions;
  model: SignUpModel;
  state: SignUpState;
}

export interface ForgotPasswordModel {
  email: string;
}

export interface ForgotPasswordState {
  error: string | null;
  isLoading: boolean;
  isSuccess: boolean;
}

export interface ForgotPasswordActions {
  onEmailChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

export interface ForgotPasswordController {
  actions: ForgotPasswordActions;
  model: ForgotPasswordModel;
  state: ForgotPasswordState;
}

export interface ResetPasswordModel {
  confirmPassword: string;
  confirmPasswordVisible: boolean;
  password: string;
  passwordVisible: boolean;
  token: string | null;
}

export interface ResetPasswordState {
  error: string | null;
  isLoading: boolean;
  isSuccess: boolean;
}

export interface ResetPasswordActions {
  onConfirmPasswordChange: (value: string) => void;
  onConfirmPasswordVisibilityToggle: () => void;
  onPasswordChange: (value: string) => void;
  onPasswordVisibilityToggle: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

export interface ResetPasswordController {
  actions: ResetPasswordActions;
  model: ResetPasswordModel;
  state: ResetPasswordState;
}

export interface ViewContracts {
  "auth.layout": AuthLayoutViewProps;
  "auth.sign-in": EmptyAuthViewProps;
  "auth.sign-up": EmptyAuthViewProps;
  "auth.forgot-password": EmptyAuthViewProps;
  "auth.reset-password": EmptyAuthViewProps;
}
