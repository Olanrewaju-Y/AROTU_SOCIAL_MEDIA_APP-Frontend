import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MoreVertical, Send, Search, PlusCircle, Lock, Link as LinkIcon } from 'lucide-react';
import MobileNavbar from "../components/Navbar";
import CreateRoomModal from '../components/CreateRoomModal'; // Import the new modal

const BASE_URL = process.env.REACT_APP_BACKEND_BASE_API_URL;
const socket = io(BASE_URL, { transports: ['websocket'] });

const MessageBubble = ({ msg, userId }) => {
  // Defensive check: If msg or msg.sender is undefined/null, render as a system message.
  if (!msg || !msg.sender) {
    return (
      <div className="text-center text-xs text-gray-500 py-2 w-full">
        {/* Use optional chaining for msg.text in case msg itself is null/undefined */}
        <span>{msg?.text || "Unknown message"}</span>
      </div>
    );
  }

  const isCurrentUser = String(msg.sender?._id) === String(userId);

  return (
    <motion.div
      layout // Enables smooth layout transitions for new messages
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex items-end gap-2 max-w-[80%] ${
        isCurrentUser ? 'self-end flex-row-reverse' : 'self-start'
      }`}
    >
      {/* Avatar */}
      <img
        src={msg.sender.avatar || `https://i.pravatar.cc/150?u=${msg.sender._id}`}
        alt={msg.sender.username || 'User'} // Added fallback for username
        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
      />

      {/* Message Content */}
      <div className="flex flex-col">
        {/* Sender Name (only for messages from others) */}
        {!isCurrentUser && (
          <p className="text-xs text-gray-400 mb-1 px-1 font-semibold">
            {msg.sender.username || 'Anonymous'} {/* Added fallback for username */}
          </p>
        )}
        <div
          className={`p-3 rounded-2xl shadow-md ${
            isCurrentUser
              ? 'bg-purple-600 rounded-br-none' // Current user: purple, no bottom-right radius
              : 'bg-gray-800 rounded-bl-none' // Other user: gray, no bottom-left radius
          }`}
        >
          <p className="text-sm text-white break-words">{msg.text}</p>
          <p className={`text-xs mt-1 text-right ${isCurrentUser ? 'text-purple-200' : 'text-gray-400'}`}>
            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const RoomsPage = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?._id;

  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false); // New state for modal
  const [createRoomLoading, setCreateRoomLoading] = useState(false); // Loading state for room creation
  const [createRoomError, setCreateRoomError] = useState(null); // Error state for room creation

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Helper to get authorization headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      // In a real app, you might navigate to login or show a persistent error
      console.error("Authentication token not found.");
      return null;
    }
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      setError(null);
      try {
        const headers = getAuthHeaders();
        if (!headers) {
          setError("You are not logged in. Please log in to view rooms.");
          return;
        }
        const res = await axios.get(`${BASE_URL}/api/rooms`, { headers });
        setRooms(res.data);
      } catch (err) {
        console.error("Failed to fetch rooms:", err);
        setError(err.response?.data?.message || "Failed to fetch rooms. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, [userId]); // Depend on userId to refetch if user changes

  const handleRoomSelect = async (room) => {
    if (selectedRoom?._id !== room._id) {
      if (selectedRoom) {
        socket.emit('leave-room', selectedRoom._id); // Leave previous room
      }
      socket.emit('join-room', room._id); // Join new room
    }
    setSelectedRoom(room);
    setMessages([]); // Clear messages when changing rooms
    setLoading(true); // Set loading for messages
    setError(null);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;
      const res = await axios.get(`${BASE_URL}/api/rooms/${room._id}/messages`, {
        headers,
      });
      setMessages(res.data);
    } catch (err) {
      console.error("Failed to load messages.", err);
      setError(err.response?.data?.message || "Failed to load messages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!socket || !userId) return; // Ensure socket and userId are available

    const handleIncomingMessage = (message) => {
      // Check if the message is for the currently selected room
      if (selectedRoom && message.room === selectedRoom._id) {
        // Prevent adding duplicate messages if it's our own message that the server echoed back
        // This assumes the server sends back the message with a temporary ID or a specific flag
        // For simplicity, we'll check if the sender is not the current user, or if it's a new message
        const isDuplicate = messages.some(msg => msg._id === message._id); // Assuming _id is unique
        if (!isDuplicate) {
          setMessages((prev) => [...prev, message]);
        }
      }
    };

    socket.on('receive-room', handleIncomingMessage);

    return () => {
      socket.off('receive-room', handleIncomingMessage);
      // When component unmounts or selectedRoom changes, leave the current room
      if (selectedRoom) {
        socket.emit('leave-room', selectedRoom._id);
      }
    };
  }, [selectedRoom, userId, messages]); // Add messages to dependencies to ensure `isDuplicate` check works with latest state

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return;
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const messageToSend = {
        text: newMessage,
        sender: userId, // Send sender ID, not the whole user object
        room: selectedRoom._id,
      };

      // Emit to socket first for optimistic update
      socket.emit('room-message', messageToSend);

      // Add message to local state immediately for optimistic UI update
      setMessages((prev) => [...prev, {
        ...messageToSend,
        _id: `temp-${Math.random().toString()}`, // Temporary ID for optimistic update
        createdAt: new Date().toISOString(),
        sender: user, // Use full user object for display
      }]);
      setNewMessage(''); // Clear input immediately

      // Then send to API for persistence
      const res = await axios.post(
        `${BASE_URL}/api/rooms/${selectedRoom._id}/messages`,
        { text: newMessage }, // Only send text to API, sender/room handled by backend
        { headers }
      );
      // If the API returns the message with a real ID, update the optimistic message
      // This part might need more sophisticated handling if your backend doesn't return the exact same structure
      // For now, we'll assume the socket listener will handle the authoritative message
      console.log("Message sent to API:", res.data);

    } catch (err) {
      console.error('❌ Failed to send message:', err);
      setError(err.response?.data?.message || "Couldn't send message.");
      // Revert optimistic update if API call fails (optional, but good for UX)
      setMessages((prev) => prev.filter(msg => !msg._id.startsWith('temp-'))); // Example: remove temp messages
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle room creation
  const handleCreateRoom = async (roomData) => {
    setCreateRoomLoading(true);
    setCreateRoomError(null);
    try {
      const headers = getAuthHeaders();
      if (!headers) {
        setCreateRoomError("Authentication required to create a room.");
        return;
      }
      const res = await axios.post(`${BASE_URL}/api/rooms`, roomData, { headers });
      setRooms((prev) => [...prev, res.data]); // Add new room to the list
      setShowCreateRoomModal(false); // Close modal on success
      alert("Room created successfully!");
    } catch (err) {
      console.error("Failed to create room:", err);
      setCreateRoomError(err.response?.data?.message || "Failed to create room.");
    } finally {
      setCreateRoomLoading(false);
    }
  };


  if (!userId) {
    return <div className="text-center text-red-500 p-4">You are not logged in.</div>;
  }

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
              <div className="text-center flex-1"> {/* Added flex-1 to center content */}
                <h2 className="font-bold text-lg">{selectedRoom.name}</h2>
                {/* Display room description/privacy if available, or member count */}
                {selectedRoom.description?.trim() ? (
                    <p className="text-xs text-gray-400 truncate max-w-[200px] mx-auto">
                        {selectedRoom.description}
                    </p>
                ) : (
                    <p className="text-xs text-gray-400">
                        {selectedRoom.isPrivate ? 'Private Room' : 'Public Room'}
                    </p>
                )}
                <p className="text-xs text-gray-500">
                  {selectedRoom.memberCount || '0'} members, {selectedRoom.onlineCount || '0'} online
                </p>
              </div>
              <button className="p-2 -mr-2">
                <MoreVertical size={24} />
              </button>
            </header>

            <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[#1a1a1a]"> {/* Added background to main content */}
              {loading && <p className="text-center text-gray-400">Loading messages...</p>}
              {error && <p className="text-center text-red-500">{error}</p>}
              {!loading && messages.map((msg) => (
                <MessageBubble key={msg._id || Math.random()} msg={msg} userId={userId} />
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
            <header className="sticky top-0 z-10 p-4 bg-black/80 backdrop-blur-md border-b border-gray-800 flex justify-between items-center">
              <h1 className="text-2xl font-bold">Rooms</h1>
              <button
                onClick={() => setShowCreateRoomModal(true)}
                className="p-2 bg-purple-600 hover:bg-purple-700 rounded-full text-white shadow-lg flex items-center justify-center"
                title="Add New Room"
              >
                <PlusCircle size={24} />
              </button>
            </header>
            <div className="p-4 border-b border-gray-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="text"
                  placeholder="Search rooms..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <main className="flex-1 overflow-y-auto p-4 pb-20">
              {loading && <p className="text-center text-gray-400">Loading rooms...</p>}
              {error && <p className="text-center text-red-500">{error}</p>}
              {!loading && rooms.length === 0 && (
                <p className="text-center text-gray-400 py-10">No rooms available. Create one!</p>
              )}
              {!loading && rooms.map((room, i) => (
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
                      <p className="text-xs text-gray-500">
                        {room.isPrivate && <Lock size={12} className="inline-block mr-1" />}
                        {room.type === 'sub' && <LinkIcon size={12} className="inline-block mr-1" />}
                        {/* Placeholder for last message time, assuming your room object might have it */}
                        {new Date(room.updatedAt || room.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <p className="text-sm text-gray-400 truncate">
                      {room.description?.trim() ? room.description : 'No description, do as you like...'}
                    </p>
                  </div>
                </motion.div>
              ))}
            </main>
            <MobileNavbar />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Room Modal */}
      <CreateRoomModal
        isVisible={showCreateRoomModal}
        onClose={() => setShowCreateRoomModal(false)}
        onCreateRoom={handleCreateRoom}
        loading={createRoomLoading}
        error={createRoomError}
      />
    </div>
  );
};

export default RoomsPage;
