import "server-only";

import { Resend } from "resend";

let resendClient: Resend | null = null;

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Resend is not configured. Set RESEND_API_KEY in this deployment.");
  }

  resendClient ??= new Resend(apiKey);
  return resendClient;
}
