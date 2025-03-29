const { Resend } = require("resend");
const NotificationPreference = require("../models/notificationPreference.model");
const User = require("../models/user.model");
const config = require("../config/config");

class NotificationService {
  constructor() {
    this.resend = new Resend(config.email.resendApiKey);
  }

  async sendEmail({ to, subject, text, html }) {
    return new Promise((resolve, reject) => {
      this.resend.emails
        .send({
          from: `Nextview Kavach <${config.email.from}>`,
          to: Array.isArray(to) ? to : [to],
          subject: subject,
          text: text,
          html: html,
          headers: {
            Importance: "high",
            Priority: "urgent",
            "X-Priority": "1",
          },
        })
        .then((response) => {
          console.log("Email sent successfully");
          console.log("Message ID:", response.data.id);
          resolve({
            success: true,
            messageId: response.data.id,
          });
        })
        .catch((error) => {
          console.error("Email sending failed:", error);
          reject({
            success: false,
            error: error.message,
          });
        });
    });
  }

  async getUserNotificationPreferences(userId) {
    const preferences = await NotificationPreference.findOne({ userId });

    if (!preferences) {
      return {
        email: true,
        whatsapp: false,
        sms: false,
      };
    }

    return {
      email: preferences.email,
      whatsapp: preferences.whatsapp,
      sms: preferences.sms,
    };
  }

  async notify({ userId, subject, message, notificationType }) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error("User not found");
      }

      const preferences = await this.getUserNotificationPreferences(userId);
      const results = [];

      if (preferences.email) {
        const emailResult = await this.sendEmail({
          to: user.email,
          subject,
          text: message,
        });

        results.push({
          channel: "email",
          success: emailResult.success,
        });
      }

      if (preferences.whatsapp) {
        results.push({
          channel: "whatsapp",
          success: false,
          message: "WhatsApp integration not implemented yet",
        });
      }

      if (preferences.sms) {
        results.push({
          channel: "sms",
          success: false,
          message: "SMS integration not implemented yet",
        });
      }

      return {
        success: results.some((r) => r.success),
        results,
      };
    } catch (error) {
      console.error("Notification failed:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

const notificationService = new NotificationService();

module.exports = {
  sendEmail: (params) => notificationService.sendEmail(params),
  notify: (params) => notificationService.notify(params),
  getUserNotificationPreferences: (userId) =>
    notificationService.getUserNotificationPreferences(userId),
};
