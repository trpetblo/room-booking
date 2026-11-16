// Business rules for bookings: 07:00 to 18:00, no overlaps.
const BUSINESS_START = 7 * 60; // 07:00 in minutes
const BUSINESS_END = 18 * 60; // 18:00 in minutes
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const toMinutes = (t) => {
  if (typeof t !== 'string' || !TIME_RE.test(t)) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const toHHMM = (mins) =>
  `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

const isValidDate = (d) => {
  if (typeof d !== 'string' || !DATE_RE.test(d)) return false;
  const dt = new Date(`${d}T00:00:00Z`);
  return !isNaN(dt.getTime()) && dt.toISOString().slice(0, 10) === d;
};

// Returns { startMinutes, endMinutes } or { error }
const validateSlot = (date, start, end) => {
  if (!isValidDate(date)) return { error: 'Date must be in YYYY-MM-DD format' };
  const startMinutes = toMinutes(start);
  const endMinutes = toMinutes(end);
  if (startMinutes === null || endMinutes === null) {
    return { error: 'Times must be in HH:MM (24-hour) format' };
  }
  if (startMinutes >= endMinutes) return { error: 'End time must be after start time' };
  if (startMinutes < BUSINESS_START || endMinutes > BUSINESS_END) {
    return { error: 'Bookings must be within business hours (07:00 to 18:00)' };
  }
  return { startMinutes, endMinutes };
};

// Back-to-back bookings (one ends when the next starts) do not overlap.
const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && aEnd > bStart;

module.exports = {
  BUSINESS_START,
  BUSINESS_END,
  toMinutes,
  toHHMM,
  isValidDate,
  validateSlot,
  overlaps,
};
