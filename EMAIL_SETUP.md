# Email Configuration Setup Guide

This guide will help you configure email sending functionality for Clinic Central.

## Overview

The system now sends two types of emails after user signup:
1. **Verification Email** - Contains a link to verify the user's email address
2. **Welcome Email** - A friendly welcome message with account details and getting started information

## SMTP Configuration

### Using Gmail (Recommended for Development)

**Prerequisites**: App passwords require 2-Factor Authentication (2FA) to be enabled.

#### Step 1: Enable 2-Factor Authentication

1. Go to: https://myaccount.google.com/security
2. Scroll to "How you sign in to Google"
3. Click on "2-Step Verification"
4. Click "Get Started" and follow the prompts
5. Choose your verification method (phone, authenticator app, etc.)
6. Complete the setup

#### Step 2: Generate an App Password

After 2FA is enabled:

1. Visit: https://myaccount.google.com/apppasswords
2. You may need to sign in again
3. Under "Select app", choose "Mail"
4. Under "Select device", choose "Other (Custom name)"
5. Enter "Clinic Management System"
6. Click "Generate"
7. **Copy the 16-character password** (format: xxxx xxxx xxxx xxxx)
8. Click "Done"

#### Step 3: Update your `.env` file

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
SMTP_FROM=Clinic Central <noreply@clinic.com>
FRONTEND_URL=http://localhost:5173
```

**Note**: Remove spaces from the app password when pasting into `.env`

### Alternative: Using Ethereal Email (Testing Only)

If you can't set up Gmail or just want to test, use Ethereal Email (fake SMTP for testing):

1. Go to: https://ethereal.email/create
2. Click "Create Ethereal Account"
3. Copy the credentials shown
4. Update your `.env`:
   ```env
   SMTP_HOST=smtp.ethereal.email
   SMTP_PORT=587
   SMTP_USER=the-username-from-ethereal
   SMTP_PASS=the-password-from-ethereal
   SMTP_FROM=Clinic Central <noreply@clinic.com>
   FRONTEND_URL=http://localhost:5173
   ```
5. Emails won't actually send but you can view them at https://ethereal.email/messages

**⚠️ Ethereal is for testing only - don't use in production!**

### Using Other Email Providers

#### Outlook/Office365
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

## Development Mode

If SMTP credentials are not configured, the system will:
- Continue working without sending actual emails
- Log email content to the console
- Show verification URLs in the terminal

This is useful for testing without setting up email.

## Testing Email Functionality

1. **Start the server**:
   ```bash
   npm run dev
   ```

2. **Create a new user** through the signup form

3. **Check the console** for:
   - ✅ Success messages: "Verification email sent" and "Welcome email sent"
   - 📧 Email logs (if SMTP not configured)
   - ❌ Error messages (if configuration is incorrect)
"App passwords setting not available" Error (Gmail)

This happens when 2-Factor Authentication is not enabled. Solutions:

1. **Enable 2FA first** (required for app passwords):
   - Go to https://myaccount.google.com/security
   - Enable "2-Step Verification"
   - Then revisit https://myaccount.google.com/apppasswords

2. **Use Ethereal Email for testing** (see Alternative section above)

3. **Try these workarounds** (not recommended for security):
   - Enable "Less secure app access" at https://myaccount.google.com/lesssecureapps
   - **Warning**: This is less secure and Google may disable it

4. **Use a different email provider** (Outlook, SendGrid, etc.)

### Emails Not Sending

1. **Check SMTP credentials** are correct in `.env`
2. **Verify firewall/antivirus** isn't blocking port 587
3. **Gmail users**: Ensure App Password is used (not regular password)
4. **Check console logs** for detailed error messages
5. **Test with Ethereal Email** to rule out SMTP configuration issu
- Professional HTML template
- Secure verification link (24-hour expiration)
- Clear call-to-action button
- Fallback text link

### Welcome Email
- Personalized greeting
- Account summary (email, clinic name, roles, trial period)
- Feature highlights
- Dashboard link
- Support information

## Troubleshooting

### Emails Not Sending

1. **Check SMTP credentials** are correct in `.env`
2. **Verify firewall/antivirus** isn't blocking port 587
3. **Gmail users**: Ensure App Password is used (not regular password)
4. **Check console logs** for detailed error messages

### Emails Going to Spam

1. Use a professional "From" address
2. For production, use a dedicated email service (SendGrid, Mailgun, AWS SES)
3. Configure SPF, DKIM, and DMARC records for your domain

### Verification Link Not Working

1. Ensure `FRONTEND_URL` is set correctly in `.env`
2. Check that the URL matches your frontend development/production URL

## Production Recommendations

For production deployments:

1. **Use a dedicated email service** (SendGrid, Mailgun, AWS SES)
2. **Configure a custom domain** with proper DNS records
3. **Enable email tracking** and analytics
4. **Set up email templates** with your branding
5. **Implement rate limiting** to prevent abuse
6. **Monitor delivery rates** and bounce management

## Environment Variables Reference

```env
# SMTP Host (mail server address)
SMTP_HOST=smtp.gmail.com

# SMTP Port (587 for TLS, 465 for SSL)
SMTP_PORT=587

# SMTP username (usually your email)
SMTP_USER=your-email@gmail.com

# SMTP password (or app-specific password)
SMTP_PASS=your-password

# From address shown to recipients
SMTP_FROM=Clinic Central <noreply@clinic.com>

# Frontend URL for links in emails
FRONTEND_URL=http://localhost:5173
```

## Support

If you encounter issues:
1. Check the server console for error messages
2. Verify all environment variables are set correctly
3. Test with a simple email first
4. Review email provider documentation
