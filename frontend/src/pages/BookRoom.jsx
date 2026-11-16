import { useState } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

const localToday = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

// Staff member: choose date and time, see room availability, select a room to book.
const BookRoom = () => {
  const { user } = useAuth();
  const headers = { Authorization: `Bearer ${user.token}` };
  const [form, setForm] = useState({ date: localToday(), startTime: '09:00', endTime: '10:00', purpose: '' });
  const [rooms, setRooms] = useState(null);
  const [message, setMessage] = useState(null);

  const change = (field, value) => {
    setForm({ ...form, [field]: value });
    setRooms(null); // availability is only valid for the date/time it was checked for
  };

  const checkAvailability = async (e) => {
    if (e) e.preventDefault();
    try {
      const response = await axiosInstance.get('/api/bookings/availability', {
        headers,
        params: { date: form.date, start: form.startTime, end: form.endTime },
      });
      setRooms(response.data);
      setMessage(null);
    } catch (error) {
      setRooms(null);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Could not check availability.' });
    }
  };

  const selectRoom = async (room) => {
    try {
      const response = await axiosInstance.post(
        '/api/bookings',
        {
          roomId: room._id,
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          purpose: form.purpose,
        },
        { headers }
      );
      const b = response.data;
      setMessage({
        type: 'success',
        text: `Booking confirmed: ${b.room.name} on ${b.date}, ${b.startTime} to ${b.endTime}.`,
      });
      checkAvailability();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Booking failed.' });
      checkAvailability();
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <form onSubmit={checkAvailability} className="bg-white p-6 shadow-md rounded mb-6">
        <h1 className="text-2xl font-bold mb-4">Book a Room</h1>
        <p className="text-sm text-gray-500 mb-4">Business hours are 07:00 to 18:00.</p>
        <label className="block text-sm mb-1">Date</label>
        <input
          type="date"
          value={form.date}
          min={localToday()}
          onChange={(e) => change('date', e.target.value)}
          className="w-full mb-4 p-2 border rounded"
          required
        />
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm mb-1">Start time</label>
            <input
              type="time"
              value={form.startTime}
              min="07:00"
              max="18:00"
              step="900"
              onChange={(e) => change('startTime', e.target.value)}
              className="w-full mb-4 p-2 border rounded"
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm mb-1">End time</label>
            <input
              type="time"
              value={form.endTime}
              min="07:00"
              max="18:00"
              step="900"
              onChange={(e) => change('endTime', e.target.value)}
              className="w-full mb-4 p-2 border rounded"
              required
            />
          </div>
        </div>
        <input
          type="text"
          placeholder="Purpose (optional)"
          value={form.purpose}
          onChange={(e) => setForm({ ...form, purpose: e.target.value })}
          className="w-full mb-4 p-2 border rounded"
        />
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
          Show available rooms
        </button>
      </form>

      {message && (
        <p className={`mb-4 p-3 rounded ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-800'}`}>
          {message.text}
        </p>
      )}

      {rooms && rooms.length === 0 && <p className="text-gray-500">No rooms have been set up yet.</p>}
      {rooms &&
        rooms.map((room) => (
          <div key={room._id} className="bg-gray-100 p-4 mb-3 rounded shadow flex justify-between items-center">
            <div>
              <h3 className="font-bold">{room.name}</h3>
              <p className="text-sm text-gray-600">{room.details}</p>
              <p className={`text-sm ${room.available ? 'text-green-700' : 'text-red-600'}`}>
                {room.available ? 'Available' : 'Already booked for this time'}
              </p>
            </div>
            <button
              onClick={() => selectRoom(room)}
              disabled={!room.available}
              className={`px-4 py-2 rounded text-white ${room.available ? 'bg-blue-600' : 'bg-gray-400 cursor-not-allowed'}`}
            >
              Select
            </button>
          </div>
        ))}
    </div>
  );
};

export default BookRoom;
