const express = require('express');
const router = express.Router();
const Table = require('../models/Table');

// Change this to match how many physical tables the restaurant has.
const TOTAL_TABLES = 12;

// Make sure tables 1..TOTAL_TABLES exist in the DB (runs once, harmless after that)
async function ensureTablesExist() {
    const count = await Table.countDocuments();
    if (count === 0) {
        const tables = Array.from({ length: TOTAL_TABLES }, (_, i) => ({ tableNumber: i + 1 }));
        await Table.insertMany(tables);
    }
}

async function broadcastTables(req) {
    const io = req.app.get('io');
    if (io) {
        const allTables = await Table.find().sort({ tableNumber: 1 });
        io.emit('tablesUpdated', allTables);
    }
}

// GET /api/tables - list every table with its current availability
router.get('/', async (req, res) => {
    try {
        await ensureTablesExist();
        const tables = await Table.find().sort({ tableNumber: 1 });
        res.json(tables);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/tables/:tableNumber - check a single table's status
router.get('/:tableNumber', async (req, res) => {
    try {
        const table = await Table.findOne({ tableNumber: Number(req.params.tableNumber) });
        if (!table) return res.status(404).json({ message: 'Table not found' });
        res.json(table);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/tables/:tableNumber/reserve - reserve a table if it's free
router.post('/:tableNumber/reserve', async (req, res) => {
    try {
        const { tableNumber } = req.params;
        const { name } = req.body;

        const table = await Table.findOne({ tableNumber: Number(tableNumber) });
        if (!table) return res.status(404).json({ message: 'Table not found' });
        if (table.status === 'reserved') {
            return res.status(409).json({ message: `Table #${tableNumber} is already reserved` });
        }

        table.status = 'reserved';
        table.reservedBy = name || 'Guest';
        table.reservedAt = new Date();
        await table.save();

        await broadcastTables(req);
        res.json({ message: `Table #${tableNumber} reserved`, table });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/tables/:tableNumber/release - free up a table (staff use)
router.post('/:tableNumber/release', async (req, res) => {
    try {
        const { tableNumber } = req.params;
        const table = await Table.findOne({ tableNumber: Number(tableNumber) });
        if (!table) return res.status(404).json({ message: 'Table not found' });

        table.status = 'available';
        table.reservedBy = null;
        table.reservedAt = null;
        await table.save();

        await broadcastTables(req);
        res.json({ message: `Table #${tableNumber} released`, table });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;