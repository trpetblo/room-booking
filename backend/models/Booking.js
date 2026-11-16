const mongoose = require('mongoose');
const { toHHMM } = require('../utils/time');

const bookingSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    startMinutes: { type: Number, required: true }, // minutes after midnight
    endMinutes: { type: Number, required: true },
    purpose: { type: String, trim: true, default: '' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

bookingSchema.virtual('startTime').get(function () {
  return toHHMM(this.startMinutes);
});
bookingSchema.virtual('endTime').get(function () {
  return toHHMM(this.endMinutes);
});

bookingSchema.index({ room: 1, date: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
