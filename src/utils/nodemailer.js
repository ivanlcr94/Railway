import { createTransport } from "nodemailer";

const transporter = createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_PASS,
  },
});

const sendMailTo = async (to, subject, text) => {
  const mailOptions = {
    from: process.env.NODEMAILER_FROM || "Tiendita",
    to,
    subject,
    text,
  };
  return await transporter.sendMail(mailOptions);
};

export default sendMailTo;
