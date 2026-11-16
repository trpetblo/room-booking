const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const { validateSlot, toHHMM } = require('../utils/time');

const OVERLAP_MESSAGE = 'That room is already booked for an overlapping time';

// Is there a booking in this room/date that overlaps [startMinutes, endMinutes)?
const hasOverlap = (roomId, date, startMinutes, endMinutes, excludeId) => {
  const query = {
    room: roomId,
    date,
    startMinutes: { $lt: endMinutes },
    endMinutes: { $gt: startMinutes },
  };
  if (excludeId) query._id = { $ne: excludeId };
  return Booking.exists(query);
};

const canManage = (booking, user) =>
  user.role === 'admin' || String(booking.user) === String(user._id);

// GET /api/bookings/availability?date=YYYY-MM-DD&start=HH:MM&end=HH:MM
const getAvailability = async (req, res) => {
  try {
    const { date, start, end } = req.query;
    const slot = validateSlot(date, start, end);
    if (slot.error) return res.status(400).json({ message: slot.error });

    const [rooms, clashes] = await Promise.all([
      Room.find().sort({ name: 1 }),
      Booking.find({
        date,
        startMinutes: { $lt: slot.endMinutes },
        endMinutes: { $gt: slot.startMinutes },
      }).select('room'),
    ]);
    const busy = new Set(clashes.map((b) => String(b.room)));
    res.json(
      rooms.map((r) => ({
        _id: r._id,
        name: r.name,
        details: r.details,
        available: !busy.has(String(r._id)),
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/bookings
const createBooking = async (req, res) => {
  try {
    const { roomId, date, startTime, endTime, purpose } = req.body;
    if (!mongoose.isValidObjectId(roomId)) {
      return res.status(400).json({ message: 'A valid room is required' });
    }
    const slot = validateSlot(date, startTime, endTime);
    if (slot.error) return res.status(400).json({ message: slot.error });

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    if (await hasOverlap(room._id, date, slot.startMinutes, slot.endMinutes)) {
      return res.status(409).json({ message: OVERLAP_MESSAGE });
    }

    const booking = await Booking.create({
      room: room._id,
      user: req.user._id,
      date,
      startMinutes: slot.startMinutes,
      endMinutes: slot.endMinutes,
      purpose: purpose || '',
    });
    await booking.populate('room', 'name');
    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/bookings/mine
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('room', 'name')
      .sort({ date: 1, startMinutes: 1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/bookings  (admin: everyone's bookings)
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('room', 'name')
      .populate('user', 'name email')
      .sort({ date: 1, startMinutes: 1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/bookings/:id  (owner or admin)
const updateBooking = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!canManage(booking, req.user)) {
      return res.status(403).json({ message: 'You can only change your own bookings' });
    }

    const date = req.body.date || booking.date;
    const startTime = req.body.startTime || toHHMM(booking.startMinutes);
    const endTime = req.body.endTime || toHHMM(booking.endMinutes);
    const slot = validateSlot(date, startTime, endTime);
    if (slot.error) return res.status(400).json({ message: slot.error });

    let roomId = booking.room;
    if (req.body.roomId) {
      if (!mongoose.isValidObjectId(req.body.roomId) || !(await Room.exists({ _id: req.body.roomId }))) {
        return res.status(404).json({ message: 'Room not found' });
      }
      roomId = req.body.roomId;
    }

    if (await hasOverlap(roomId, date, slot.startMinutes, slot.endMinutes, booking._id)) {
      return res.status(409).json({ message: OVERLAP_MESSAGE });
    }

    booking.room = roomId;
    booking.date = date;
    booking.startMinutes = slot.startMinutes;
    booking.endMinutes = slot.endMinutes;
    if (req.body.purpose !== undefined) booking.purpose = req.body.purpose;
    await booking.save();
    await booking.populate('room', 'name');
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/bookings/:id  (owner or admin)
const deleteBooking = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!canManage(booking, req.user)) {
      return res.status(403).json({ message: 'You can only cancel your own bookings' });
    }
    await booking.deleteOne();
    res.json({ message: 'Booking cancelled' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAvailability,
  createBooking,
  getMyBookings,
  getAllBookings,
  updateBooking,
  deleteBooking,
};
