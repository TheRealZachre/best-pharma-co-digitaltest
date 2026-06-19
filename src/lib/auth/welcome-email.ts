import { CLIENT_NAME } from "@/lib/client";
import { sendResendEmail } from "@/lib/email/resend";

export async function sendWelcomeEmail(input: {
  email: string;
  name: string;
  username: string;
  password: string;
  loginUrl: string;
}): Promise<boolean> {
  const loginUrl = input.loginUrl.replace(/\/$/, "");

  return sendResendEmail({
    to: input.email,
    subject: `Your ${CLIENT_NAME} Digital account`,
    html: `<p>Hi ${escapeHtml(input.name)},</p>
<p>An administrator created a ${CLIENT_NAME} Digital account for you.</p>
<p><strong>Sign-in URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
<p><strong>Username:</strong> ${escapeHtml(input.username)}</p>
<p><strong>Temporary password:</strong> ${escapeHtml(input.password)}</p>
<p>Please sign in and change your password from Account settings.</p>`,
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
