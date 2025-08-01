// src/components/CreateRoomModal.js
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock } from 'lucide-react';

const CreateRoomModal = ({ isVisible, onClose, onCreateRoom, loading, error, allRooms = [] }) => {
  const [room, setRoom] = useState({
    name: '',
    description: '',
    avatar: '',
    isPrivate: false,
    parentRoom: '', // This might be a dropdown of existing rooms or left empty
    type: 'main', // 'main' or 'sub'
    creator: '', // This should be set to the current user's ID or username
  });
  const [formError, setFormError] = useState(null);

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;

    setRoom((prev) => {
      let updatedRoom = { ...prev };

      if (id === 'isPrivate') {
        updatedRoom.isPrivate = checked;
        // If private, force type to 'main' and clear parentRoom
        if (checked) {
          updatedRoom.type = 'main';
          updatedRoom.parentRoom = '';
        }
      } else if (id === 'type') {
        updatedRoom.type = value;
        // If type changes to 'main', clear parentRoom
        if (value === 'main') {
          updatedRoom.parentRoom = '';
        }
      } else {
        updatedRoom[id] = type === 'checkbox' ? checked : value;
      }
      return updatedRoom;
    });
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!room.name.trim()) {
      setFormError("Room name is required.");
      return;
    }
    // Re-check for sub-room parent selection, now that private rooms are always main
    if (room.type === 'sub' && !room.parentRoom) {
      setFormError("A parent room must be selected for a sub-room.");
      return;
    }

    // Call the onCreateRoom function passed from the parent
    await onCreateRoom(room);
    // Only clear form if no error from API and modal is still visible (meaning it wasn't closed by an external error)
    if (!error && isVisible) {
      setRoom({
        name: '',
        description: '',
        avatar: '',
        isPrivate: false,
        parentRoom: '',
        type: 'main',
        creator: '', // Assuming creator is set elsewhere, e.g., from user context
      });
      onClose(); // Close modal on success
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
            <h2 className="text-2xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-purple-500">
              Create New Room
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Room Name *</label>
                <input
                  type="text"
                  id="name"
                  value={room.name}
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
                  value={room.description}
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
                  value={room.avatar}
                  onChange={handleChange}
                  placeholder="https://example.com/room-icon.png"
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg focus:ring-cyan-500 focus:border-cyan-500 transition"
                />
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={room.isPrivate}
                    onChange={handleChange}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-600 rounded"
                  />
                  <label htmlFor="isPrivate" className="ml-2 text-sm text-gray-300 flex items-center">
                    <Lock size={16} className="mr-1" /> Private
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">Room Type</label>
                <select
                  id="type"
                  value={room.type}
                  onChange={handleChange}
                  // Disable if room is private
                  disabled={room.isPrivate}
                  className={`w-full px-4 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg focus:ring-cyan-500 focus:border-cyan-500 transition ${room.isPrivate ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <option value="main">Main Room</option>
                  {/* Option for sub-room is only available if not private */}
                  {!room.isPrivate && <option value="sub">Sub Room</option>}
                </select>
              </div>

              {/* Parent Room selection - only visible if type is 'sub' and not private */}
              {room.type === 'sub' && !room.isPrivate && (
                <div>
                  <label htmlFor="parentRoom" className="block text-sm font-medium text-gray-300 mb-1">Parent Room *</label>
                  <select
                    id="parentRoom"
                    value={room.parentRoom}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg focus:ring-cyan-500 focus:border-cyan-500 transition"
                  >
                    <option value="">Select a Parent Room</option>
                    {allRooms
                      .filter(r => r.type === 'main') // Only main rooms can be parents
                      .map((parent) => (
                      <option key={parent._id} value={parent._id}>
                        {parent.name}
                      </option>
                    ))}
                  </select>
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
