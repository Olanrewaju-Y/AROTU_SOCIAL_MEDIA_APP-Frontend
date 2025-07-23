import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MoreVertical, Send, Search } from 'lucide-react';
import MobileNavbar from "../components/Navbar";

const BASE_URL = process.env.REACT_APP_BACKEND_BASE_API_URL;
const socket = io(BASE_URL, { transports: ['websocket'] });

const MessageBubble = ({ msg, userId }) => {
  const isCurrentUser = String(msg.sender?._id) === String(userId);

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
        // Ensure msg.sender.avatar is available. If not, use a fallback
        src={msg.sender.avatar || `https://i.pravatar.cc/150?u=${msg.sender._id}`}
        alt={msg.sender.username}
        className="w-8 h-8 rounded-full object-cover"
      />
      <div
        className={`p-3 rounded-2xl ${
          isCurrentUser
            ? 'bg-purple-600 rounded-br-none'
            : 'bg-gray-800 rounded-bl-none'
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

const RoomsPage = ({ userId }) => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BASE_URL}/api/rooms`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRooms(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch rooms. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  // Updated handleRoomSelect
  const handleRoomSelect = async (room) => {
    if (selectedRoom?._id !== room._id) {
      socket.emit('join-room', room._id);
    }
    setSelectedRoom(room);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${BASE_URL}/api/rooms/${room._id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);
    } catch (err) {
      console.error("Failed to load messages.", err);
      setError("Failed to load messages.");
    }
  };

  // Updated incoming message listener
  useEffect(() => {
    if (!socket || !selectedRoom?._id) return;

    const handleIncomingMessage = (message) => {
      const senderId = message.sender?._id || message.sender;
      // Do not append if it's the current user's message
      if (String(senderId) === String(userId)) return;
      if (message.room === selectedRoom._id) {
        setMessages((prev) => [...prev, message]);
      }
    };

    socket.on('receive-room', handleIncomingMessage);
    return () => socket.off('receive-room', handleIncomingMessage);
  }, [selectedRoom, userId]);

  // (Optionally) remove any duplicate join-room useEffect if present
  // useEffect(() => {
  //   if (!socket || !selectedRoom?._id) return;
  //   socket.emit('join-room', selectedRoom._id);
  //   return () => {};
  // }, [selectedRoom]);


  // Updated handleSendMessage
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${BASE_URL}/api/rooms/${selectedRoom._id}/messages`,
        { text: newMessage, userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const savedMessage = res.data;

      // Manually emit the socket message
      socket.emit('room-message', {
        sender: userId,
        roomId: selectedRoom._id,
        text: newMessage,
      });

      setMessages((prev) => [...prev, savedMessage]);
      setNewMessage('');
    } catch (err) {
      console.error('❌ Failed to send message:', err);
      setError("Couldn't send message.");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-black text-gray-100 font-sans h-screen flex flex-col">
      <AnimatePresence>
        {selectedRoom ? (
          <motion.div
            key="chat-view"
            className="flex flex-col h-full"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <header className="sticky top-0 z-10 flex items-center justify-between p-4 bg-black/80 backdrop-blur-md border-b border-gray-800">
              <button onClick={() => setSelectedRoom(null)} className="p-2 -ml-2">
                <ArrowLeft size={24} />
              </button>
              <div className="text-center">
                <h2 className="font-bold text-lg">{selectedRoom.name}</h2>
                <p className="text-xs text-gray-400">24 members, 7 online</p> {/* This data needs to come from backend */}
              </div>
              <button className="p-2 -mr-2">
                <MoreVertical size={24} />
              </button>
            </header>

            <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {loading && <p className="text-center text-gray-400">Loading messages...</p>}
              {error && <p className="text-center text-red-500">{error}</p>}
              {!loading && messages.map((msg) => (
                <MessageBubble key={msg._id || Math.random()} msg={msg} userId={userId} /> // Added fallback key
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
              <h1 className="text-2xl font-bold text-center">Rooms</h1>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="text"
                  placeholder="Search rooms..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 pb-20">
              {loading && <p className="text-center text-gray-400">Loading rooms...</p>}
              {error && <p className="text-center text-red-500">{error}</p>}
              {rooms.map((room, i) => (
                <motion.div
                  key={room._id}
                  onClick={() => handleRoomSelect(room)}
                  className="flex items-center gap-4 p-3 mb-2 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-gray-800"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <img
                    src={room.avatar || `https://i.pravatar.cc/150?u=${room._id}`}
                    alt={room.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-semibold">{room.name}</h3>
                      <p className="text-xs text-gray-500">3:45 PM</p> {/* This timestamp is static, should come from room.lastMessage.createdAt */}
                    </div>
                    <p className="text-sm text-gray-400 truncate">
                      {room.lastMessage?.text || 'No messages yet...'} {/* Access lastMessage.text */}
                    </p>
                  </div>
                </motion.div>
              ))}
            </main>
            <MobileNavbar />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoomsPage;