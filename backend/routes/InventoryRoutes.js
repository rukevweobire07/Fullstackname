const express = require('express');
const router = express.Router();
const Inventory = require('../models/inventory');

// GET: Fetch all inventory items
router.get('/', async (req, res) => {
  try {
    const items = await Inventory.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Add a new item to inventory
router.post('/', async (req, res) => {
  try {
    const newItem = new Inventory(req.body);
    await newItem.save();

    // Broadcast inventory update live via Socket.io
    const io = req.app.get('io');
    if (io) {
      const updatedInventory = await Inventory.find();
      io.emit('inventoryUpdated', updatedInventory);
    }

    res.status(201).json(newItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT: Update stock quantity or item details
router.put('/:id', async (req, res) => {
  try {
    const updatedItem = await Inventory.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );

    // Broadcast inventory update live via Socket.io
    const io = req.app.get('io');
    if (io) {
      const updatedInventory = await Inventory.find();
      io.emit('inventoryUpdated', updatedInventory);
    }

    res.json(updatedItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE: Remove an item from inventory
router.delete('/:id', async (req, res) => {
  try {
    await Inventory.findByIdAndDelete(req.params.id);

    const io = req.app.get('io');
    if (io) {
      const updatedInventory = await Inventory.find();
      io.emit('inventoryUpdated', updatedInventory);
    }

    res.json({ message: 'Item removed from inventory' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;