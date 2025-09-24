# Email Debugging Guide

## Common Issues and Solutions

Your email system isn't sending emails in production. Here's how to debug:

## Step 1: Check Environment Variables

In production, ensure these environment variables are set correctly:

### Required Variables
- `MAIL_CONSOLE_PREVIEW=false` - Set to false to send real emails
- `RESEND_API_KEY=re_...` - Your Resend API key (starts with "re_")
- `MAIL_FROM=Your Name <your-email@yourdomain.com>` - Valid from address

### Optional Variables
- `BRAND_NAME` - Your app name for emails
- `BRAND_LOGO_URL` - Logo URL (must be https://)
- `BRAND_TAGLINE` - Tagline for emails

## Step 2: Check Logs

The system now logs comprehensive debug information. Check these locations:

### Convex Logs
- In your Convex dashboard, check function logs
- Look for `[EMAIL DEBUG]` prefixed messages

### Vercel Logs  
- Check your Vercel function logs
- Look for `[client-log]` messages sent via `/api/log`

## Step 3: Common Error Messages

### "RESEND_API_KEY is required"
- Check `RESEND_API_KEY` is set in production environment
- Verify it starts with "re_" and is at least 20 characters

### "Mail configuration invalid"
- Check `MAIL_FROM` format: `Name <email@domain.com>`
- Verify all required env vars are present

### "MAIL_CONSOLE_PREVIEW=true"
- Change to `MAIL_CONSOLE_PREVIEW=false` in production
- This setting logs emails instead of sending them

## Step 4: Test Email Sending

Look for these log patterns:

```
[EMAIL] sendEmailVerification called for user@email.com
[EMAIL DEBUG] Starting email dispatch for type: emailVerification
[EMAIL DEBUG] Mail config: { preview: false, hasResendApiKey: true, ... }
[EMAIL DEBUG] Template rendered successfully for emailVerification
[EMAIL DEBUG] Attempting to send real email for emailVerification
[EMAIL DEBUG] Creating Resend client with API key length: 45
[EMAIL DEBUG] Sending email via Resend API: { from: ..., to: ..., ... }
[EMAIL DEBUG] Email sent successfully for emailVerification
```

## Step 5: Verify Resend Domain

Ensure your sending domain is verified in Resend:
1. Go to your Resend dashboard
2. Check "Domains" section
3. Verify the domain used in `MAIL_FROM` is verified

## Environment Variable Examples

```bash
# Production settings
MAIL_CONSOLE_PREVIEW=false
RESEND_API_KEY=re_your_actual_api_key_here
MAIL_FROM=MyApp Team <noreply@myapp.com>

# Optional branding
BRAND_NAME=MyApp
BRAND_LOGO_URL=https://myapp.com/logo.png
BRAND_TAGLINE=Welcome to MyApp
```

## Quick Fix Checklist

1. ✅ `MAIL_CONSOLE_PREVIEW=false`
2. ✅ `RESEND_API_KEY` is set and valid 
3. ✅ `MAIL_FROM` uses verified domain
4. ✅ Check Convex/Vercel logs for errors
5. ✅ Verify Resend domain is active

If emails still don't work after checking all above, look at the specific error messages in your logs - they should now be much more detailed and helpful.
