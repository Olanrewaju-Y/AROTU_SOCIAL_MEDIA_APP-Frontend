import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MoreVertical, Send, PlusCircle, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileNavbar from "../components/Navbar";
import EditRoomModal from '../components/EditRoomModal';
import CreateRoomModal from '../components/CreateRoomModal';
import RoomManagementModal from '../components/RoomManagementModal';


const BASE_URL = process.env.REACT_APP_BACKEND_BASE_API_URL;
const socket = io(BASE_URL, { transports: ['websocket'], autoConnect: true });


const MessageBubble = ({ msg, userId, currentUser, onUserClick }) => {
  if (!msg || !msg.sender) {
    return (
      <div className="text-center text-xs text-gray-500 py-2 w-full">
        <span>{msg?.text || "Unknown message"}</span>
      </div>
    );
  }
  const isCurrentUser = String(msg.sender?._id) === String(userId);

  const displayName = isCurrentUser
    ? currentUser?.roomNickname || currentUser?.username || 'You'
    : msg.sender?.roomNickname || msg.sender?.username || 'Anonymous';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex items-end gap-2 max-w-[80%] ${
        isCurrentUser ? 'self-end flex-row-reverse' : 'self-start'
      }`}
    >
      {/* Avatar and Name are now clickable */}
      <div
        className="flex flex-col items-center cursor-pointer"
        onClick={() => onUserClick(msg.sender._id)}
      >
        <img
          src={msg.sender?.avatar || `https://i.pravatar.cc/150?u=${msg.sender?._id}`}
          alt={displayName}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        />
        <p className={`text-xs text-gray-400 mt-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
          {displayName}
        </p>
      </div>

      {/* Message Content */}
      <div className="flex flex-col">
        <div
          className={`p-3 rounded-2xl shadow-md ${
            isCurrentUser
              ? 'bg-purple-600 rounded-br-none'
              : 'bg-gray-800 rounded-bl-none'
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


const RoomsPage = ({ userId }) => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [createRoomLoading, setCreateRoomLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [createRoomError, setCreateRoomError] = useState(null);
  const [roomToEdit, setRoomToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRoomManagementModal, setShowRoomManagementModal] = useState(false);
  const [roomToManage, setRoomToManage] = useState(null);
  const [searchedUsersForAdd, setSearchedUsersForAdd] = useState([]);
  const [roomAccessError, setRoomAccessError] = useState(null);

  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

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

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return null;
  };

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

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleRoomSelect = async (room) => {
    setRoomAccessError(null); // Clear any previous access errors

    if (selectedRoom?._id !== room._id) {
      socket.emit('join-room', room._id);
    }
    setSelectedRoom(room); // Set selected room immediately for UI responsiveness
    setMessages([]); // Clear messages while loading new ones

    try {
      const token = localStorage.getItem("token");
      
      // Always fetch the full room details to ensure `members` and `admins` are populated
      const roomDetailsRes = await axios.get(`${BASE_URL}/api/rooms/${room._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const roomDetails = roomDetailsRes.data; // Use the fully populated room object

      // Now, perform the client-side access check with the full details
      if (roomDetails.isPrivate) {
        const isMember = roomDetails.members?.some(member => String(member._id) === String(userId));
        const isAdmin = roomDetails.admins?.some(adminId => String(adminId) === String(userId));
        const isCreator = String(roomDetails.creator) === String(userId);

        if (!isMember && !isAdmin && !isCreator) {
          setSelectedRoom(null);
          setRoomAccessError("You do not have access to this private room.");
          return; // Stop further execution
        }
      }

      // Proceed to fetch messages
      const messagesRes = await axios.get(`${BASE_URL}/api/rooms/${roomDetails._id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(messagesRes.data);

      // Finally, update the selected room state with the complete details
      setSelectedRoom(roomDetails);

    } catch (err) {
      console.error("Failed to load messages or room details.", err);
      // If the backend still returns 403, it means the user is genuinely unauthorized.
      setRoomAccessError(err.response?.status === 403 ? "You do not have permission to access this room." : "Failed to load room. Please try again.");
      setSelectedRoom(null); // Deselect the room if loading fails
    }
  };

  useEffect(() => {
    if (!socket || !selectedRoom?._id) return;

    const handleIncomingMessage = (message) => {
      const senderId = message.sender?._id || message.sender;
      if (String(senderId) === String(userId)) return;
      if (message.room === selectedRoom._id) {
        setMessages((prev) => [...prev, message]);
      }
    };

    socket.on('receive-room', handleIncomingMessage);
    return () => socket.off('receive-room', handleIncomingMessage);
  }, [selectedRoom, userId]);

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
      setRooms((prev) => [...prev, res.data]);
      setShowCreateRoomModal(false);
      alert("Room created successfully!");
    } catch (err) {
      console.error("Failed to create room:", err);
      setCreateRoomError(err.response?.data?.message || "Failed to create room.");
    } finally {
      setCreateRoomLoading(false);
    }
  };

  const handleUpdateRoom = async (roomId, roomData) => {
    setCreateRoomLoading(true);
    setCreateRoomError(null);
    try {
      const headers = getAuthHeaders();

      const updatedRoomData = { ...roomData };
      if (updatedRoomData.isPrivate) {
        updatedRoomData.type = 'main';
        updatedRoomData.parentRoom = '';
      }

      const res = await axios.put(`${BASE_URL}/api/rooms/${roomId}`, updatedRoomData, { headers });
      setRooms(prev => prev.map(r => (r._id === roomId ? res.data : r)));
      if (selectedRoom?._id === roomId) {
        setSelectedRoom(res.data);
      }
      setRoomToEdit(null);
      setShowRoomManagementModal(false);
    } catch (err) {
      console.error("Failed to update room:", err);
      setCreateRoomError(err.response?.data?.message || "Failed to update room.");
    } finally {
      setCreateRoomLoading(false);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm("Are you sure you want to delete this room and all its messages? This cannot be undone.")) {
      return;
    }
    try {
      const headers = getAuthHeaders();
      await axios.delete(`${BASE_URL}/api/rooms/${roomId}`, { headers });
      setRooms(prev => prev.filter(r => r._id !== roomId && r.parentRoom !== roomId));
      setRoomToEdit(null);
      setShowRoomManagementModal(false);
      if (selectedRoom?._id === roomId) {
        setSelectedRoom(null);
      }
      alert("Room deleted successfully.");
    } catch (err) {
      console.error("Failed to delete room:", err);
      alert(err.response?.data?.message || "Failed to delete room.");
    }
  };

  const handleManageRoom = (room) => {
    setRoomToManage(room);
    setShowRoomManagementModal(true);
  };

  const refreshSelectedRoomDetails = async (roomId) => {
    try {
      const headers = getAuthHeaders();
      const res = await axios.get(`${BASE_URL}/api/rooms/${roomId}`, { headers });
      setSelectedRoom(res.data);
      setRoomToManage(res.data);
    } catch (err) {
      console.error("Failed to refresh room details:", err);
      setError("Failed to refresh room details after modification.");
    }
  };

  const handleAddUserToRoom = async (roomId, userIdToAdd) => {
    try {
      const headers = getAuthHeaders();
      await axios.post(`${BASE_URL}/api/rooms/addUser`, { roomId, userId: userIdToAdd }, { headers });
      await refreshSelectedRoomDetails(roomId);
      return true;
    } catch (error) {
      console.error("Failed to add user:", error);
      throw new Error(error.response?.data?.message || "Failed to add user.");
    }
  };

  const handleRemoveUserFromRoom = async (roomId, userIdToRemove) => {
    try {
      const headers = getAuthHeaders();
      await axios.post(`${BASE_URL}/api/rooms/removeUser`, { roomId, userId: userIdToRemove }, { headers });
      await refreshSelectedRoomDetails(roomId);
      return true;
    } catch (error) {
      console.error("Failed to remove user:", error);
      throw new Error(error.response?.data?.message || "Failed to remove user.");
    }
  };

  const handleMakeRoomAdmin = async (roomId, userIdToMakeAdmin) => {
    try {
      const headers = getAuthHeaders();
      await axios.post(`${BASE_URL}/api/rooms/admins/add`, { roomId, userId: userIdToMakeAdmin }, { headers });
      await refreshSelectedRoomDetails(roomId);
      return true;
    } catch (error) {
      console.error("Failed to make admin:", error);
      throw new Error(error.response?.data?.message || "Failed to make admin.");
    }
  };

  const handleRemoveRoomAdmin = async (roomId, userIdToRemoveAdmin) => {
    try {
      const headers = getAuthHeaders();
      await axios.post(`${BASE_URL}/api/rooms/admins/remove`, { roomId, userId: userIdToRemoveAdmin }, { headers });
      await refreshSelectedRoomDetails(roomId);
      return true;
    } catch (error) {
      console.error("Failed to remove admin:", error);
      throw new new Error(error.response?.data?.message || "Failed to remove admin.");
    }
  };

  const handleSearchUsersForAdd = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setSearchedUsersForAdd([]);
      return [];
    }
    try {
      const headers = getAuthHeaders();
      const res = await axios.get(`${BASE_URL}/users/search?query=${encodeURIComponent(searchTerm)}`, { headers });

      const currentMemberIds = new Set(selectedRoom?.members?.map(m => m._id));
      const filteredUsers = res.data.filter(user => !currentMemberIds.has(user._id));
      setSearchedUsersForAdd(filteredUsers);
      return filteredUsers;
    } catch (error) {
      console.error("Failed to search users:", error);
      setSearchedUsersForAdd([]);
      throw new Error(error.response?.data?.message || "Failed to search users.");
    }
  };

  const handleViewProfile = (clickedUserId) => {
    if (!clickedUserId) {
      console.error("No user ID provided for profile view.");
      return;
    }
    navigate(`/users/${clickedUserId}`);
  };


  const roomsToDisplay = useMemo(() => {
    if (!searchTerm) {
      return rooms;
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const matchedRoomIds = new Set();
    const tempRooms = new Map();

    rooms.forEach(room => {
      if (room.name.toLowerCase().includes(lowerCaseSearchTerm)) {
        tempRooms.set(room._id, room);
        matchedRoomIds.add(room._id);
      }
    });

    rooms.forEach(room => {
      if (room.type === 'sub' && matchedRoomIds.has(room._id)) {
        const parentId = room.parentRoom?._id || room.parentRoom;
        const parentRoom = rooms.find(r => r._id === parentId);
        if (parentRoom && !tempRooms.has(parentRoom._id)) {
          tempRooms.set(parentRoom._id, parentRoom);
        }
      }
    });

    return Array.from(tempRooms.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [rooms, searchTerm]);


  const renderRoomList = (roomType) => {
    const relevantRooms = roomsToDisplay.filter(room => room.isPrivate === (roomType === 'private'));

    const mainRooms = relevantRooms.filter(r => r.type === 'main');
    const subRooms = relevantRooms.filter(r => r.type === 'sub');
    let itemIndex = 0;

    return mainRooms.map(mainRoom => {
      const children = subRooms.filter(subRoom => {
        const parentId = subRoom.parentRoom?._id || subRoom.parentRoom;
        return parentId === mainRoom._id;
      });
      const mainRoomIndex = itemIndex++;

      return (
        <div key={mainRoom._id} className="mb-2">
          <motion.div
            onClick={() => handleRoomSelect(mainRoom)}
            className="flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-gray-800 group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: mainRoomIndex * 0.05 }}
          >
            <img
              src={mainRoom.avatar || `https://i.pravatar.cc/150?u=${mainRoom._id}`}
              alt={mainRoom.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1">
              <h3 className="font-semibold">{mainRoom.name}</h3>
              <p className="text-sm text-gray-400">{mainRoom.description || 'No description available'}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setRoomToEdit(mainRoom); }}
              className="p-1 rounded-full text-gray-500 hover:bg-gray-700 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
              title="Room Settings"
            >
              <MoreVertical size={20} />
            </button>
          </motion.div>

          {children.length > 0 && (
            <div className="ml-6 pl-4 border-l-2 border-gray-700/50">
              {children.map(subRoom => {
                const subRoomIndex = itemIndex++;
                return (
                  <motion.div
                    key={subRoom._id}
                    onClick={() => handleRoomSelect(subRoom)}
                    className="flex items-center gap-3 p-2 mt-2 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-gray-800 group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: subRoomIndex * 0.05 }}
                  >
                    <img
                      src={subRoom.avatar || `https://i.pravatar.cc/150?u=${subRoom._id}`}
                      alt={subRoom.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{subRoom.name}</h3>
                      <p className="text-sm text-gray-400">{subRoom.description || 'No description'}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setRoomToEdit(subRoom); }}
                      className="p-1 rounded-full text-gray-500 hover:bg-gray-700 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Room Settings"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      );
    });
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
              </div>
              {/* MoreVertical button to open RoomManagementModal */}
              <button onClick={() => handleManageRoom(selectedRoom)} className="p-2 -mr-2">
                <MoreVertical size={24} />
              </button>
            </header>

            <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {roomAccessError && (
                <div className="text-center text-red-500 p-4 rounded-md bg-red-900/20">
                  {roomAccessError}
                </div>
              )}
              {loading && !roomAccessError && <p className="text-center text-gray-400">Loading messages...</p>}
              {error && !roomAccessError && <p className="text-center text-red-500">{error}</p>}
              {!loading && !roomAccessError && messages.map((msg) => (
                <MessageBubble key={msg._id || Math.random()} msg={msg} userId={userId} currentUser={currentUser} onUserClick={handleViewProfile} />
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
                {roomsToDisplay.length} {roomsToDisplay.length === 1 ? 'room' : 'rooms'} found
              </p>
              <p className="text-sm text-gray-400 text-center">
                Click to join and chat or create a new room.
              </p>

              <div className="relative mt-4 mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search rooms by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-900 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <button onClick={() => setShowCreateRoomModal(true)}
                className="p-2 bg-purple-600 hover:bg-purple-700 rounded-full text-white shadow-lg absolute right-4 top-4"
                title="Add New Room" >
                <PlusCircle size={24} />
              </button>

            </header>

            <main className="flex-1 overflow-y-auto p-4 pb-20">
              {roomAccessError && (
                <div className="text-center text-red-500 p-4 rounded-md bg-red-900/20">
                  {roomAccessError}
                </div>
              )}
              {loading && !roomAccessError && <p className="text-center text-gray-400">Loading rooms...</p>}
              {error && !roomAccessError && <p className="text-center text-red-500">{error}</p>}
              {!loading && !roomAccessError && (
                <>
                  <h2 className="text-xl font-bold mt-4 mb-2 text-gray-300">Public Rooms</h2>
                  {renderRoomList('public')}

                  <h2 className="text-xl font-bold mt-6 mb-2 text-gray-300">Private Rooms</h2>
                  {renderRoomList('private')}

                  {roomsToDisplay.length === 0 && (
                    <p className="text-center text-gray-400 mt-4">No rooms found matching your search.</p>
                  )}
                </>
              )}
            </main>
            <MobileNavbar />
          </motion.div>
        )}
      </AnimatePresence>

      <CreateRoomModal
        isVisible={showCreateRoomModal}
        onClose={() => setShowCreateRoomModal(false)}
        onCreateRoom={handleCreateRoom}
        loading={createRoomLoading}
        error={createRoomError}
        allRooms={rooms}
      />

      <EditRoomModal
        isVisible={!!roomToEdit}
        onClose={() => setRoomToEdit(null)}
        room={roomToEdit}
        onUpdateRoom={handleUpdateRoom}
        onDeleteRoom={handleDeleteRoom}
        loading={createRoomLoading}
        allRooms={rooms}
      />

      <RoomManagementModal
        isVisible={showRoomManagementModal}
        onClose={() => setShowRoomManagementModal(false)}
        room={roomToManage}
        onAddUser={handleAddUserToRoom}
        onRemoveUser={handleRemoveUserFromRoom}
        onMakeAdmin={handleMakeRoomAdmin}
        onRemoveAdmin={handleRemoveRoomAdmin}
        onEditRoomSettings={(room) => {
            setRoomToEdit(room);
            setShowRoomManagementModal(false);
        }}
        currentUser={currentUser}
        onSearchUser={handleSearchUsersForAdd}
        searchedUsers={searchedUsersForAdd}
      />
    </div>
  );
};

export default RoomsPage;
