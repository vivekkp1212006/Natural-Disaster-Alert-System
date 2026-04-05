const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, text) => {
    // TODO 1: create transporter
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
    // TODO 2: define mail options
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text
    };
    // TODO 3: send mail
    try {
        await transporter.sendMail(mailOptions);
    }
     catch (error) {
        console.error("Failed to send email:", error.message);
        throw new Error("Email sending failed");
    }
};

module.exports = { sendEmail };
