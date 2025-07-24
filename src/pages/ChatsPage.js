import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MoreVertical, Send, Search } from 'lucide-react';
import MobileNavbar from "../components/Navbar";
import { io } from 'socket.io-client';

const BASE_URL = process.env.REACT_APP_BACKEND_BASE_API_URL;

// Ensure socket is only initialized once (to avoid duplication in dev/hot reload)
const socket = io(BASE_URL, { transports: ['websocket'], autoConnect: true });

const MessageBubble = ({ msg, userId }) => {
  const isCurrentUser = msg?.sender?._id && String(msg.sender._id) === String(userId);

  if (!msg.sender) {
    return (
      <div className="text-center text-xs text-gray-500 py-2">
        <span>{msg.text}</span>
      </div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-end gap-2 max-w-[80%] ${
        isCurrentUser ? 'self-end flex-row-reverse' : 'self-start'
      }`}
    >
      <img
        src={msg.sender.avatar || `https://i.pravatar.cc/150?u=${msg.sender._id}`}
        alt={msg.sender.username}
        className="w-8 h-8 rounded-full object-cover"
      />
      <div
        className={`p-3 rounded-2xl ${
          isCurrentUser ? 'bg-purple-600 rounded-br-none' : 'bg-gray-800 rounded-bl-none'
        }`}
      >
        <p className="text-sm">{msg.text}</p>
        <p className={`text-xs mt-1 ${isCurrentUser ? 'text-purple-200' : 'text-gray-400'}`}>
          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
};

function ChatsPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const currentUserId = currentUser?._id;

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');

      try {
        const res = await axios.get(`${BASE_URL}/api/users/friends`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setConversations(res.data);
      } catch (err) {
        setError('Failed to fetch conversations.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [navigate]);

  const handleUserSelect = async (user) => {
    setSelectedUser(user);
    setMessages([]);
    const token = localStorage.getItem("token");

    try {
      const res = await axios.get(`${BASE_URL}/api/messages/private/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);
    } catch (err) {
      console.error("Failed to fetch private messages:", err);
      setError("Failed to load messages for this user.");
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem('user'));

    const optimisticMessage = {
      _id: Date.now(),
      sender: { _id: currentUserId, ...user },
      receiver: selectedUser._id,
      text: newMessage,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage("");

    try {
      const res = await axios.post(`${BASE_URL}/api/messages/private`, {
        receiver: selectedUser._id,
        text: newMessage,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const savedMessage = res.data;
      setMessages(prev =>
        prev.map(msg => (msg._id === optimisticMessage._id ? savedMessage : msg))
      );
      socket.emit('private-message', savedMessage);
    } catch (err) {
      console.error("Failed to send private message:", err);
      setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id));
      setError("Couldn't send message.");
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleIncomingMessage = (message) => {
      if (selectedUser &&
        (message.sender._id === selectedUser._id || message.receiver === selectedUser._id)) {
        setMessages(prev => [...prev, message]);
      }
    };

    socket.on('receive-private-message', handleIncomingMessage);
    return () => socket.off('receive-private-message', handleIncomingMessage);
  }, [selectedUser]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const fetchUsers = async () => {
        const token = localStorage.getItem("token");
        try {
          const res = await axios.get(
            `${BASE_URL}/api/users/search?query=${encodeURIComponent(searchQuery)}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setSearchResults(res.data.filter(u => u._id !== currentUserId));
        } catch (err) {
          console.error("Search error:", err);
        }
      };
      const debounce = setTimeout(fetchUsers, 300);
      return () => clearTimeout(debounce);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, currentUserId]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-black text-gray-100 font-sans h-screen flex flex-col">
      <AnimatePresence mode="wait">
        {selectedUser ? (
          <motion.div
            key="chat-view"
            className="flex flex-col h-full"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <header className="sticky top-0 z-10 flex items-center justify-between p-4 bg-black/80 backdrop-blur-md border-b border-gray-800">
              <button onClick={() => setSelectedUser(null)} className="p-2 -ml-2">
                <ArrowLeft size={24} />
              </button>
              <div className="text-center">
                <h2 className="font-bold text-lg">{selectedUser.username}</h2>
                <p className="text-xs text-gray-400">{selectedUser.status || 'Available'}</p>
              </div>
              <button className="p-2 -mr-2">
                <MoreVertical size={24} />
              </button>
            </header>

            <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {loading && <p className="text-center text-gray-400">Loading messages...</p>}
              {error && <p className="text-center text-red-500">{error}</p>}
              {!loading && messages.map((msg) => (
                <MessageBubble key={msg._id || Math.random()} msg={msg} userId={currentUserId} />
              ))}
              <div ref={messagesEndRef} />
            </main>

            <footer className="p-4 bg-black border-t border-gray-800">
              <div className="flex items-center gap-2 bg-gray-900 rounded-full p-1">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 bg-transparent text-white focus:outline-none"
                />
                <button
                  onClick={handleSendMessage}
                  className="p-3 bg-purple-600 hover:bg-purple-700 rounded-full text-white transition-colors disabled:bg-gray-600"
                  disabled={!newMessage.trim()}
                >
                  <Send size={20} />
                </button>
              </div>
            </footer>
          </motion.div>
        ) : (
          <motion.div
            key="list-view"
            className="flex flex-col h-full"
            initial={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <header className="sticky top-0 z-10 p-4 bg-black/80 backdrop-blur-md border-b border-gray-800">
              <h1 className="text-2xl font-bold text-center">Chats</h1>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users to chat..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 pb-20">
              {loading && <p className="text-center text-gray-400">Loading conversations...</p>}
              {error && <p className="text-center text-red-500">{error}</p>}

              {!loading && !error && (
                searchQuery.trim() ? (
                  <div className="mb-4">
                    <h2 className="text-sm font-semibold text-gray-400 px-3 mb-2">Search Results</h2>
                    {searchResults.length > 0 ? searchResults.map((user, i) => (
                      <motion.div
                        key={user._id}
                        onClick={() => handleUserSelect(user)}
                        className="flex items-center gap-4 p-3 mb-2 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-gray-800"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                      >
                        <img src={user.avatar || `https://i.pravatar.cc/150?u=${user._id}`} alt={user.username} className="w-12 h-12 rounded-full object-cover" />
                        <div className="flex-1">
                          <p className="font-semibold">{user.username}</p>
                          <p className="text-xs text-gray-400 truncate">{user.status || 'Available'}</p>
                        </div>
                      </motion.div>
                    )) : <p className="text-center text-gray-500 pt-4">No users found.</p>}
                  </div>
                ) : (
                  conversations.map((user, i) => (
                    <motion.div
                      key={user._id}
                      onClick={() => handleUserSelect(user)}
                      className="flex items-center gap-4 p-3 mb-2 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-gray-800"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                    >
                      <img src={user.avatar || `https://i.pravatar.cc/150?u=${user._id}`} alt={user.username} className="w-12 h-12 rounded-full object-cover" />
                      <div className="flex-1">
                        <p className="font-semibold">{user.username}</p>
                        <p className="text-xs text-gray-400 truncate">{user.status || 'Available'}</p>
                      </div>
                    </motion.div>
                  ))
                )
              )}
            </main>
            <MobileNavbar />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ChatsPage;
