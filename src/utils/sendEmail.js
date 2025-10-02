const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.sendgrid.net", 
        port: 465,
        secure: true,
        auth: {
            user: "apikey", 
            pass: process.env.SENDGRID_API_KEY,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
