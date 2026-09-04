const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const Inventory = require('./models/inventory');

// Define Order Schema directly or fallback
const orderSchema = new mongoose.Schema(
  {
    tableNumber: { type: Number, required: true },
    items: [
      {
        inventoryItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
        quantity: { type: Number, required: true, default: 1 }
      }
    ],
    status: { type: String, enum: ['Pending', 'Preparing', 'Ready', 'Served'], default: 'Pending' }
  },
  { timestamps: true }
);

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

// Attach io to request object
app.use((req, res, next) => {
  req.io = io;
  next();
});

// --- AUTH ROUTES ---
app.use('/api/auth', require('./routes/auth'));

// --- INVENTORY ROUTES ---
app.get('/api/inventory', async (req, res) => {
  try {
    const items = await Inventory.find({});
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Repopulate Stock Endpoint
app.post('/api/inventory/repopulate', async (req, res) => {
  try {
    await Inventory.updateMany({}, { stockQuantity: 20, isAvailable: true });
    const updated = await Inventory.find({});
    io.emit('inventoryUpdated', updated);
    res.json({ message: 'Stock successfully repopulated!' });
  } catch (err) {
    console.error('Repopulate Error:', err);
    res.status(500).json({ message: 'Failed to repopulate stock' });
  }
});

// --- ORDER ROUTES ---
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('items.inventoryItem')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { tableNumber, items } = req.body;
    const newOrder = new Order({ tableNumber, items });
    await newOrder.save();

    // Deduct stock levels and check if item is sold out
    for (const item of items) {
      const invItem = await Inventory.findById(item.inventoryItem);
      if (invItem) {
        const newQty = Math.max(0, invItem.stockQuantity - item.quantity);
        invItem.stockQuantity = newQty;
        if (newQty === 0) {
          invItem.isAvailable = false;
        }
        await invItem.save();
      }
    }

    // Broadcast updated inventory to all connected menus
    const updatedInventory = await Inventory.find({});
    io.emit('inventoryUpdated', updatedInventory);

    // Populate order items and broadcast to kitchen display
    const populatedOrder = await Order.findById(newOrder._id).populate('items.inventoryItem');
    io.emit('orderPlaced', populatedOrder);

    res.status(201).json(populatedOrder);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('items.inventoryItem');

    io.emit('orderStatusUpdated', updatedOrder);
    res.json(updatedOrder);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Socket.io Connection Log
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
});

// DB Connection & Server Start
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smartdine')
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));
  app.use('/api/tables', require('./routes/tables'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});