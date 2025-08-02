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
  const isCurrentUser = msg?.sender?._id && String(msg.sender._id) === String(userId);

  // Handle system messages or malformed messages gracefully
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
      // Removed flex items-end/start and gap-2 as avatar is gone
      className={`flex max-w-[80%] ${
        isCurrentUser ? 'self-end justify-end' : 'self-start'
      }`}
    >
      {/* Avatar removed from here */}
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
  const [allUsers, setAllUsers] = useState([]);
  const [inConvoUsers, setInConvoUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("inConvo");
  const [searchResults, setSearchResults] = useState([]);
  const [isSending, setIsSending] = useState(false);

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

  // Fetch initial data: Users in conversation and All Users
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
        const allUsersRes = await axios.get(`${BASE_URL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const usersData = allUsersRes.data.filter(user => user._id !== currentUserId);
        setAllUsers(usersData);

        // Fetch users the current user is in conversation with
        const inConvoRes = await axios.get(`${BASE_URL}/api/messages/in-conversation`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInConvoUsers(inConvoRes.data);

      } catch (err) {
        console.error("Failed to fetch initial data:", err);
        setError('Failed to load users and conversations.');
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
        setSearchResults([]);
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
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceSearch = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceSearch);
  }, [searchQuery, currentUserId]);

  const usersToDisplay = searchQuery.trim()
    ? searchResults
    : activeTab === "inConvo"
      ? inConvoUsers
      : allUsers;

  // Handle selecting a user to chat with
  const handleUserSelect = async (user) => {
    setError(null);
    setSelectedUser(user);
    setMessages([]); // Clear messages when a new user is selected

    // Ensure the current user's socket joins their private room to receive messages
    if (currentUserId) {
      socket.emit('join-private', { userId: currentUserId });
      console.log(`Frontend: Emitting 'join-private' for ${currentUserId} to receive messages`);
    }

    try {
      const token = localStorage.getItem("token");
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


  // Socket.io for real-time message receiving for private chats
  useEffect(() => {
    if (!socket || !currentUserId) return;

    const handleIncomingPrivateMessage = (message) => {
      if (!message || !message._id || !message.sender || !message.sender._id || !message.receiver || !message.receiver._id) {
        console.warn("Frontend: Received malformed message from socket:", message);
        return;
      }

      // Check if the incoming message belongs to the currently active chat
      const isMessageForCurrentChat = selectedUser && (
        (String(message.sender._id) === String(selectedUser._id) && String(message.receiver._id) === String(currentUserId)) ||
        (String(message.sender._id) === String(currentUserId) && String(message.receiver._id) === String(selectedUser._id))
      );

      if (isMessageForCurrentChat) {
        // Prevent duplicate messages if optimistic update already added it or it's a true socket duplicate
        const isDuplicate = messages.some(
          // Match by actual _id (from server) or by temporary _id (from optimistic update)
          msg => String(msg._id) === String(message._id)
        );

        if (!isDuplicate) {
          setMessages(prev => [...prev, message]);
          scrollToBottom();
          console.log("Frontend: Added real-time private message to current chat:", message);
        } else {
          console.log("Frontend: Duplicate private message received (already in state or optimistic), not adding:", message);
        }
      } else {
        console.log("Frontend: Received private message not for current chat or irrelevant. Sender:", message.sender._id, "Receiver:", message.receiver._id, "CurrentUser:", currentUserId, "SelectedUser:", selectedUser?._id);
        // Optional: Implement a notification system for messages from other chats
      }
    };

    socket.on('receive-private-message', handleIncomingPrivateMessage);

    return () => {
      socket.off('receive-private-message', handleIncomingPrivateMessage);
    };
  }, [selectedUser, currentUserId, scrollToBottom, messages]);


  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !currentUserId || isSending) {
      if (isSending) console.warn("Frontend: Attempted to send message while one is already in progress.");
      return;
    }

    setIsSending(true);

    const token = localStorage.getItem("token");

    // Optimistic UI update: Display message immediately
    const optimisticMessage = {
      _id: `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`, // Unique temporary ID
      sender: { _id: currentUserId, username: currentUser?.username, avatar: currentUser?.avatar },
      receiver: { _id: selectedUser._id, username: selectedUser?.username, avatar: selectedUser?.avatar },
      text: newMessage,
      createdAt: new Date().toISOString(),
      status: 'sending' // Custom status for optimistic message
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage(""); // Clear input *before* API call
    scrollToBottom();

    try {
      // 1. Send message via REST API to save it to DB
      const res = await axios.post(`${BASE_URL}/api/messages/create-private`, {
        receiver: selectedUser._id,
        text: optimisticMessage.text, // Use text from optimistic message
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const savedMessage = res.data; // Backend should return the fully populated saved message

      // 2. Update optimistic message with server's confirmed message
      setMessages(prev =>
        prev.map(msg =>
          (String(msg._id) === String(optimisticMessage._id))
          ? savedMessage // Replace with the actual saved message from the backend
          : msg
        )
      );
      console.log("Frontend: Replaced optimistic message with server-saved message:", savedMessage);

      // 3. Emit a real-time event via Socket.IO for the receiver
      socket.emit('private-message', savedMessage);
      console.log("Frontend: Emitted 'private-message' to socket for real-time broadcast with full savedMessage:", savedMessage);


    } catch (err) {
      console.error("Failed to send private message:", err);
      // Revert optimistic update if sending fails
      setMessages(prev => prev.filter(msg => String(msg._id) !== String(optimisticMessage._id)));
      setError("Couldn't send message. Please try again.");
    } finally {
      setIsSending(false); // Re-enable sending regardless of success/failure
    }
  };

  const handleKeyPress = (e) => {
    // Only send on Enter, not Shift+Enter, and only if not already sending
    if (e.key === 'Enter' && !e.shiftKey && !isSending) {
      e.preventDefault(); // Prevent default form submission
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
              {/* Added avatar to header and made it clickable */}
              <button
                onClick={() => navigate(`/users/${selectedUser._id}`)} // Navigate to user profile
                className="flex items-center gap-3 p-2 rounded-full hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <img
                  src={selectedUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedUser.username}`}
                  alt={selectedUser.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="text-left">
                  <h2 className="font-bold text-lg text-white">{selectedUser.username}</h2>
                  <p className="text-xs text-gray-400">{selectedUser.status || 'Available'}</p>
                </div>
              </button>
              <button className="p-2 -mr-2 text-gray-300 hover:text-white transition-colors">
                <MoreVertical size={24} />
              </button>
            </header>

            <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
              {loading && <p className="text-center text-gray-400">Loading messages...</p>}
              {error && <p className="text-center text-red-500">{error}</p>}
              {!loading && messages.map((msg) => (
                <MessageBubble key={msg._id} msg={msg} userId={currentUserId} />
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
                  disabled={isSending}
                />
                <button
                  onClick={handleSendMessage}
                  className="p-3 bg-purple-600 hover:bg-purple-700 rounded-full text-white transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                  disabled={!newMessage.trim() || isSending}
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

              <div className="flex justify-around bg-gray-900 rounded-lg p-1 mt-4">
                <button
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'inConvo' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                  onClick={() => {
                    setActiveTab('inConvo');
                    setSearchQuery('');
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  In Convo
                </button>
                <button
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'allUsers' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                  onClick={() => {
                    setActiveTab('allUsers');
                    setSearchQuery('');
                  }}
                >
                  Everyone
                </button>
              </div>

              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search username, nickname, phone, or location..."
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
                    {searchQuery.trim() ? "Search Results" : (activeTab === 'inConvo' ? "Your Conversations" : "Everyone")}
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
                          {user.location ? `- ${user.location}` : ''}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {user.status || 'Available'}
                        </p>

                      </div>
                    </motion.div>
                  )) : (
                    <p className="text-center text-gray-500 pt-4">
                      {searchQuery.trim()
                        ? "No matching users found."
                        : (activeTab === 'inConvo' ? "You have no active conversations yet." : "No users to display.")
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