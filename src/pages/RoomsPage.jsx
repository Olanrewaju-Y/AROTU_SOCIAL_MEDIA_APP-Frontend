import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';

const BASE_URL = process.env.REACT_APP_BACKEND_BASE_API_URL;
const socket = io(BASE_URL);

const RoomsPage = ({ userId }) => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const fetchRooms = async () => {
      const res = await axios.get(`${BASE_URL}/api/rooms`);
      setRooms(res.data);
    };
    fetchRooms();
  }, []);

  const handleRoomSelect = async (room) => {
    if (selectedRoom?._id !== room._id) {
      socket.emit('join-room', room._id);
    }
    setSelectedRoom(room);
    const res = await axios.get(`${BASE_URL}/api/rooms/${room._id}/messages`);
    setMessages(res.data);
  };

 useEffect(() => {
  if (!socket || !selectedRoom?._id) return;

  const handleIncomingMessage = (message) => {
    const senderId = message.sender?._id || message.sender;

    // ⚠️ Do NOT append if it's the current user's message
    if (String(senderId) === String(userId)) return;

    if (message.room === selectedRoom._id) {
      setMessages((prev) => [...prev, message]);
    }
  };

  socket.on('receive-room', handleIncomingMessage);
  return () => socket.off('receive-room', handleIncomingMessage);
}, [selectedRoom, userId]);




  useEffect(() => {
    if (socket && selectedRoom?._id) {
      socket.emit('join-room', selectedRoom._id);
    }
  }, [selectedRoom]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return;

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_BASE_API_URL}/api/rooms/${selectedRoom._id}/messages`,
        { text: newMessage, userId }
      );

      const savedMessage = res.data;

      // ✅  emit socket message manually 
      socket.emit('room-message', {
        sender: userId,
        roomId: selectedRoom._id,
        text: newMessage,
      });

      setMessages((prev) => [...prev, savedMessage]);
      setNewMessage('');
    } catch (err) {
      console.error('❌ Failed to send message:', err);
    }
  };



  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      {/* Sidebar */}
      <div className="w-1/4 bg-gray-900 p-4 overflow-y-auto border-r border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Rooms</h2>
          <button onClick={() => setShowSettings(!showSettings)} className="text-gray-400 hover:text-white">
            <Settings size={20} />
          </button>
        </div>

        {rooms.map((room) => (
          <div
            key={room._id}
            onClick={() => handleRoomSelect(room)}
            className={`p-3 mb-2 rounded cursor-pointer transition-colors duration-200 ${
              selectedRoom?._id === room._id ? 'bg-blue-600' : 'bg-gray-800'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className={room.parent ? 'ml-4 text-sm' : ''}>{room.name}</span>
              {room.parent && <span className="text-xs text-gray-400">Subroom</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Chat Area */}
      <div className="flex flex-col flex-1">
        <div className="flex-1 overflow-y-auto p-4">
          {selectedRoom ? (
            <>
              <h2 className="text-2xl font-semibold mb-4">{selectedRoom.name}</h2>
              <div className="space-y-3">
                {messages.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`p-3 rounded max-w-lg ${
                      msg.sender?._id === userId ? 'bg-blue-500 self-end text-right ml-auto' : 'bg-gray-800'
                    }`}
                  >
                    <p className="text-sm font-semibold mb-1">
                      {msg.sender?.username || 'Unknown'}
                      <span className="text-xs ml-2 text-gray-300">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                    </p>
                    <p>{msg.text}</p>
                  </motion.div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-400">Select a room to start chatting</p>
          )}
        </div>

        {/* Message Input */}
        {selectedRoom && (
          <div className="p-4 border-t border-gray-800 flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 rounded bg-gray-900 text-white border border-gray-700 focus:outline-none"
            />
            <button
              onClick={handleSendMessage}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
            >
              Send
            </button>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute top-4 right-4 bg-gray-900 border border-gray-700 p-4 rounded shadow-xl z-50">
          <h3 className="text-lg font-bold mb-2">User Settings</h3>
          <p className="text-sm text-gray-300">User ID: {userId}</p>
          <button
            onClick={() => setShowSettings(false)}
            className="mt-3 px-4 py-1 rounded bg-gray-700 hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default RoomsPage;
