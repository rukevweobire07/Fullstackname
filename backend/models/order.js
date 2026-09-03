const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    tableNumber: { type: Number, required: true },
    items: [{
        inventoryItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
        quantity: { type: Number, required: true, default: 1 },
        notes: { type: String }
    }],
    totalAmount: { type: Number, default: 0 },
    status: { 
        type: String, 
        enum: ['Pending', 'Preparing', 'Ready', 'Served', 'Completed'], 
        default: 'Pending' 
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);