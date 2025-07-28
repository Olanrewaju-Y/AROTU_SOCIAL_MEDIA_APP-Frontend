// src/components/RoomManagementModal.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, UserPlus, UserMinus, Crown, Settings } from 'lucide-react';

const RoomManagementModal = ({
  isVisible,
  onClose,
  room,
  onAddUser,
  onRemoveUser,
  onMakeAdmin,
  onRemoveAdmin,
  onEditRoomSettings,
  currentUser, // Pass current user for permission checks
}) => {
  const [newUserId, setNewUserId] = useState('');
  const [managementError, setManagementError] = useState(null);
  const [managementLoading, setManagementLoading] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isVisible) {
      setNewUserId('');
      setManagementError(null);
      setManagementLoading(false);
    }
  }, [isVisible]);

  if (!room) return null;

  // Helper to check if current user is an admin of this room
  const isCurrentUserAdmin = room.admins?.includes(currentUser?._id);
  const isCreator = room.creator === currentUser?._id;

  const handleAddUser = async () => {
    if (!newUserId.trim()) {
      setManagementError("Please enter a User ID.");
      return;
    }
    setManagementLoading(true);
    setManagementError(null);
    try {
      await onAddUser(room._id, newUserId);
      setNewUserId('');
    } catch (err) {
      setManagementError(err.message || "Failed to add user.");
    } finally {
      setManagementLoading(false);
    }
  };

  const handleRemoveUser = async (userIdToRemove) => {
    if (!window.confirm("Are you sure you want to remove this user from the room?")) return;
    setManagementLoading(true);
    setManagementError(null);
    try {
      await onRemoveUser(room._id, userIdToRemove);
    } catch (err) {
      setManagementError(err.message || "Failed to remove user.");
    } finally {
      setManagementLoading(false);
    }
  };

  const handleMakeAdmin = async (userIdToMakeAdmin) => {
    if (!window.confirm("Are you sure you want to make this user an admin of the room?")) return;
    setManagementLoading(true);
    setManagementError(null);
    try {
      await onMakeAdmin(room._id, userIdToMakeAdmin);
    } catch (err) {
      setManagementError(err.message || "Failed to make admin.");
    } finally {
      setManagementLoading(false);
    }
  };

  const handleRemoveAdmin = async (userIdToRemoveAdmin) => {
    if (!window.confirm("Are you sure you want to remove admin privileges from this user?")) return;
    setManagementLoading(true);
    setManagementError(null);
    try {
      await onRemoveAdmin(room._id, userIdToRemoveAdmin);
    } catch (err) {
      setManagementError(err.message || "Failed to remove admin.");
    } finally {
      setManagementLoading(false);
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
            className="relative w-full max-w-md bg-[#262626] p-6 rounded-2xl shadow-lg border border-gray-700/50 text-gray-100"
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-700"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-purple-500">
              {room.name} Settings
            </h2>

            <div className="space-y-6">
              {/* Room Settings */}
              {(isCreator || isCurrentUserAdmin) && (
                <div className="border-b border-gray-700 pb-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Settings size={20} /> Room Settings
                  </h3>
                  <button
                    onClick={() => { onEditRoomSettings(room); onClose(); }}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
                  >
                    Edit Room Details
                  </button>
                </div>
              )}

              {/* Members List */}
              <div className="border-b border-gray-700 pb-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Users size={20} /> Members ({room.members?.length || 0})
                </h3>
                <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {room.members?.length > 0 ? (
                    room.members.map((member) => (
                      <div key={member._id} className="flex items-center justify-between p-2 hover:bg-gray-700 rounded-md mb-1">
                        <div className="flex items-center gap-3">
                          <img
                            src={member.avatar || `https://i.pravatar.cc/150?u=${member._id}`}
                            alt={member.username}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <span className="font-medium">
                            {member.roomNickname || member.username}
                            {room.creator === member._id && <span className="ml-2 text-yellow-400 text-xs">(Creator)</span>}
                            {room.admins?.includes(member._id) && room.creator !== member._id && <span className="ml-2 text-blue-400 text-xs">(Admin)</span>}
                          </span>
                        </div>
                        {(isCreator || isCurrentUserAdmin) && currentUser?._id !== member._id && ( // Can't remove/demote self
                          <div className="flex gap-2">
                            {room.admins?.includes(member._id) ? (
                              <button
                                onClick={() => handleRemoveAdmin(member._id)}
                                className="p-1 text-red-400 hover:text-red-500 rounded-full hover:bg-gray-800"
                                title="Remove Admin"
                                disabled={managementLoading}
                              >
                                <Crown size={18} className="rotate-180" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleMakeAdmin(member._id)}
                                className="p-1 text-green-400 hover:text-green-500 rounded-full hover:bg-gray-800"
                                title="Make Admin"
                                disabled={managementLoading}
                              >
                                <Crown size={18} />
                              </button>
                            )}
                            <button
                              onClick={() => handleRemoveUser(member._id)}
                              className="p-1 text-red-400 hover:text-red-500 rounded-full hover:bg-gray-800"
                              title="Remove User"
                              disabled={managementLoading}
                            >
                              <UserMinus size={18} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm">No members in this room yet.</p>
                  )}
                </div>
              </div>

              {/* Add User */}
              {(isCreator || isCurrentUserAdmin) && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <UserPlus size={20} /> Add User
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newUserId}
                      onChange={(e) => setNewUserId(e.target.value)}
                      placeholder="Enter User ID or Username"
                      className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg focus:ring-cyan-500 focus:border-cyan-500 transition"
                      disabled={managementLoading}
                    />
                    <button
                      onClick={handleAddUser}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
                      disabled={managementLoading || !newUserId.trim()}
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              {managementError && <p className="text-red-500 text-sm text-center mt-4">{managementError}</p>}
              {managementLoading && <p className="text-center text-gray-400 mt-4">Processing...</p>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RoomManagementModal;
