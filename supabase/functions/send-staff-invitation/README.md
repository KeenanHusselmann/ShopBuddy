# Send Staff Invitation Edge Function

This edge function handles sending staff invitation emails when the Supabase admin API is not available.

## Setup

1. **Deploy the function:**
   ```bash
   supabase functions deploy send-staff-invitation
   ```

2. **Configure email service:**
   - Edit the function to integrate with your preferred email service
   - Options: SendGrid, Resend, SMTP, etc.

## Usage

The function is called automatically when:
- Supabase admin API fails
- You want to use custom email templates
- You need more control over email delivery

## Email Service Integration

Replace the TODO section with your email service:

```typescript
// Example with SendGrid
import { createClient } from '@sendgrid/mail';

const sgMail = createClient(process.env.SENDGRID_API_KEY);

await sgMail.send({
  to: email,
  from: 'noreply@yourshop.com',
  subject: `Staff Invitation - ${shopName}`,
  html: emailContent
});
```

## Environment Variables

Set these in your Supabase dashboard:
- `SENDGRID_API_KEY` (if using SendGrid)
- `RESEND_API_KEY` (if using Resend)
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` (if using SMTP)
