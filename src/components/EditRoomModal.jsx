import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';

const EditRoomModal = ({ isVisible, onClose, room, onUpdateRoom, onDeleteRoom, loading, error, allRooms = [] }) => {
  const [formData, setFormData] = useState({});
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    // When the room prop changes, update the form data
    if (room) {
      setFormData({
        name: room.name || '',
        description: room.description || '',
        avatar: room.avatar || '',
        isPrivate: room.isPrivate || false,  
        members: room.members || [],      
        parentRoom: room.parentRoom?._id || room.parentRoom || '',
        type: room.type || 'main',
        
      });
    }
  }, [room]);

  if (!room) return null;

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData((prev) => {
      const newFormData = { ...prev, [id]: type === 'checkbox' ? checked : value };
      if (id === 'isPrivate' && !checked) {
        newFormData.password = ''; // Clear password if room is made public
      }
      if (id === 'type' && value === 'main') {
        newFormData.parentRoom = ''; // Clear parent if type is changed to main
      }
      return newFormData;
    });
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!formData.name.trim()) {
      setFormError("Room name is required.");
      return;
    }
    // If making a public room private, a new password is required.
    if (formData.isPrivate && !room.isPrivate && !formData.password.trim()) {
      setFormError("A new password is required to make this room private.");
      return;
    }
    if (formData.type === 'sub' && !formData.parentRoom) {
      setFormError("A parent room must be selected for a sub-room.");
      return;
    }
 
    // Create a clean payload to send to the API.
    // name, description, avatar, isPrivate, members, parentRoom, type
    const payload = {
      name: formData.name,
      description: formData.description,
      avatar: formData.avatar,
      isPrivate: formData.isPrivate,
      members: formData.members,
      parentRoom: formData.parentRoom || null,
      type: formData.type,      
    };

    // Only include the password in the payload if a new one was entered.
    if (formData.password.trim()) {
      payload.password = formData.password;
    }

    // The parent component will handle the API call
     await onUpdateRoom(room._id, payload);
  };

  const handleDelete = () => {
    // The parent component will handle confirmation and API call
    onDeleteRoom(room._id);
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
            <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-700">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-purple-500">
              Room Settings
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Room Name *</label>
                <input type="text" id="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg focus:ring-cyan-500 focus:border-cyan-500 transition" />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea id="description" rows="3" value={formData.description} onChange={handleChange} className="w-full p-3 bg-[#1a1a1a] border border-gray-600 rounded-lg focus:ring-cyan-500 focus:border-cyan-500 transition" />
              </div>
              <div>
                <label htmlFor="avatar" className="block text-sm font-medium text-gray-300 mb-1">Avatar URL (optional)</label>
                <input
                  type="url"
                  id="avatar"
                  value={formData.avatar}
                  onChange={handleChange}
                  placeholder="https://example.com/room-icon.png"
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg focus:ring-cyan-500 focus:border-cyan-500 transition"
                />
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="isPrivate" checked={formData.isPrivate} onChange={handleChange} className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-600 rounded" />
                <label htmlFor="isPrivate" className="ml-2 text-sm text-gray-300">Private Room</label>
              </div>
              {formData.isPrivate && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">New Password (optional)</label>
                  <input type="password" id="password" value={formData.password} onChange={handleChange} placeholder="Leave blank to keep current password" className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg focus:ring-cyan-500 focus:border-cyan-500 transition" />
                </div>
              )}
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">Room Type</label>
                <select id="type" value={formData.type} onChange={handleChange} className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg focus:ring-cyan-500 focus:border-cyan-500 transition">
                  <option value="main">Main Room</option>
                  <option value="sub">Sub Room</option>
                </select>
              </div>
              {formData.type === 'sub' && (
                <div>
                  <label htmlFor="parentRoom" className="block text-sm font-medium text-gray-300 mb-1">Parent Room *</label>
                  <select id="parentRoom" value={formData.parentRoom} onChange={handleChange} className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg focus:ring-cyan-500 focus:border-cyan-500 transition">
                    <option value="">Select a Parent Room</option>
                    {allRooms
                      .filter(r => r.type === 'main' && r._id !== room._id)
                      .map((parent) => (
                        <option key={parent._id} value={parent._id}>{parent.name}</option>
                      ))}
                  </select>
                </div>
              )}

              {formError && <p className="text-red-500 text-sm text-center">{formError}</p>}
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}

              <div className="flex items-center justify-between pt-4">
                <button onClick={handleDelete} disabled={loading} className="flex items-center gap-2 text-sm text-red-500 hover:text-red-400 transition disabled:opacity-50">
                  <Trash2 size={16} /> Delete Room
                </button>
                <button onClick={handleSubmit} disabled={loading} className="bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-2 px-6 rounded-lg hover:opacity-90 transition disabled:opacity-50">
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditRoomModal;