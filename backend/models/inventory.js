const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    stockQuantity: { type: Number, required: true, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    isAvailable: { type: Boolean, default: true },
    prepTime: { type: Number, default: 15 },
    imageUrl: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema);