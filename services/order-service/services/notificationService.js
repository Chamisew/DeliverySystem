const twilio = require('twilio');
const nodemailer = require('nodemailer');

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

class NotificationService {
  static async sendSMS(to, message) {
    try {
      await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to
      });
      return true;
    } catch (error) {
      console.error('SMS sending failed:', error);
      return false;
    }
  }

  static async sendEmail(to, subject, html) {
    try {
      await emailTransporter.sendMail({
        from: process.env.EMAIL_USER,
        to: to,
        subject: subject,
        html: html
      });
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  static async sendOrderConfirmation(order, user) {
    const orderMessage = `Your order #${order._id} has been confirmed! Total: Rs. ${order.totalAmount}`;
    const emailHtml = `
      <h2>Order Confirmation</h2>
      <p>Order ID: ${order._id}</p>
      <p>Total Amount: Rs. ${order.totalAmount}</p>
      <p>Delivery Address: ${order.deliveryAddress}</p>
      <p>Thank you for choosing our service!</p>
    `;

    await Promise.all([
      this.sendSMS(user.phone, orderMessage),
      this.sendEmail(user.email, 'Order Confirmation', emailHtml)
    ]);
  }

  static async sendDeliveryAssignment(order, deliveryPerson) {
    const message = `New delivery assignment: Order #${order._id} to ${order.deliveryAddress}`;
    const emailHtml = `
      <h2>New Delivery Assignment</h2>
      <p>Order ID: ${order._id}</p>
      <p>Delivery Address: ${order.deliveryAddress}</p>
      <p>Please proceed to pick up the order.</p>
    `;

    await Promise.all([
      this.sendSMS(deliveryPerson.phone, message),
      this.sendEmail(deliveryPerson.email, 'New Delivery Assignment', emailHtml)
    ]);
  }

  static async sendDeliveryStatusUpdate(order, user) {
    const message = `Order #${order._id} status: ${order.status}`;
    const emailHtml = `
      <h2>Order Status Update</h2>
      <p>Order ID: ${order._id}</p>
      <p>Status: ${order.status}</p>
      <p>Current Location: ${order.currentLocation || 'Not available'}</p>
    `;

    await Promise.all([
      this.sendSMS(user.phone, message),
      this.sendEmail(user.email, 'Order Status Update', emailHtml)
    ]);
  }
}

module.exports = NotificationService; 