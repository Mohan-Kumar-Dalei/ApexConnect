const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (to, subject, html) => {
    const msg = {
        to,
        from: process.env.EMAIL_FROM, // verified sender
        subject,
        html,
    };

    try {
        await sgMail.send(msg);
        console.log("✅ Email sent successfully");
    } catch (error) {
        console.error("❌ Email send error:", error.response?.body || error.message);
        throw new Error("Email not sent");
    }
};

module.exports = sendEmail;
