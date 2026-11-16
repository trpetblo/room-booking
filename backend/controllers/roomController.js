const mongoose = require('mongoose');
const Room = require('../models/Room');
const Booking = require('../models/Booking');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Room names must be unique, ignoring upper/lower case.
const nameInUse = async (name, excludeId) => {
  const query = { name: new RegExp(`^${escapeRegex(name)}$`, 'i') };
  if (excludeId) query._id = { $ne: excludeId };
  return Room.exists(query);
};

// GET /api/rooms  (any logged-in user)
const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find().sort({ name: 1 });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/rooms  (admin)
const createRoom = async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    const details = req.body.details || '';
    if (!name) return res.status(400).json({ message: 'Room name is required' });
    if (await nameInUse(name)) {
      return res.status(400).json({ message: 'Room name already exists, no room created' });
    }
    const room = await Room.create({ name, details });
    res.status(201).json(room);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Room name already exists, no room created' });
    }
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/rooms/:id  (admin)
const updateRoom = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Room not found' });
    }
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const name = req.body.name !== undefined ? String(req.body.name).trim() : room.name;
    if (!name) return res.status(400).json({ message: 'Room name is required' });
    if (name.toLowerCase() !== room.name.toLowerCase() && (await nameInUse(name, room._id))) {
      return res.status(400).json({ message: 'Room name already exists' });
    }
    room.name = name;
    if (req.body.details !== undefined) room.details = req.body.details;
    const updated = await room.save();
    res.json(updated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Room name already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/rooms/:id  (admin) - also removes that room's bookings
const deleteRoom = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Room not found' });
    }
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    await Booking.deleteMany({ room: room._id });
    await room.deleteOne();
    res.json({ message: 'Room deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getRooms, createRoom, updateRoom, deleteRoom };
