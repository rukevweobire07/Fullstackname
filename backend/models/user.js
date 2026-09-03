const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        trim: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true,
        trim: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String, 
        enum: ['customer', 'admin', 'kitchen', 'waiter'], 
        default: 'customer' 
    },
    loyaltyPoints: {
        type: Number,
        default: 0
    },
    tableHoldPerkActive: {
        type: Boolean,
        default: false
    },
    reservedTableNumber: {
        type: Number,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);