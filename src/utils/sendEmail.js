import nodemailer from "nodemailer";

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,  // your gmail
        pass: process.env.EMAIL_PASS,  // app password (not normal gmail password)
      },
    });

    const mailOptions = {
      from: `"MyApp" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
};

export default sendEmail;
