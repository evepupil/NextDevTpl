"use client";

import { useState } from "react";
import type { FormEventHandler } from "react";

import { forgetPassword } from "@/lib/auth/client";

import type { ForgotPasswordController } from "./contracts";

export function useForgotPasswordController(): ForgotPasswordController {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const onSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await forgetPassword(email, "/reset-password");
      setIsSuccess(true);
    } catch {
      setError("Failed to send reset link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    actions: {
      onEmailChange: setEmail,
      onSubmit,
    },
    model: { email },
    state: { error, isLoading, isSuccess },
  };
}
