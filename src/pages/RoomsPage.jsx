import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MoreVertical, Send, PlusCircle, Link as LinkIcon } from 'lucide-react';
import MobileNavbar from "../components/Navbar";
import CreateRoomModal from '../components/CreateRoomModal'; // Import the new modal


const BASE_URL = process.env.REACT_APP_BACKEND_BASE_API_URL;
const socket = io(BASE_URL, { transports: ['websocket'] });


const MessageBubble = ({ msg, userId, currentUser }) => {
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
  
  // Determine the display name. For the current user, use the full user object from local storage.
  // For other users, use what's available in the message sender object.
  const displayName = isCurrentUser
    ? currentUser?.roomNickname || currentUser?.username || 'You'
    : msg.sender?.roomNickname || msg.sender?.username || 'Anonymous';

    console.log(`Message from ${displayName}: ${msg.sender?.avatar}`); // Debugging log

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
        // src={msg.sender?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender.avatar || 'Guest')}&background=random&color=fff`}
         src={msg.user?.avatar || `https://i.pravatar.cc/150?u=${msg.sender?._id}`}        

        alt={displayName}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
      />

      {/* Message Content */}
      <div className="flex flex-col">        
        <div
          className={`p-3 rounded-2xl shadow-md ${
            isCurrentUser
              ? 'bg-purple-600 rounded-br-none' // Current user: purple, no bottom-right radius
              : 'bg-gray-800 rounded-bl-none' // Other user: gray, no bottom-left radius
          }`}
        >
          {/* Sender Name: Prioritize roomNickname, fallback to username */}
        <p className={`text-xs text-gray-400 mb-1 px-1 font-bold ${isCurrentUser ? 'text-right' : 'text-left'}`}>
          {displayName}
        </p>
          <p className="text-sm text-white break-words">{msg.text}</p>
          <p className={`text-xs mt-1 text-right ${isCurrentUser ? 'text-purple-200' : 'text-gray-400'}`}>
            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
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
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false); // New state for modal 
   const [createRoomLoading, setCreateRoomLoading] = useState(false); // Loading state for room creation
   const [currentUser, setCurrentUser] = useState(null);
   const [createRoomError, setCreateRoomError] = useState(null); // Error state for room creation
 
   const messagesEndRef = useRef(null);
 
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    try {
      const userString = localStorage.getItem('user');
      if (userString) {
        setCurrentUser(JSON.parse(userString));
      }
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
    }
  }, []);

  /**
   * @returns {object|null} The authorization headers object or null if token is not found.
   */
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return null;
  };

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

      // Emit the complete message object from the POST response.
      // This ensures that receivers get the same data structure,
      // including the sender's populated roomNickname.
      // A small backend change is needed to handle this.
      socket.emit('room-message', savedMessage);
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


   // Handle room creation
    const handleCreateRoom = async (roomData) => {
      setCreateRoomLoading(true);
      setCreateRoomError(null);
      try {
        const headers = getAuthHeaders();
        if (!headers) {
          setCreateRoomError("Authentication required to create a room.");
          setCreateRoomLoading(false);
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
              <div className="text-center">
                <h2 className="font-bold text-lg">{selectedRoom.name}</h2>
                <p className="text-sm text-gray-400">
                  {selectedRoom.description || 'No description available'}
                </p>
                <p className="text-sm text-gray-400">
                    {selectedRoom.isPrivate ? ' (Private)' : ' (Public)'}
                  </p>
                {/* {selectedRoom.isPrivate && (
                  <div className="flex items-center gap-2 mt-1">
                    <LinkIcon size={16} />
                    <span className="text-xs text-gray-500">
                      {selectedRoom.inviteLink || 'No invite link available'}
                    </span>
                  </div>
                )} */}

              </div>
              <button className="p-2 -mr-2">
                <MoreVertical size={24} />
              </button>
            </header>

            <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {loading && <p className="text-center text-gray-400">Loading messages...</p>}
              {error && <p className="text-center text-red-500">{error}</p>}
              {!loading && messages.map((msg) => (
                <MessageBubble key={msg._id || Math.random()} msg={msg} userId={userId} currentUser={currentUser} /> // Added fallback key
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
              <p className="text-sm text-gray-400 text-center">
                {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'}
              </p>
              <p className="text-sm text-gray-400 text-center">
                Click to join and chat or create a new room.
              </p>

              <button onClick={() => setShowCreateRoomModal(true)}
                className="p-2 bg-purple-600 hover:bg-purple-700 rounded-full text-white shadow-lg absolute right-4 top-4"
                title="Add New Room" >
                <PlusCircle size={24} />
              </button>

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
                  </div>
                    <p className="text-sm text-gray-400">{room.description || 'No description available'}</p>
                    
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