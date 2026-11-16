import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

const loadUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch (e) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  // Kept in localStorage so a page refresh does not log the user out.
  const [user, setUser] = useState(loadUser);

  const login = (userData) => {
    setUser(userData);
    try {
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (e) {
      /* ignore storage errors */
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('user');
    } catch (e) {
      /* ignore storage errors */
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
