const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/user');
const Table = require('../models/Table');

// Register User
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email and password are required' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role: 'customer',
            loyaltyPoints: 50 // Signup bonus points
        });
        await newUser.save();

        // Never send the password hash back to the client
        const userToReturn = newUser.toObject();
        delete userToReturn.password;

        res.status(201).json({ message: 'User registered successfully', user: userToReturn });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login User
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const userToReturn = user.toObject();
        delete userToReturn.password;

        res.json({ message: 'Login successful', user: userToReturn });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Hold Table Grace Period (Gamified Loyalty Feature)
// Now also flips the shared Table record so the kitchen/customer views
// stay in sync with who's actually holding a table.
router.post('/hold-table', async (req, res) => {
    try {
        const { userId, tableNumber } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.loyaltyPoints < 20) {
            return res.status(400).json({ message: 'Insufficient points (20 required)' });
        }

        const table = await Table.findOne({ tableNumber: Number(tableNumber) });
        if (table && table.status === 'reserved') {
            return res.status(409).json({ message: `Table #${tableNumber} is already reserved` });
        }

        user.loyaltyPoints -= 20;
        user.tableHoldPerkActive = true;
        user.reservedTableNumber = tableNumber;
        await user.save();

        if (table) {
            table.status = 'reserved';
            table.reservedBy = user.name;
            table.reservedAt = new Date();
            await table.save();

            const io = req.app.get('io');
            if (io) {
                const allTables = await Table.find().sort({ tableNumber: 1 });
                io.emit('tablesUpdated', allTables);
            }
        }

        res.json({ message: `Table #${tableNumber} held!`, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;