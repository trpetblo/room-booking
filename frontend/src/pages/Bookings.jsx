import { useState, useEffect } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

// "My Bookings" for staff; pass all={true} for the admin "All Bookings" view.
const Bookings = ({ all = false }) => {
  const { user } = useAuth();
  const headers = { Authorization: `Bearer ${user.token}` };
  const [bookings, setBookings] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ date: '', startTime: '', endTime: '', purpose: '' });
  const [message, setMessage] = useState(null);

  const load = async () => {
    try {
      const response = await axiosInstance.get(all ? '/api/bookings' : '/api/bookings/mine', { headers });
      setBookings(response.data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load bookings.' });
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all]);

  const startEdit = (b) => {
    setEditingId(b._id);
    setForm({ date: b.date, startTime: b.startTime, endTime: b.endTime, purpose: b.purpose || '' });
    setMessage(null);
  };

  const save = async (id) => {
    try {
      await axiosInstance.put(`/api/bookings/${id}`, form, { headers });
      setEditingId(null);
      setMessage({ type: 'success', text: 'Booking updated.' });
      load();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update booking.' });
    }
  };

  const cancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await axiosInstance.delete(`/api/bookings/${id}`, { headers });
      setMessage({ type: 'success', text: 'Booking cancelled.' });
      load();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to cancel booking.' });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">{all ? 'All Bookings' : 'My Bookings'}</h1>
      {message && (
        <p className={`mb-4 p-3 rounded ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-800'}`}>
          {message.text}
        </p>
      )}
      {bookings.length === 0 && <p className="text-gray-500">No bookings yet.</p>}
      {bookings.map((b) => (
        <div key={b._id} className="bg-gray-100 p-4 mb-3 rounded shadow">
          {editingId === b._id ? (
            <div>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full mb-2 p-2 border rounded"
              />
              <div className="flex gap-2">
                <input
                  type="time"
                  value={form.startTime}
                  min="07:00"
                  max="18:00"
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="flex-1 mb-2 p-2 border rounded"
                />
                <input
                  type="time"
                  value={form.endTime}
                  min="07:00"
                  max="18:00"
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className="flex-1 mb-2 p-2 border rounded"
                />
              </div>
              <input
                type="text"
                placeholder="Purpose"
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                className="w-full mb-2 p-2 border rounded"
              />
              <button onClick={() => save(b._id)} className="mr-2 bg-blue-600 text-white px-4 py-2 rounded">
                Save
              </button>
              <button onClick={() => setEditingId(null)} className="bg-gray-400 text-white px-4 py-2 rounded">
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold">{b.room ? b.room.name : '(room removed)'}</h3>
                <p>{b.date}, {b.startTime} to {b.endTime}</p>
                {b.purpose && <p className="text-sm text-gray-600">{b.purpose}</p>}
                {all && b.user && <p className="text-sm text-gray-500">Booked by {b.user.name} ({b.user.email})</p>}
              </div>
              <div>
                <button onClick={() => startEdit(b)} className="mr-2 bg-yellow-500 text-white px-4 py-2 rounded">
                  Edit
                </button>
                <button onClick={() => cancel(b._id)} className="bg-red-500 text-white px-4 py-2 rounded">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Bookings;
