const express = require('express');
const router = express.Router();
const Delivery = require('../models/Delivery');
const authMiddleware = require('../middleware/authMiddleware');

// Create a new delivery report
router.post('/', authMiddleware, async (req, res) => {
    try {
        console.log('Creating delivery report in delivery service database');
        console.log('Current database connection:', Delivery.db.name);
        
        const delivery = new Delivery({
            orderId: req.body.orderId,
            deliveryPersonId: req.body.deliveryPersonId,
            deliveryPersonDetails: req.body.deliveryPersonDetails,
            deliveryTime: new Date(req.body.deliveryTime),
            deliveryNotes: req.body.deliveryNotes || '',
            orderDetails: req.body.orderDetails,
            status: 'delivered'
        });

        const savedDelivery = await delivery.save();
        console.log('Delivery report saved in database:', Delivery.db.name);
        console.log('Saved delivery:', savedDelivery);

        res.status(201).json(savedDelivery);
    } catch (error) {
        console.error('Error creating delivery report:', error);
        res.status(500).json({ 
            message: 'Failed to create delivery report', 
            error: error.message 
        });
    }
});

// Get delivery reports count
router.get('/count', authMiddleware, async (req, res) => {
    try {
        console.log('Fetching delivery reports count from database:', Delivery.db.name);
        const count = await Delivery.countDocuments({
            'deliveryPersonDetails._id': req.user._id
        });
        console.log('Found delivery reports count:', count);
        res.json({ count });
    } catch (error) {
        console.error('Error fetching delivery reports count:', error);
        res.status(500).json({ 
            message: 'Failed to fetch delivery reports count', 
            error: error.message 
        });
    }
});

// Get delivery service stats for admin
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const [totalDeliveries, completedDeliveries] = await Promise.all([
      Delivery.countDocuments(),
      Delivery.countDocuments({ status: 'delivered' })
    ]);

    res.json({
      totalDeliveries,
      completedDeliveries
    });
  } catch (error) {
    console.error('Error fetching delivery stats:', error);
    res.status(500).json({ 
      message: 'Failed to fetch delivery stats', 
      error: error.message 
    });
  }
});

module.exports = router;