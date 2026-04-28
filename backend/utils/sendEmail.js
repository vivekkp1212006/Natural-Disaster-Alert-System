const nodemailer = require("nodemailer");

const APP_NAME = "Aegis Disaster Response";

const formatEmailBody = (greeting, lines = []) => {
    const content = [greeting, "", ...lines, "", `Regards,`, APP_NAME].join("\n");
    return content;
};

const sendEmail = async (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: subject || `${APP_NAME} notification`,
    text
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Failed to send email:", error.message);
    throw new Error("Email sending failed");
  }
};

const sendStructuredEmail = async ({ to, subject, greeting, lines }) => {
  const safeSubject = subject || `${APP_NAME} notification`;
  const safeGreeting = greeting || "Hello,";
  const body = formatEmailBody(safeGreeting, lines || []);
  await sendEmail(to, safeSubject, body);
};

module.exports = { sendEmail, sendStructuredEmail, formatEmailBody };
