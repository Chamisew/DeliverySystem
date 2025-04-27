const twilio = require('twilio');

class NotificationService {
  constructor() {
    try {
      console.log('[Twilio] Checking credentials...');
      console.log('[Twilio] Account SID:', this.maskCredential(process.env.TWILIO_ACCOUNT_SID));
      console.log('[Twilio] Auth Token:', this.maskCredential(process.env.TWILIO_AUTH_TOKEN));
      console.log('[Twilio] Phone Number:', process.env.TWILIO_PHONE_NUMBER);

      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
        throw new Error('Missing Twilio credentials');
      }

      this.client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      console.log('[Twilio] Client initialized successfully');
    } catch (error) {
      console.error('[Twilio] Initialization Error:', error.message);
      throw error;
    }
  }

  maskCredential(credential) {
    if (!credential) return 'NOT_SET';
    return credential.substring(0, 4) + '...' + credential.substring(credential.length - 4);
  }

  async sendSMS(to, message) {
    try {
      console.log('\n[SMS] Starting SMS send process');
      console.log('[SMS] Validating phone number:', to);

      // Format phone number if it doesn't start with +
      const formattedPhone = to.startsWith('+') ? to : `+${to}`;
      console.log('[SMS] Formatted phone number:', formattedPhone);

      console.log('[SMS] Attempting to send message');
      console.log('[SMS] Message length:', message.length);

      const result = await this.client.messages.create({
        body: message,
        to: formattedPhone,
        from: process.env.TWILIO_PHONE_NUMBER
      });

      console.log('\n[SMS] Message sent successfully!');
      console.log('[SMS] Message SID:', result.sid);
      console.log('[SMS] Message Status:', result.status);
      console.log('[SMS] Error Code:', result.errorCode);
      console.log('[SMS] Error Message:', result.errorMessage);

      return {
        success: true,
        messageId: result.sid,
        status: result.status
      };
    } catch (error) {
      console.error('\n[SMS] SENDING FAILED');
      console.error('[SMS] Error Name:', error.name);
      console.error('[SMS] Error Code:', error.code);
      console.error('[SMS] Error Message:', error.message);
      if (error.moreInfo) {
        console.error('[SMS] More Info:', error.moreInfo);
      }
      throw error;
    }
  }

  getStatusMessage(status) {
    const messages = {
      'pending': 'Your order has been received and is pending confirmation.',
      'confirmed': 'Your order has been confirmed and is being processed.',
      'preparing': 'Your order is being prepared.',
      'ready': 'Your order is ready for pickup.',
      'out_for_delivery': 'Your order is out for delivery.',
      'delivered': 'Your order has been delivered. Enjoy!',
      'cancelled': 'Your order has been cancelled.'
    };
    return messages[status] || `Your order status has been updated to: ${status}`;
  }

  async sendOrderStatusUpdate(order, user, oldStatus, newStatus) {
    const statusMessages = {
      pending: 'Order received and pending confirmation',
      preparing: 'Restaurant is preparing your order',
      ready: 'Your order is ready for pickup',
      out_for_delivery: 'Your order is on the way!',
      delivered: 'Your order has been delivered. Enjoy!',
      cancelled: 'Your order has been cancelled'
    };

    const message = `Order #${order._id} Update: ${statusMessages[newStatus] || newStatus}`;
    
    if (user.phone) {
      await this.sendSMS(user.phone, message);
      await this.logNotification({
        type: 'ORDER_STATUS_UPDATE',
        orderId: order._id,
        userId: user._id,
        message,
        status: 'sent'
      });
    }
  }

  async logNotification(notificationData) {
    try {
      console.log('Notification sent:', notificationData);
      // You could store this in a database if needed
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }

  async sendOrderConfirmation(order, user) {
    const message = `Your order #${order._id} has been confirmed! Total: Rs. ${order.totalAmount}. We'll notify you about the status updates.`;
    
    if (user.phone) {
      await this.sendSMS(user.phone, message);
    }
  }

  async sendDeliveryAssignment(order, deliveryPerson) {
    const message = `New delivery assignment: Order #${order._id}. Pickup from ${order.restaurant.name} and deliver to ${order.deliveryAddress}`;
    
    if (deliveryPerson.phone) {
      await this.sendSMS(deliveryPerson.phone, message);
    }
  }
}

module.exports = new NotificationService(); 