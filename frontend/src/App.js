import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import BookRoom from './pages/BookRoom';
import Bookings from './pages/Bookings';
import AdminRooms from './pages/AdminRooms';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/book" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/book" element={<ProtectedRoute><BookRoom /></ProtectedRoute>} />
        <Route path="/my-bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
        <Route path="/admin/rooms" element={<ProtectedRoute adminOnly><AdminRooms /></ProtectedRoute>} />
        <Route path="/admin/bookings" element={<ProtectedRoute adminOnly><Bookings all /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
