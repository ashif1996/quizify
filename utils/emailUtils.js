const crypto = require("crypto");
const transporter = require("../config/emailConfig");

const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString("hex");
};

const sendVerificationEmail = async (email, token) => {
    const verificationLink = `http://localhost:3000/users/verify-email?token=${token}`;

    const mailOptions = {
        from: process.env.SEND_OTP_EMAIL,
        to: email,
        subject: 'Email Verification',
        html: `<p>Please verify your email by clicking the link below:</p>
               <a href="${verificationLink}">${verificationLink}</a>`,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        return info;
    } catch (error) {
        console.error("Email sending failed:", error);
        throw new Error("Email sending failed");
    }
};

module.exports = {
    generateVerificationToken,
    sendVerificationEmail,
};