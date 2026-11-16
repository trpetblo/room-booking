const express = require('express');
const {
  getAvailability,
  createBooking,
  getMyBookings,
  getAllBookings,
  updateBooking,
  deleteBooking,
} = require('../controllers/bookingController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const router = express.Router();

// Fixed paths must come before '/:id'
router.get('/availability', protect, getAvailability);
router.get('/mine', protect, getMyBookings);
router.get('/', protect, adminOnly, getAllBookings);
router.post('/', protect, createBooking);
router.put('/:id', protect, updateBooking);
router.delete('/:id', protect, deleteBooking);

module.exports = router;
