interface AuthErrorAlertProps {
  className?: string;
  message: string | null;
}

export function AuthErrorAlert({ message, className }: AuthErrorAlertProps) {
  if (!message) return null;

  return (
    <div
      className={
        className || "rounded-md bg-destructive/10 p-3 text-sm text-destructive"
      }
    >
      {message}
    </div>
  );
}
