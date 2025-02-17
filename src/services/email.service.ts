import ApiError from "../utils/ApiError";
import httpStatus from "../config/httpStatus";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: "no_reply@nextviewkavach.in",
    pass: "b14ck-cyph3R",
  },
});

class EmailService {
  /**
   * Send email using Hostinger SMTP
   * @param to - Recipient email
   * @param subject - Email subject
   * @param html - Email content in HTML
   */
  async sendEmail(to: string, subject: string, html: string) {
    try {
      const mailOptions = {
        from: '"Nextview Kavach" <no_reply@nextviewkavach.in>',
        to,
        subject,
        html,
        headers: {
          Importance: "high",
          Priority: "urgent",
          "X-Priority": "1",
        },
      };

      await transporter.sendMail(mailOptions);
    } catch (error) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to send email"
      );
    }
  }
}

export default new EmailService();
