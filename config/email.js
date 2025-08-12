const nodemailer = require('nodemailer');
require('dotenv').config();

// Email configuration
const emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || 'your-email@gmail.com',
        pass: process.env.SMTP_PASS || 'your-app-password'
    }
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Verify connection configuration
const verifyConnection = async () => {
    try {
        await transporter.verify();
        console.log('✅ Email service connected successfully');
        return true;
    } catch (error) {
        console.error('❌ Email service connection failed:', error.message);
        return false;
    }
};

// Email templates
const emailTemplates = {
    // Successful registration email
    registrationSuccess: (userData) => ({
        subject: 'Welcome to CRM System - Registration Successful!',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to CRM System</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                    .highlight { background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Welcome to CRM System!</h1>
                        <p>Your account has been created successfully</p>
                    </div>
                    <div class="content">
                        <h2>Hello ${userData.first_name} ${userData.last_name}!</h2>
                        <p>Welcome to our CRM System! We're excited to have you on board.</p>
                        
                        <div class="highlight">
                            <strong>Account Details:</strong><br>
                            Username: <strong>${userData.username}</strong><br>
                            Email: <strong>${userData.email}</strong><br>
                            Role: <strong>${userData.role}</strong>
                        </div>
                        
                        <p>To complete your account setup, please verify your email address by entering the OTP code that was sent to you.</p>
                        
                        <p><strong>Next Steps:</strong></p>
                        <ol>
                            <li>Check your email for the verification OTP</li>
                            <li>Enter the OTP in the verification page</li>
                            <li>Start using your CRM account!</li>
                        </ol>
                        
                        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
                        
                        <p>Best regards,<br>The CRM Team</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated message, please do not reply to this email.</p>
                        <p>&copy; 2024 CRM System. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    // OTP email for registration
    registrationOTP: (userData, otp) => ({
        subject: 'CRM System - Email Verification OTP',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Verification OTP</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .otp-box { background: #fff; border: 2px dashed #28a745; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
                    .otp-code { font-size: 32px; font-weight: bold; color: #28a745; letter-spacing: 5px; }
                    .warning { background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Email Verification</h1>
                        <p>Complete your account setup</p>
                    </div>
                    <div class="content">
                        <h2>Hello ${userData.first_name}!</h2>
                        <p>Thank you for registering with our CRM System. To complete your account setup, please use the verification code below:</p>
                        
                        <div class="otp-box">
                            <p style="margin: 0 0 10px 0; color: #666;">Your verification code:</p>
                            <div class="otp-code">${otp}</div>
                            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Valid for 5 minutes</p>
                        </div>
                        
                        <div class="warning">
                            <strong>⚠️ Important:</strong>
                            <ul style="margin: 10px 0; padding-left: 20px;">
                                <li>This code will expire in 5 minutes</li>
                                <li>Do not share this code with anyone</li>
                                <li>If you didn't request this, please ignore this email</li>
                            </ul>
                        </div>
                        
                        <p>Enter this code in the verification page to activate your account.</p>
                        
                        <p>Best regards,<br>The CRM Team</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated message, please do not reply to this email.</p>
                        <p>&copy; 2024 CRM System. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    // OTP email for password reset
    passwordResetOTP: (userData, otp) => ({
        subject: 'CRM System - Password Reset OTP',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Password Reset OTP</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .otp-box { background: #fff; border: 2px dashed #dc3545; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
                    .otp-code { font-size: 32px; font-weight: bold; color: #dc3545; letter-spacing: 5px; }
                    .warning { background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔑 Password Reset</h1>
                        <p>Reset your account password</p>
                    </div>
                    <div class="content">
                        <h2>Hello ${userData.first_name}!</h2>
                        <p>We received a request to reset your password for your CRM System account. Use the verification code below to proceed:</p>
                        
                        <div class="otp-box">
                            <p style="margin: 0 0 10px 0; color: #666;">Your verification code:</p>
                            <div class="otp-code">${otp}</div>
                            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Valid for 5 minutes</p>
                        </div>
                        
                        <div class="warning">
                            <strong>⚠️ Security Notice:</strong>
                            <ul style="margin: 10px 0; padding-left: 20px;">
                                <li>This code will expire in 5 minutes</li>
                                <li>Never share this code with anyone</li>
                                <li>If you didn't request a password reset, please contact support immediately</li>
                                <li>Your account security is important to us</li>
                            </ul>
                        </div>
                        
                        <p>After entering the code, you'll be able to set a new password for your account.</p>
                        
                        <p>Best regards,<br>The CRM Team</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated message, please do not reply to this email.</p>
                        <p>&copy; 2024 CRM System. All rights reserved.</p>
                    </div>
                </body>
                </html>
        `
    }),

    // OTP email for email update
    emailUpdateOTP: (userData, otp, newEmail) => ({
        subject: 'CRM System - Email Update Verification OTP',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Update Verification</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #17a2b8 0%, #6f42c1 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .otp-box { background: #fff; border: 2px dashed #17a2b8; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
                    .otp-code { font-size: 32px; font-weight: bold; color: #17a2b8; letter-spacing: 5px; }
                    .email-change { background: #e7f3ff; padding: 15px; border-radius: 5px; border-left: 4px solid #17a2b8; margin: 20px 0; }
                    .warning { background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📧 Email Update Verification</h1>
                        <p>Verify your new email address</p>
                    </div>
                    <div class="content">
                        <h2>Hello ${userData.first_name}!</h2>
                        <p>We received a request to update your email address from <strong>${userData.email}</strong> to <strong>${newEmail}</strong>.</p>
                        
                        <div class="email-change">
                            <strong>Email Change Request:</strong><br>
                            Current Email: <strong>${userData.email}</strong><br>
                            New Email: <strong>${newEmail}</strong>
                        </div>
                        
                        <p>To confirm this change, please use the verification code below:</p>
                        
                        <div class="otp-box">
                            <p style="margin: 0 0 10px 0; color: #666;">Your verification code:</p>
                            <div class="otp-code">${otp}</div>
                            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Valid for 5 minutes</p>
                        </div>
                        
                        <div class="warning">
                            <strong>⚠️ Important:</strong>
                            <ul style="margin: 10px 0; padding-left: 20px;">
                                <li>This code will expire in 5 minutes</li>
                                <li>Only use this code if you requested the email change</li>
                                <li>After verification, your login email will change to: ${newEmail}</li>
                                <li>If you didn't request this change, please contact support immediately</li>
                            </ul>
                        </div>
                        
                        <p>Enter this code to complete your email address update.</p>
                        
                        <p>Best regards,<br>The CRM Team</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated message, please do not reply to this email.</p>
                        <p>&copy; 2024 CRM System. All rights reserved.</p>
                    </div>
                </body>
                </html>
        `
    })
};

// Send email function
const sendEmail = async (to, template, data) => {
    try {
        const emailContent = emailTemplates[template](data.userData || data, data.otp, data.newEmail);
        const recipient = template === 'emailUpdateOTP' && data.newEmail ? data.newEmail : to;
        const mailOptions = {
            from: `"CRM System" <${process.env.SMTP_USER}>`,
            to: recipient,
            subject: emailContent.subject,
            html: emailContent.html
        };
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully to ${recipient}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`❌ Failed to send email to ${to}:`, error.message);
        return { success: false, error: error.message };
    }
};

module.exports = {
    transporter,
    verifyConnection,
    sendEmail,
    emailTemplates
};
