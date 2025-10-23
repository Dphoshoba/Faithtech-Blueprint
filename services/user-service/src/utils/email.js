/**
 * Mock email service for development
 * In production, this would connect to a real SMTP server
 */

/**
 * Sends an email using a mock transport (for development)
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text email content
 * @param {string} [options.html] - HTML email content (optional)
 * @returns {Promise} - Resolves when email is sent
 */
const sendEmail = async (options) => {
  // Mock email sending for development
  console.log('📧 Mock Email Sent:');
  console.log(`   To: ${options.to}`);
  console.log(`   Subject: ${options.subject}`);
  console.log(`   Text: ${options.text}`);
  
  // Simulate async email sending
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return {
    messageId: `mock-${Date.now()}`,
    accepted: [options.to],
    rejected: []
  };
};

module.exports = {
  sendEmail
};