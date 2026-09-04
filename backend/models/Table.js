const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema(
  {
    tableNumber: { type: Number, required: true, unique: true },
    status: { type: String, enum: ['available', 'reserved'], default: 'available' },
    reservedBy: { type: String, default: null },
    reservedAt: { type: Date, default: null },
    capacity: { type: Number, default: 4 }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Table || mongoose.model('Table', tableSchema);