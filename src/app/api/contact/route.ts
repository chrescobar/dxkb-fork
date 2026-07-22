import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { withErrorHandling } from "@/lib/api/server";
import {
  contactFormSchema,
  inquiryTypeLabel,
  type ContactFormData,
} from "@/app/(footer)/contact/components/contact-form-utils";

/**
 * Builds the plaintext email body from a validated contact submission,
 * mirroring the metadata the legacy /reportProblem route attached.
 */
function buildMessageBody(data: ContactFormData): string {
  return [
    `Inquiry type: ${inquiryTypeLabel(data.inquiryType)}`,
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    "",
    data.message,
  ].join("\n");
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  const json = await request.json().catch(() => null);

  const parsed = contactFormSchema.safeParse(json);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      {
        error: firstIssue?.message ?? "Invalid contact submission.",
        code: "invalid_request",
      },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Mirrors the BV-BRC report-problem route: default to the deployment
  // server's local mail relay (localhost:25, unauthenticated) unless
  // overridden by env.
  const host = process.env.SMTP_HOST || "localhost";
  const port = Number(process.env.SMTP_PORT) || 25;
  const to = process.env.CONTACT_EMAIL_TO || "help@dxkb.org";
  const from =
    process.env.CONTACT_EMAIL_FROM || "DXKB <do-not-reply@dxkb.org>";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  const transport = nodemailer.createTransport({
    host,
    port,
    // Implicit TLS on 465; STARTTLS otherwise.
    secure: port === 465,
    ...(user && pass ? { auth: { user, pass } } : {}),
    tls: { rejectUnauthorized: false },
  });

  try {
    await transport.sendMail({
      to,
      from,
      replyTo: data.email,
      subject: `[${inquiryTypeLabel(data.inquiryType)}] ${data.subject}`,
      text: buildMessageBody(data),
    });
  } catch (error) {
    // Preserve the original error message per project error-handling rules.
    const detail =
      error instanceof Error ? error.message : String(error);
    console.error("Contact email send failed:", detail);
    return NextResponse.json(
      { error: `Failed to send message: ${detail}`, code: "email_send_failed" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
});
