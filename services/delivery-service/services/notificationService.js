const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

class NotificationService {
  static async sendDeliveryAssignment(order, deliveryPerson) {
    try {
      // Send SMS to delivery person
      await client.messages.create({
        body: `New delivery assignment! Order ID: ${order._id}. Please check your dashboard for details.`,
        from: twilioPhoneNumber,
        to: deliveryPerson.phoneNumber
      });

      // Send SMS to customer
      await client.messages.create({
        body: `Your order #${order._id} has been assigned to a delivery person. They will contact you shortly.`,
        from: twilioPhoneNumber,
        to: order.customerPhone
      });
    } catch (error) {
      console.error('Error sending delivery assignment notification:', error);
    }
  }

  static async sendDeliveryStatusUpdate(assignment, user) {
    try {
      const message = `Delivery status update for order #${assignment.orderId}: ${assignment.status}`;
      
      // Send SMS to customer
      await client.messages.create({
        body: message,
        from: twilioPhoneNumber,
        to: user.phoneNumber
      });
    } catch (error) {
      console.error('Error sending delivery status update notification:', error);
    }
  }
}

module.exports = NotificationService; 