import ApiError from "../utils/ApiError";
import httpStatus from "../config/httpStatus";
import config from "../config/config";
import { Resend } from "resend";
const resend = new Resend(config.resend.apiKey);

class EmailService {
  /**
   * Send email using Resend
   * @param to - Recipient email
   * @param subject - Email subject
   * @param html - Email content in HTML
   */

  async sendEmail(to: string, subject: string, html: string) {
    try {
      await resend.emails.send({
        from: config.resend.fromEmail!,
        to,
        subject,
        html,
      });
    } catch (error) {
      console.error("Error sending email:", error);
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to send email"
      );
    }
  }
}

export default new EmailService();
