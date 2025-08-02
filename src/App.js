// App.js
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
import ProfilePage from './pages/Profile'; // Ensure this correctly points to your ProfilePage component
import FriendsPage from './pages/FriendsPage';
import RoomsPageWrapper from './pages/RoomsPageWrapper';
import ProtectedRoute from './components/ProtectedRoute';

import axios from 'axios';

import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/Admin/AdminPanel'; // Adjusted path if it's in an Admin folder

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
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ✅ Protected routes */}
        <Route path="/create-post" element={<ProtectedRoute element={<CreatePostPage />} />} />
        <Route path="/chats" element={<ProtectedRoute element={<ChatsPage />} />} />
        <Route path="/rooms" element={<ProtectedRoute element={<RoomsPageWrapper />} />} />
        
        {/*
          IMPORTANT: You have two profile routes.
          The '/profile' route likely shows the current user's profile.
          The '/users/:id' route is for viewing *other* users' profiles.
          Both should use the ProfilePage component, as it's designed to handle both cases.
        */}
        <Route path="/profile" element={<ProtectedRoute element={<ProfilePage />} />} />
        
        {/* NEW ROUTE: For viewing other users' profiles */}
        <Route path="/users/:id" element={<ProtectedRoute element={<ProfilePage />} />} /> 

        <Route path="/friends" element={<ProtectedRoute element={<FriendsPage />} />} />

        {/* Admin routes */}
        <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
        <Route path="/admin" element={<ProtectedRoute element={<AdminPanel />} requiredRole="admin" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;