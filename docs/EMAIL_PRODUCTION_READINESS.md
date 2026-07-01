# Email Production Readiness

Sprint: 5 - High Priority Readiness Fixes
Date: 2026-07-01

## Verified Environment Variable Names

The application expects these names:

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Server-side Resend API key for transactional email. |
| `RESEND_FROM_EMAIL` | Verified sender email address. |
| `RESEND_FROM_NAME` | Display name for outgoing email. |
| `NEXT_PUBLIC_APP_URL` | Base URL used for tracking, invite, and reset links. |
| `VERCEL_PROJECT_PRODUCTION_URL` | Fallback production URL when `NEXT_PUBLIC_APP_URL` is not set. |

No secret values are documented here.

## Sender Requirements

- `RESEND_FROM_EMAIL` must be a valid email address.
- The sender domain or address must be verified in Resend.
- `RESEND_FROM_NAME` should match the company name shown in Hopex V2.
- Password reset, staff reset, shipment status, quote, and general emails all depend on the same sender configuration.

## Functional Coverage

- Compose and send customer emails.
- Save drafts.
- Upload supported attachments.
- Write email send logs.
- Track failed Resend sends.
- Send password reset emails.
- Send staff password reset emails.

## Production Validation Checklist

- Confirm all variable names exist in the deployment environment.
- Confirm `RESEND_API_KEY` is configured without exposing the value.
- Confirm `RESEND_FROM_EMAIL` is verified in Resend.
- Send a password reset to an approved internal test user.
- Send a shipment status email to an approved internal test recipient.
- Confirm `email_logs` records `sent` or actionable `failed` status.
- Confirm no service-role key is exposed to client-side code.

## Known Non-Secret Failure Modes

- Missing `RESEND_API_KEY`: email send fails with configuration error.
- Invalid `RESEND_FROM_EMAIL`: send is blocked before Resend call.
- Unverified sender/domain: Resend rejects the message.
- Missing `NEXT_PUBLIC_APP_URL`: reset and tracking links may fall back to the deployment URL or localhost in local development.
