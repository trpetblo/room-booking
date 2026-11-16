import { useState, useEffect } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

const emptyForm = { name: '', details: '' };

// Admin: add, edit and delete rooms.
const AdminRooms = () => {
  const { user } = useAuth();
  const headers = { Authorization: `Bearer ${user.token}` };
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState(null);

  const loadRooms = async () => {
    try {
      const response = await axiosInstance.get('/api/rooms', { headers });
      setRooms(response.data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load rooms.' });
    }
  };

  useEffect(() => {
    loadRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      if (editingId) {
        await axiosInstance.put(`/api/rooms/${editingId}`, form, { headers });
        setMessage({ type: 'success', text: 'Room updated.' });
      } else {
        await axiosInstance.post('/api/rooms', form, { headers });
        setMessage({ type: 'success', text: 'Room added.' });
      }
      setForm(emptyForm);
      setEditingId(null);
      loadRooms();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save room.',
      });
    }
  };

  const startEdit = (room) => {
    setEditingId(room._id);
    setForm({ name: room.name, details: room.details || '' });
    setMessage(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleDelete = async (room) => {
    if (!window.confirm(`Delete "${room.name}" and all of its bookings?`)) return;
    try {
      await axiosInstance.delete(`/api/rooms/${room._id}`, { headers });
      setMessage({ type: 'success', text: 'Room deleted.' });
      loadRooms();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to delete room.',
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <form onSubmit={handleSubmit} className="bg-white p-6 shadow-md rounded mb-6">
        <h1 className="text-2xl font-bold mb-4">{editingId ? 'Edit Room' : 'Add a Room'}</h1>
        <input
          type="text"
          placeholder="Room name (must be unique)"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full mb-4 p-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="Details (capacity, equipment, floor)"
          value={form.details}
          onChange={(e) => setForm({ ...form, details: e.target.value })}
          className="w-full mb-4 p-2 border rounded"
        />
        <div className="flex gap-2">
          <button type="submit" className="flex-1 bg-blue-600 text-white p-2 rounded">
            {editingId ? 'Update Room' : 'Add Room'}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="bg-gray-400 text-white px-4 rounded">
              Cancel
            </button>
          )}
        </div>
        {message && (
          <p className={`mt-4 ${message.type === 'error' ? 'text-red-600' : 'text-green-700'}`}>
            {message.text}
          </p>
        )}
      </form>

      <h2 className="text-xl font-bold mb-2">Rooms</h2>
      {rooms.length === 0 && <p className="text-gray-500">No rooms yet. Add the first one above.</p>}
      {rooms.map((room) => (
        <div key={room._id} className="bg-gray-100 p-4 mb-3 rounded shadow flex justify-between items-center">
          <div>
            <h3 className="font-bold">{room.name}</h3>
            <p className="text-sm text-gray-600">{room.details}</p>
          </div>
          <div>
            <button onClick={() => startEdit(room)} className="mr-2 bg-yellow-500 text-white px-4 py-2 rounded">
              Edit
            </button>
            <button onClick={() => handleDelete(room)} className="bg-red-500 text-white px-4 py-2 rounded">
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminRooms;
