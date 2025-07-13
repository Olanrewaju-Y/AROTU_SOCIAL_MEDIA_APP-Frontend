import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import HomePage from './pages/Home';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import WelcomePage from './pages/Welcome';
import CreatePostPage from './pages/CreatePost';
import ChatsPage from './pages/ChatsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/create-post" element={<CreatePostPage />} />
        <Route path="/chats" element={<ChatsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;