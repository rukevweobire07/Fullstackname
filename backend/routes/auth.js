const express = require('express');
const router = express.Router();
const User = require('../models/user');

// Register User
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const newUser = new User({ 
            name, 
            email, 
            password, // Note: Use bcrypt in production for password hashing
            role: 'customer',
            loyaltyPoints: 50 // Signup bonus points
        });

        await newUser.save();
        res.status(201).json({ message: 'User registered successfully', user: newUser });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login User
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, password });
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        res.json({ message: 'Login successful', user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Hold Table Grace Period (Gamified Loyalty Feature)
router.post('/hold-table', async (req, res) => {
    try {
        const { userId, tableNumber } = req.body;
        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.loyaltyPoints < 20) {
            return res.status(400).json({ message: 'Insufficient points (20 required)' });
        }

        user.loyaltyPoints -= 20;
        user.tableHoldPerkActive = true;
        user.reservedTableNumber = tableNumber;
        await user.save();

        res.json({ message: `Table #${tableNumber} held!`, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;