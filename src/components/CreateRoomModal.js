// src/components/CreateRoomModal.js
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Users, Lock, Link as LinkIcon, PlusCircle } from 'lucide-react';

const CreateRoomModal = ({ isVisible, onClose, onCreateRoom, loading, error }) => {
  const [roomData, setRoomData] = useState({
    name: '',
    description: '',
    avatar: '',
    isPublic: true,
    password: '',
    isPrivate: false,
    parentRoom: '', // This might be a dropdown of existing rooms or left empty
    type: 'main', // 'main' or 'sub'
  });
  const [formError, setFormError] = useState(null);

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setRoomData((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value,
    }));

    // Logic for isPublic/isPrivate toggle
    if (id === 'isPublic') {
      setRoomData((prev) => ({
        ...prev,
        isPrivate: !checked, // If public is checked, private is unchecked
        password: checked ? '' : prev.password, // Clear password if public
      }));
    } else if (id === 'isPrivate') {
      setRoomData((prev) => ({
        ...prev,
        isPublic: !checked, // If private is checked, public is unchecked
        password: checked ? prev.password : '', // Clear password if not private
      }));
    }
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!roomData.name.trim()) {
      setFormError("Room name is required.");
      return;
    }
    if (roomData.isPrivate && !roomData.password.trim()) {
      setFormError("Password is required for private rooms.");
      return;
    }

    // Call the onCreateRoom function passed from the parent
    await onCreateRoom(roomData);
    if (!error) { // Only clear form if no error from API
      setRoomData({
        name: '',
        description: '',
        avatar: '',
        isPublic: true,
        password: '',
        isPrivate: false,
        parentRoom: '',
        type: 'main',
      });
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ y: 50, scale: 0.95 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 50, scale: 0.95 }}
            className="relative w-full max-w-md bg-[#262626] p-6 rounded-2xl shadow-lg border border-gray-700/50"
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-700"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500">
              Create New Room
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Room Name *</label>
                <input
                  type="text"
                  id="name"
                  value={roomData.name}
                  onChange={handleChange}
                  placeholder="e.g., General Chat, Study Group"
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg focus:ring-cyan-500 focus:border-cyan-500 transition"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  id="description"
                  rows="3"
                  value={roomData.description}
                  onChange={handleChange}
                  placeholder="A brief description of the room's purpose"
                  className="w-full p-3 bg-[#1a1a1a] border border-gray-600 rounded-lg focus:ring-cyan-500 focus:border-cyan-500 transition"
                />
              </div>
              <div>
                <label htmlFor="avatar" className="block text-sm font-medium text-gray-300 mb-1">Avatar URL (optional)</label>
                <input
                  type="url"
                  id="avatar"
                  value={roomData.avatar}
                  onChange={handleChange}
                  placeholder="https://example.com/room-icon.png"
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg focus:ring-cyan-500 focus:border-cyan-500 transition"
                />
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={roomData.isPublic}
                    onChange={handleChange}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-600 rounded"
                  />
                  <label htmlFor="isPublic" className="ml-2 text-sm text-gray-300 flex items-center">
                    <Globe size={16} className="mr-1" /> Public
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={roomData.isPrivate}
                    onChange={handleChange}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-600 rounded"
                  />
                  <label htmlFor="isPrivate" className="ml-2 text-sm text-gray-300 flex items-center">
                    <Lock size={16} className="mr-1" /> Private
                  </label>
                </div>
              </div>

              {roomData.isPrivate && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Password *</label>
                  <input
                    type="password"
                    id="password"
                    value={roomData.password}
                    onChange={handleChange}
                    placeholder="Enter password for private room"
                    className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg focus:ring-cyan-500 focus:border-cyan-500 transition"
                  />
                </div>
              )}

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">Room Type</label>
                <select
                  id="type"
                  value={roomData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg focus:ring-cyan-500 focus:border-cyan-500 transition"
                >
                  <option value="main">Main Room</option>
                  <option value="sub">Sub Room</option>
                </select>
              </div>

              {/* Parent Room selection - This would ideally be a dropdown of existing main rooms */}
              {roomData.type === 'sub' && (
                <div>
                  <label htmlFor="parentRoom" className="block text-sm font-medium text-gray-300 mb-1">Parent Room ID (for sub-rooms)</label>
                  <input
                    type="text" // Or a select/dropdown populated by main rooms
                    id="parentRoom"
                    value={roomData.parentRoom}
                    onChange={handleChange}
                    placeholder="Enter Parent Room ID"
                    className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg focus:ring-cyan-500 focus:border-cyan-500 transition"
                  />
                </div>
              )}

              {formError && <p className="text-red-500 text-sm text-center">{formError}</p>}
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Room"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateRoomModal;
