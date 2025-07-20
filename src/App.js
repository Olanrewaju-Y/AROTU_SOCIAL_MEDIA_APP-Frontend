import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import './index.css';

import HomePage from './pages/Home';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import WelcomePage from './pages/Welcome';
import CreatePostPage from './pages/CreatePost';
import ChatsPage from './pages/ChatsPage';
import ProfilePage from './pages/Profile';
import RoomsPageWrapper from './pages/RoomsPageWrapper';
import ProtectedRoute from './components/ProtectedRoute';

import axios from 'axios';

// ✅ Set default Authorization header globally if token exists
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ✅ Protected routes */}
        <Route path="/welcome" element={<ProtectedRoute element={<HomePage />} />} />
        <Route path="/create-post" element={<ProtectedRoute element={<CreatePostPage />} />} />
        <Route path="/chats" element={<ProtectedRoute element={<ChatsPage />} />} />
        <Route path="/rooms" element={<ProtectedRoute element={<RoomsPageWrapper />} />} />
        <Route path="/profile" element={<ProtectedRoute element={<ProfilePage />} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
