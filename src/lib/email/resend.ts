import { Resend } from "resend";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  return new Resend(apiKey);
}

function getFromAddress(): string | null {
  const from = process.env.AUTH_EMAIL_FROM?.trim();
  if (!from) return null;

  if (
    (from.startsWith('"') && from.endsWith('"')) ||
    (from.startsWith("'") && from.endsWith("'"))
  ) {
    return from.slice(1, -1);
  }

  return from;
}

export async function sendResendEmail(input: SendEmailInput): Promise<boolean> {
  const from = getFromAddress();
  const resend = getResendClient();

  if (!resend || !from) return false;

  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });

  return !error;
}
