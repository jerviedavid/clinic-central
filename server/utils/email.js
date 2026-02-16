import nodemailer from 'nodemailer';

// Configure transporter
// In production, use your actual SMTP settings
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Send verification email
 * @param {string} email - Recipient email
 * @param {string} fullName - Recipient name
 * @param {string} token - Verification token
 */
export const sendVerificationEmail = async (email, fullName, token) => {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

    const mailOptions = {
        from: `"Clinic Management System" <${process.env.SMTP_FROM || 'noreply@clinic.com'}>`,
        to: email,
        subject: 'Verify Your Email Address',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
                <h2 style="color: #1a202c;">Verify your email</h2>
                <p>Hello ${fullName},</p>
                <p>Thank you for signing up! Please verify your email address to complete your registration and access all features.</p>
                <div style="margin: 30px 0;">
                    <a href="${verificationUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Verify Email Address</a>
                </div>
                <p>If you didn't create an account, you can safely ignore this email.</p>
                <p style="font-size: 0.875rem; color: #718096; margin-top: 20px;">
                    Alternatively, copy and paste this link into your browser:<br>
                    <a href="${verificationUrl}">${verificationUrl}</a>
                </p>
            </div>
        `,
    };

    try {
        // If SMTP isn't configured, log the email content instead of failing
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.log('\n--- EMAIL LOG (SMTP NOT CONFIGURED) ---');
            console.log(`To: ${email}`);
            console.log(`Subject: ${mailOptions.subject}`);
            console.log(`Verification URL: ${verificationUrl}`);
            console.log('----------------------------------------\n');
            return true;
        }

        await transporter.sendMail(mailOptions);
        console.log(`✅ Verification email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('❌ Error sending verification email:', error);
        // Don't throw error in development if email fails, just log it
        if (process.env.NODE_ENV === 'development') {
            console.log('Development mode: Continuing despite email failure.');
            console.log(`Verification URL: ${verificationUrl}`);
            return true;
        }
        throw error;
    }
};

/**
 * Send welcome email to new user
 * @param {string} email - Recipient email
 * @param {string} fullName - Recipient name
 * @param {string} clinicName - Name of the clinic created
 */
export const sendWelcomeEmail = async (email, fullName, clinicName) => {
    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`;

    const mailOptions = {
        from: `"Clinic Management System" <${process.env.SMTP_FROM || 'noreply@clinic.com'}>`,
        to: email,
        subject: 'Welcome to Clinic Central! 🎉',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #3b82f6; margin-bottom: 10px;">Welcome to Clinic Central! 🎉</h1>
                </div>
                
                <p style="font-size: 16px;">Hello ${fullName},</p>
                
                <p style="font-size: 16px; line-height: 1.6;">
                    Thank you for joining Clinic Central - Doctor, Receptionist, Prescription, Medicine and Patient Management System! We're excited to have you on board.
                </p>
                
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #1a202c; margin-top: 0;">Your Account Details:</h3>
                    <ul style="line-height: 1.8;">
                        <li><strong>Email:</strong> ${email}</li>
                        <li><strong>Clinic:</strong> ${clinicName}</li>
                        <li><strong>Roles:</strong> Doctor & Admin</li>
                        <li><strong>Trial Period:</strong> 14 days (Starter Plan)</li>
                    </ul>
                </div>
                
                <p style="font-size: 16px; line-height: 1.6;">
                    Your clinic has been successfully created with both Doctor and Admin privileges. You now have access to all features including:
                </p>
                
                <ul style="line-height: 1.8;">
                    <li>Patient management</li>
                    <li>Appointment scheduling</li>
                    <li>Prescription creation</li>
                    <li>Billing and invoicing</li>
                    <li>Token queue management</li>
                    <li>Clinic settings and user management</li>
                </ul>
                
                <div style="margin: 30px 0; text-align: center;">
                    <a href="${dashboardUrl}" style="background-color: #3b82f6; color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
                        Go to Dashboard
                    </a>
                </div>
                
                <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0; color: #92400e;">
                        <strong>📧 Important:</strong> Please verify your email address to ensure uninterrupted access to all features.
                    </p>
                </div>
                
                <p style="font-size: 14px; color: #718096; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                    Need help getting started? Check out our documentation or contact our support team.<br><br>
                    If you have any questions, feel free to reply to this email.
                </p>
                
                <p style="font-size: 14px; color: #718096;">
                    Best regards,<br>
                    <strong>The Clinic Central Team</strong>
                </p>
            </div>
        `,
    };

    try {
        // If SMTP isn't configured, log the email content instead of failing
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.log('\n--- WELCOME EMAIL LOG (SMTP NOT CONFIGURED) ---');
            console.log(`To: ${email}`);
            console.log(`Subject: ${mailOptions.subject}`);
            console.log(`Clinic: ${clinicName}`);
            console.log('------------------------------------------------\n');
            return true;
        }

        await transporter.sendMail(mailOptions);
        console.log(`✅ Welcome email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('❌ Error sending welcome email:', error);
        // Don't throw error in development if email fails, just log it
        if (process.env.NODE_ENV === 'development') {
            console.log('Development mode: Continuing despite email failure.');
            return true;
        }
        throw error;
    }
};
