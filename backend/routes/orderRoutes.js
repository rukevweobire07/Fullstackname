const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Inventory = require('../models/inventory');

// POST: Place order and deduct inventory stock
router.post('/', async (req, res) => {
  try {
    const { tableNumber, items } = req.body;
    let totalAmount = 0;

    // 1. Verify inventory stock
    for (const item of items) {
      const inventoryItem = await Inventory.findById(item.inventoryItem);
      if (!inventoryItem) {
        return res.status(404).json({ message: 'Item not found in inventory' });
      }
      if (inventoryItem.stockQuantity < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${inventoryItem.itemName}. Only ${inventoryItem.stockQuantity} remaining.` 
        });
      }
      totalAmount += inventoryItem.price * item.quantity;
    }

    // 2. Deduct inventory quantity
    for (const item of items) {
      await Inventory.findByIdAndUpdate(item.inventoryItem, {
        $inc: { stockQuantity: -item.quantity }
      });
    }

    // 3. Save Order
    const newOrder = new Order({
      tableNumber,
      items,
      totalAmount
    });
    await newOrder.save();

    // 4. Emit real-time inventory updates via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('newOrder', newOrder);
      const updatedInventory = await Inventory.find();
      io.emit('inventoryUpdated', updatedInventory);
    }

    res.status(201).json({ message: 'Order placed successfully', order: newOrder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;