import nodemailer from "nodemailer"
import dotenv from "dotenv"

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.USER_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false, // This might be needed for some environments, but generally not recommended for production
  },
  logger: true, // Enable logging to console
  debug: true, // Enable debug output
});

// Password reset email
const sendPasswordResetMail = async (to, otp) => {
    try {
        const mailOptions = {
            from: process.env.USER_EMAIL,
            to: to,
            subject: "Reset Your Password - InstructoPlus",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
                    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h2 style="color: #4f46e5; text-align: center; margin-bottom: 30px;">Password Reset Request</h2>
                        <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hello,</p>
                        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                            You requested to reset your password for your InstructoPlus account. Use the OTP below to reset your password:
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <span style="background-color: #4f46e5; color: white; padding: 15px 30px; font-size: 24px; font-weight: bold; border-radius: 8px; letter-spacing: 3px;">${otp}</span>
                        </div>
                        <p style="color: #ef4444; font-size: 14px; text-align: center; margin: 20px 0;">
                            This OTP expires in 5 minutes for security reasons.
                        </p>
                        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                            If you didn't request this password reset, please ignore this email or contact our support team.
                        </p>
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                            Best regards,<br>
                            The InstructoPlus Team
                        </p>
                    </div>
                </div>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log("Password reset email sent successfully");
        return result;
    } catch (error) {
        console.error("Password reset email sending error:", error.message);
        throw new Error("Failed to send password reset email");
    }
}

// Announcement email
const sendAnnouncementMail = async (to, subject, title, description, attachmentUrl, senderName) => {
    try {
        const mailOptions = {
            from: process.env.USER_EMAIL,
            to: to,
            subject: subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
                    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h2 style="color: #4f46e5; margin: 0;">📢 New Announcement</h2>
                            <p style="color: #6b7280; margin: 5px 0;">from ${senderName || 'Your Instructor'}</p>
                        </div>

                        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #1f2937; margin: 0 0 15px 0;">${title}</h3>
                            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">${description}</p>
                        </div>

                        ${attachmentUrl ? `
                            <div style="margin: 20px 0; padding: 15px; background-color: #eff6ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
                                <p style="color: #1e40af; margin: 0; font-weight: 500;">📎 Attachment Available</p>
                                <a href="${attachmentUrl}" style="color: #2563eb; text-decoration: none; font-size: 14px;">Click here to view attachment</a>
                            </div>
                        ` : ''}

                        <div style="margin: 30px 0; text-align: center;">
                            <a href="https://instructoplus.onrender.com/notifications" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                                View in InstructoPlus
                            </a>
                        </div>

                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                            This announcement was sent through InstructoPlus.<br>
                            Best regards, The InstructoPlus Team
                        </p>
                    </div>
                </div>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log("Announcement email sent successfully");
        return result;
    } catch (error) {
        console.error("Announcement email sending error:", error.message);
        throw new Error("Failed to send announcement email");
    }
}

// Backward compatibility - default export for password reset
const sendMail = sendPasswordResetMail;

export default sendMail;
export { sendPasswordResetMail, sendAnnouncementMail };
