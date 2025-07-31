import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MoreVertical, Send, Search } from 'lucide-react';
import MobileNavbar from "../components/Navbar";
import { io } from 'socket.io-client';

const BASE_URL = process.env.REACT_APP_BACKEND_BASE_API_URL;

// Ensure socket is only initialized once
const socket = io(BASE_URL, { transports: ['websocket'], autoConnect: true });

const MessageBubble = ({ msg, userId }) => {
  // Ensure msg.sender exists before trying to access its properties
  const isCurrentUser = msg?.sender?._id && String(msg.sender._id) === String(userId);

  if (!msg.sender) {
    // This case might happen for system messages or if sender population failed
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
        // Ensure msg.sender.username exists for the dicebear fallback
        src={msg.sender.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${msg.sender.username || 'unknown'}`}
        alt={msg.sender.username || 'User'}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
      />
      <div
        className={`p-3 rounded-2xl ${
          isCurrentUser ? 'bg-purple-600 rounded-br-none' : 'bg-gray-800 rounded-bl-none'
        }`}
      >
        <p className="text-sm text-white">{msg.text}</p>
        <p className={`text-xs mt-1 ${isCurrentUser ? 'text-purple-200' : 'text-gray-400'}`}>
          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
};

function ChatsPage() {
  const [allUsers, setAllUsers] = useState([]); // All searchable users (excluding current user)
  const [friends, setFriends] = useState([]); // Users explicitly marked as friends
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("allUsers"); // Changed default to 'allUsers' to match the simpler display
  const [searchResults, setSearchResults] = useState([]);

  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const currentUserId = currentUser?._id;

  // Emit 'addUser' event to Socket.IO server when component mounts and user is known
  useEffect(() => {
    if (currentUserId && socket.connected) {
      socket.emit('addUser', currentUserId);
      console.log(`Frontend: Emitting 'addUser' for ${currentUserId}`);
    }

    // Optional: Re-emit if socket reconnects
    const handleReconnect = () => {
      if (currentUserId) {
        socket.emit('addUser', currentUserId);
        console.log(`Frontend: Socket reconnected, re-emitting 'addUser' for ${currentUserId}`);
      }
    };
    socket.on('reconnect', handleReconnect);

    return () => {
      socket.off('reconnect', handleReconnect);
    };
  }, [currentUserId, socket.connected]);


  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Fetch initial data: Friends and All Users
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        // Fetch all users for search capability
        const allUsersRes = await axios.get(`${BASE_URL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const usersData = allUsersRes.data.filter(user => user._id !== currentUserId);
        setAllUsers(usersData);

        // Fetch friends
        const friendsRes = await axios.get(`${BASE_URL}/api/users/friends`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFriends(friendsRes.data);

      } catch (err) {
        console.error("Failed to fetch initial data:", err);
        setError('Failed to load users and friends.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [navigate, currentUserId]);

  // Handle searching for users
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]); // Clear search results if query is empty
        return;
      }

      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      try {
        const res = await axios.get(
          `${BASE_URL}/api/users/search?q=${encodeURIComponent(searchQuery)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSearchResults(res.data.filter(u => u._id !== currentUserId));
      } catch (err) {
        console.error("Search error:", err);
        setError("Failed to search users.");
        setSearchResults([]); // Clear results on error
      } finally {
        setLoading(false);
      }
    };

    const debounceSearch = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceSearch);
  }, [searchQuery, currentUserId]);

  // Determine which list of users to display based on activeTab and searchQuery
  // This now directly uses allUsers or friends based on the active tab, without recent conversations sorting.
  const usersToDisplay = searchQuery.trim()
    ? searchResults // If there's a search query, always show search results
    : activeTab === "friends"
      ? friends // If no search query and 'friends' tab is active, show friends
      : allUsers; // If no search query and 'allUsers' tab is active, show all users


  // Handle selecting a user to chat with
  const handleUserSelect = async (user) => {
    // If selecting the same user, just scroll to bottom and potentially re-join socket room
    if (selectedUser && selectedUser._id === user._id) {
        // We can re-emit 'join-private' here to ensure the socket is in the user's room
        // This is a safety net in case of socket re-connections or tab changes without a full reload.
        socket.emit('join-private', { userId: currentUserId });
        scrollToBottom();
        return;
    }

    setSelectedUser(user);
    setMessages([]);
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");

    // Join the private room specific to the current user's ID
    // This allows the server to target this specific client for private messages
    socket.emit('join-private', { userId: currentUserId });

    try {
      const res = await axios.get(`${BASE_URL}/api/messages/private/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);
    } catch (err) {
      console.error("Failed to fetch private messages:", err);
      setError("Failed to load messages for this user.");
    } finally {
      setLoading(false);
    }
  };

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;
    const token = localStorage.getItem("token");

    // Optimistic UI update: Display message immediately
    const optimisticMessage = {
      _id: Date.now(), // Temporary ID
      sender: { _id: currentUserId, username: currentUser?.username, avatar: currentUser?.avatar },
      receiver: selectedUser._id, // This is just the ID for optimistic; backend will populate
      text: newMessage,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage("");
    scrollToBottom();

    try {
      const res = await axios.post(`${BASE_URL}/api/messages/private`, {
        receiver: selectedUser._id,
        text: newMessage,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const savedMessage = res.data; // This 'savedMessage' should now include populated sender/receiver from backend
      setMessages(prev =>
        prev.map(msg => (msg._id === optimisticMessage._id ? savedMessage : msg))
      );

      // Emit the message details required by the backend socket handler
      // The backend will handle populating the sender/receiver for broadcast
      socket.emit('private-message', {
        senderId: currentUserId,
        receiverId: selectedUser._id,
        text: savedMessage.text // Send the actual saved text
      });

    } catch (err) {
      console.error("Failed to send private message:", err);
      // Revert optimistic update if sending fails
      setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id));
      setError("Couldn't send message. Please try again.");
    }
  };

  // Socket.io for real-time message receiving
  useEffect(() => {
    if (!socket) return;

    const handleIncomingMessage = (message) => {
      // Check if the message is relevant to the currently selected chat
      // It's relevant if:
      // 1. You are the selected user's receiver (message.receiver._id === currentUserId) and it's from selectedUser (message.sender._id === selectedUser._id)
      // 2. You are the sender (message.sender._id === currentUserId) and it's to the selectedUser (message.receiver._id === selectedUser._id)
      // This is crucial to avoid showing messages for other conversations.
      if (selectedUser &&
          (
            (String(message.sender._id) === String(selectedUser._id) && String(message.receiver._id) === String(currentUserId)) ||
            (String(message.sender._id) === String(currentUserId) && String(message.receiver._id) === String(selectedUser._id))
          )
      ) {
        // Prevent duplicate messages if optimistic update already added it
        const isOptimisticDuplicate = messages.some(
            msg => msg._id === message._id || // Check for exact _id (if backend returns temp ID)
                   (msg.text === message.text &&
                    msg.sender._id === message.sender._id &&
                    new Date(msg.createdAt).getTime() === new Date(message.createdAt).getTime())
        );

        if (!isOptimisticDuplicate) {
            setMessages(prev => [...prev, message]);
            scrollToBottom();
        }
      }
    };

    socket.on('receive-private-message', handleIncomingMessage);

    return () => {
        socket.off('receive-private-message', handleIncomingMessage);
    };
  }, [selectedUser, currentUserId, scrollToBottom, messages]); // `messages` dependency is important for `isOptimisticDuplicate`

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
          // Chat View (when a user is selected)
          <motion.div
            key="chat-view"
            className="flex flex-col h-full"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <header className="sticky top-0 z-10 flex items-center justify-between p-4 bg-black/80 backdrop-blur-md border-b border-gray-800">
              <button onClick={() => setSelectedUser(null)} className="p-2 -ml-2 text-gray-300 hover:text-white transition-colors">
                <ArrowLeft size={24} />
              </button>
              <div className="text-center">
                <h2 className="font-bold text-lg text-white">{selectedUser.username}</h2>
                <p className="text-xs text-gray-400">{selectedUser.status || 'Available'}</p>
              </div>
              <button className="p-2 -mr-2 text-gray-300 hover:text-white transition-colors">
                <MoreVertical size={24} />
              </button>
            </header>

            <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
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
                  className="flex-1 px-4 py-2 bg-transparent text-white placeholder-gray-500 focus:outline-none"
                  aria-label="Type your message"
                />
                <button
                  onClick={handleSendMessage}
                  className="p-3 bg-purple-600 hover:bg-purple-700 rounded-full text-white transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                  disabled={!newMessage.trim()}
                  aria-label="Send message"
                >
                  <Send size={20} />
                </button>
              </div>
            </footer>
          </motion.div>
        ) : (
          // User List View
          <motion.div
            key="list-view"
            className="flex flex-col h-full"
            initial={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <header className="sticky top-0 z-10 p-4 bg-black/80 backdrop-blur-md border-b border-gray-800">
              <h1 className="text-2xl font-bold text-center text-white">Chats</h1>

              {/* Tabs for Friends / All Users */}
              <div className="flex justify-around bg-gray-900 rounded-lg p-1 mt-4">
                <button
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'friends' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                  onClick={() => {
                    setActiveTab('friends');
                    setSearchQuery(''); // Clear search when switching tabs
                  }}
                >
                  Friends
                </button>
                <button
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'allUsers' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                  onClick={() => {
                    setActiveTab('allUsers');
                    setSearchQuery(''); // Clear search when switching tabs
                  }}
                >
                  All Users
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by username, nickname, phone, or location..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-full py-2 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  aria-label="Search users"
                />
              </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 pb-20 custom-scrollbar">
              {loading && <p className="text-center text-gray-400">Loading users...</p>}
              {error && <p className="text-center text-red-500">{error}</p>}

              {!loading && !error && (
                <>
                  <h2 className="text-sm font-semibold text-gray-400 px-3 mb-2">
                    {searchQuery.trim() ? "Search Results" : (activeTab === 'friends' ? "Your Friends" : "All Available Users")}
                  </h2>
                  {usersToDisplay.length > 0 ? usersToDisplay.map((user, i) => (
                    <motion.div
                      key={user._id}
                      onClick={() => handleUserSelect(user)}
                      className="flex items-center gap-4 p-3 mb-2 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-gray-800"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                    >
                      <img
                        src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`}
                        alt={user.username}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-white">{user.username}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {user.roomNickname && `Nickname: ${user.roomNickname}`}
                          {user.phone && (user.roomNickname ? " | " : "") + `Phone: ${user.phone}`}
                          {user.location && ((user.roomNickname || user.phone) ? " | " : "") + `Location: ${user.location}`}
                          {!user.roomNickname && !user.phone && !user.location && (user.status || 'Available')}
                        </p>
                      </div>
                    </motion.div>
                  )) : (
                    <p className="text-center text-gray-500 pt-4">
                      {searchQuery.trim()
                        ? "No matching users found."
                        : (activeTab === 'friends' ? "You have no friends yet." : "No users to display.")
                      }
                    </p>
                  )}
                </>
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