const mongoose = require('mongoose');
const Order = require('../models/Order');

class OrderService {
    constructor() {
        this.connect();
    }

    async connect() {
        try {
            await mongoose.connect(process.env.ORDERS_DB_URI);
            console.log('Connected to Orders Database');
        } catch (error) {
            console.error('Error connecting to Orders Database:', error);
            throw error;
        }
    }

    async getOrders(status = null) {
        try {
            const query = status ? { status } : {};
            console.log('Fetching orders with query:', query);
            
            const orders = await Order.find(query)
                .populate('restaurant', 'name _id')
                .populate('items.restaurant', 'name _id')
                .sort({ createdAt: -1 });
            
            // Detailed logging of the first order's structure
            if (orders.length > 0) {
                console.log('First order structure:', {
                    _id: orders[0]._id,
                    user: orders[0].user,
                    restaurant: orders[0].restaurant,
                    items: orders[0].items,
                    customer: orders[0].customer,
                    deliveryAddress: orders[0].deliveryAddress,
                    totalAmount: orders[0].totalAmount,
                    status: orders[0].status
                });
            }
            
            return orders;
        } catch (error) {
            console.error('Error fetching orders:', error);
            throw error;
        }
    }

    async getOrderById(orderId) {
        try {
            const order = await Order.findById(orderId);
            return order;
        } catch (error) {
            console.error('Error fetching order:', error);
            throw error;
        }
    }

    async updateOrderStatus(orderId, status) {
        try {
            const order = await Order.findByIdAndUpdate(
                orderId,
                { status },
                { new: true }
            );
            return order;
        } catch (error) {
            console.error('Error updating order status:', error);
            throw error;
        }
    }
}

module.exports = new OrderService(); 