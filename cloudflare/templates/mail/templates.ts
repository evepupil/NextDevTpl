export interface RenderedEmail {
  html: string;
  text: string;
}

interface ActionEmailParams {
  actionLabel: string;
  actionUrl: string;
  expiresIn: string;
  greeting: string;
  message: string;
  title: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createActionEmail(params: ActionEmailParams): RenderedEmail {
  const actionLabel = escapeHtml(params.actionLabel);
  const actionUrl = escapeHtml(params.actionUrl);
  const expiresIn = escapeHtml(params.expiresIn);
  const greeting = escapeHtml(params.greeting);
  const message = escapeHtml(params.message);
  const title = escapeHtml(params.title);

  return {
    html: [
      '<!doctype html><html><body style="background:#fff;color:#111827;font-family:Arial,sans-serif">',
      '<main style="border:1px solid #e5e7eb;border-radius:8px;margin:40px auto;max-width:576px;padding:32px">',
      '<h1 style="text-align:center">NextDevTpl</h1>',
      `<h2>${title}</h2>`,
      `<p>${greeting}</p>`,
      `<p>${message}</p>`,
      '<p style="text-align:center">',
      `<a href="${actionUrl}" style="background:#7c3aed;border-radius:6px;color:#fff;display:inline-block;padding:12px 24px;text-decoration:none">${actionLabel}</a>`,
      "</p>",
      `<p style="color:#6b7280;font-size:14px;text-align:center">This link will expire in ${expiresIn}.</p>`,
      `<p style="color:#6b7280;font-size:12px;word-break:break-all">If the button does not work, open: ${actionUrl}</p>`,
      '<p style="color:#9ca3af;font-size:12px;text-align:center">If you did not request this email, you can ignore it.</p>',
      "</main></body></html>",
    ].join(""),
    text: [
      params.title,
      "",
      params.greeting,
      params.message,
      "",
      `${params.actionLabel}: ${params.actionUrl}`,
      "",
      `This link will expire in ${params.expiresIn}.`,
    ].join("\n"),
  };
}

export function createResetPasswordEmail(params: {
  name: string;
  resetUrl: string;
}): RenderedEmail {
  return createActionEmail({
    actionLabel: "Reset Password",
    actionUrl: params.resetUrl,
    expiresIn: "1 hour",
    greeting: `Hi ${params.name},`,
    message: "We received a request to reset your password.",
    title: "Reset Your Password",
  });
}

export function createVerifyEmail(params: {
  name: string;
  verifyUrl: string;
}): RenderedEmail {
  return createActionEmail({
    actionLabel: "Verify Email",
    actionUrl: params.verifyUrl,
    expiresIn: "24 hours",
    greeting: `Hi ${params.name},`,
    message: "Please verify your email address to keep your account secure.",
    title: "Verify Your Email",
  });
}
