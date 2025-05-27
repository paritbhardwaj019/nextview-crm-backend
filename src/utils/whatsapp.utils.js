const axios = require("axios");
const FormData = require("form-data");
const config = require("../config/config");

/**
 * Sends a WhatsApp message using the onlywp.in API
 * @param {Object} options - Message options
 * @param {string} options.mobileNo - Recipient's mobile number
 * @param {string} options.countryCode - Country code (default: '+91')
 * @param {string} options.templateName - Template name for the message
 * @param {string} options.text1 - First text variable
 * @param {string} options.text2 - Second text variable
 * @param {string} [options.text3] - Third text variable (optional)
 * @param {string} [options.text4] - Fourth text variable (optional)
 * @param {string} [options.text5] - Fifth text variable (optional)
 * @param {string} [options.mediaUrl] - URL of media to send (optional)
 * @param {string} [options.filePath] - Path to file to send (optional)
 * @returns {Promise<string>} - API response
 */
const sendWhatsAppMessage = async (options) => {
  const form = new FormData();

  form.append("authTkn", config.whatsapp.apiToken);
  form.append("templateName", options.templateName);
  form.append("countryCode", "+91");
  form.append("mobileNo", options.mobileNo);

  form.append("text1", options.text1);
  form.append("text2", options.text2);
  form.append("text3", options.text3);
  form.append("text4", options.text4);
  form.append("text5", options.text5);

  try {
    const response = await axios.post(
      "http://onlywp.in/sendmessage.php",
      form,
      {
        headers: {
          ...form.getHeaders(),
        },
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(`WhatsApp API request failed: ${error.message}`);
  }
};

module.exports = {
  sendWhatsAppMessage,
};
