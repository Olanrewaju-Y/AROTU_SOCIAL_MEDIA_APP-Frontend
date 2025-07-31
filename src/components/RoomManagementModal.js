// src/components/RoomManagementModal.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, UserPlus, UserMinus, Crown, Settings, Search } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal'; // Import the new ConfirmationModal

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
  onSearchUser, // New prop: function to search for users
  searchedUsers, // New prop: results from user search
}) => {
  const [newUserInput, setNewUserInput] = useState(''); // Input for searching/adding user
  const [selectedUserToAdd, setSelectedUserToAdd] = useState(null); // User selected from search results
  const [managementError, setManagementError] = useState(null);
  const [managementLoading, setManagementLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // Stores the action to confirm
  const [confirmData, setConfirmData] = useState(null); // Stores data for the action

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isVisible) {
      setNewUserInput('');
      setSelectedUserToAdd(null);
      setManagementError(null);
      setManagementLoading(false);
      setShowConfirmModal(false);
      setConfirmAction(null);
      setConfirmData(null);
    }
  }, [isVisible]);

  if (!room) return null;

  // Correctly check if current user is an admin by comparing _id strings
  const isCurrentUserAdmin = room.admins?.some(admin => String(admin._id) === String(currentUser?._id));
  // Correctly check if current user is the creator by comparing _id strings
  const isCreator = String(room.creator?._id) === String(currentUser?._id);

  // --- Debugging Logs ---
  console.log("RoomManagementModal - Room:", room);
  console.log("RoomManagementModal - Current User ID:", currentUser?._id);
  console.log("RoomManagementModal - Is Private:", room.isPrivate);
  console.log("RoomManagementModal - Is Creator:", isCreator);
  console.log("RoomManagementModal - Is Current User Admin:", isCurrentUserAdmin);
  console.log("RoomManagementModal - Room Members:", room.members); // Inspect members array
  console.log("RoomManagementModal - Searched Users:", searchedUsers); // Inspect searched users array
  // --- End Debugging Logs ---


  const handleSearchUsers = async () => {
    setManagementError(null);
    setSelectedUserToAdd(null); // Clear previous selection
    if (!newUserInput.trim()) {
      setManagementError("Please enter a User ID or Username to search.");
      return;
    }
    setManagementLoading(true);
    try {
      // Call the onSearchUser prop provided by RoomsPage
      await onSearchUser(newUserInput.trim());
      // The results will be in the `searchedUsers` prop, no need to set local state here
    } catch (err) {
      setManagementError(err.message || "Failed to search users.");
    } finally {
      setManagementLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!selectedUserToAdd || managementLoading) return;

    setManagementLoading(true);
    setManagementError(null);
    try {
      await onAddUser(room._id, selectedUserToAdd._id);
      setNewUserInput('');
      setSelectedUserToAdd(null);
      // Clear search results after successful add
      // This is handled by the parent component refreshing its `searchedUsers` state
    } catch (err) {
      setManagementError(err.message || "Failed to add user.");
    } finally {
      setManagementLoading(false);
    }
  };

  const triggerConfirmation = (action, data, title, message, confirmText, confirmButtonClass) => {
    setConfirmAction(() => () => { // Store the function to be called on confirm
      setManagementLoading(true);
      setManagementError(null);
      setShowConfirmModal(false); // Close confirmation modal immediately
      action(data)
        .catch(err => setManagementError(err.message || "Operation failed."))
        .finally(() => setManagementLoading(false));
    });
    setConfirmData({ title, message, confirmText, confirmButtonClass });
    setShowConfirmModal(true);
  };

  const handleRemoveUserClick = (memberId) => {
    triggerConfirmation(
      (id) => onRemoveUser(room._id, id),
      memberId,
      "Remove User",
      "Are you sure you want to remove this user from the room? This action cannot be undone.",
      "Remove",
      "bg-red-600 hover:bg-red-700"
    );
  };

  const handleMakeAdminClick = (memberId) => {
    triggerConfirmation(
      (id) => onMakeAdmin(room._id, id),
      memberId,
      "Make Admin",
      "Are you sure you want to make this user an admin of the room?",
      "Make Admin",
      "bg-green-600 hover:bg-green-700"
    );
  };

  const handleRemoveAdminClick = (memberId) => {
    triggerConfirmation(
      (id) => onRemoveAdmin(room._id, id),
      memberId,
      "Remove Admin",
      "Are you sure you want to remove admin privileges from this user?",
      "Remove Admin",
      "bg-orange-600 hover:bg-orange-700"
    );
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
              {/* Room Settings - Visible if current user is creator or admin (for any room type) */}
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
                      <div key={member._id || member.username || Math.random()} className="flex items-center justify-between p-2 hover:bg-gray-700 rounded-md mb-1">
                        <div className="flex items-center gap-3">
                          <img
                            src={member.avatar || `https://i.pravatar.cc/150?u=${member._id}`}
                            alt={member.username}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <span className="font-medium">
                            {member.roomNickname || member.username}
                            {String(room.creator?._id) === String(member._id) && <span className="ml-2 text-yellow-400 text-xs">(Creator)</span>}
                            {room.admins?.some(admin => String(admin._id) === String(member._id)) && String(room.creator?._id) !== String(member._id) && <span className="ml-2 text-blue-400 text-xs">(Admin)</span>}
                          </span>
                        </div>
                        {(isCreator || isCurrentUserAdmin) && String(currentUser?._id) !== String(member._id) && ( // Can't remove/demote self
                          <div className="flex gap-2">
                            {room.admins?.some(admin => String(admin._id) === String(member._id)) ? ( // Check if member is an admin
                              <button
                                onClick={() => handleRemoveAdminClick(member._id)}
                                className="p-1 text-orange-400 hover:text-orange-500 rounded-full hover:bg-gray-800"
                                title="Remove Admin"
                                disabled={managementLoading}
                              >
                                <Crown size={18} className="rotate-180" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleMakeAdminClick(member._id)}
                                className="p-1 text-green-400 hover:text-green-500 rounded-full hover:bg-gray-800"
                                title="Make Admin"
                                disabled={managementLoading}
                              >
                                <Crown size={18} />
                              </button>
                            )}
                            <button
                              onClick={() => handleRemoveUserClick(member._id)}
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

              {/* Add User - Only visible for private rooms and if current user is creator or admin */}
              {room.isPrivate && (isCreator || isCurrentUserAdmin) && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <UserPlus size={20} /> Add User
                  </h3>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newUserInput}
                      onChange={(e) => {
                        setNewUserInput(e.target.value);
                        setSelectedUserToAdd(null); // Clear selected user on input change
                        setManagementError(null); // Clear error on input change
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSearchUsers();
                        }
                      }}
                      placeholder="Enter User ID or Username"
                      className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg focus:ring-cyan-500 focus:border-cyan-500 transition"
                      disabled={managementLoading}
                    />
                    <button
                      onClick={handleSearchUsers}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
                      disabled={managementLoading || !newUserInput.trim()}
                    >
                      <Search size={20} />
                    </button>
                  </div>

                  {/* Display search results */}
                  {searchedUsers.length > 0 && (
                    <div className="max-h-40 overflow-y-auto bg-gray-800 rounded-md p-2 mt-2 custom-scrollbar">
                      {searchedUsers.map(user => (
                        <div
                          key={user._id || user.username || Math.random()} // Fallback key
                          className={`flex items-center justify-between p-2 rounded-md mb-1 cursor-pointer ${selectedUserToAdd?._id === user._id ? 'bg-purple-700' : 'hover:bg-gray-700'}`}
                          onClick={() => setSelectedUserToAdd(user)}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={user.avatar || `https://i.pravatar.cc/150?u=${user._id}`}
                              alt={user.username}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <span className="font-medium">{user.username}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedUserToAdd && (
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-md mt-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={selectedUserToAdd.avatar || `https://i.pravatar.cc/150?u=${selectedUserToAdd._id}`}
                          alt={selectedUserToAdd.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span className="font-medium">Selected: {selectedUserToAdd.username}</span>
                      </div>
                      <button
                        onClick={handleAddUser}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded-lg transition disabled:opacity-50"
                        disabled={managementLoading}
                      >
                        Add to Room
                      </button>
                    </div>
                  )}
                  {searchedUsers.length === 0 && newUserInput.trim() && !managementLoading && (
                      <p className="text-gray-400 text-sm text-center mt-2">No users found matching "{newUserInput}".</p>
                  )}
                </div>
              )}

              {managementError && <p className="text-red-500 text-sm text-center mt-4">{managementError}</p>}
              {managementLoading && <p className="text-center text-gray-400 mt-4">Processing...</p>}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isVisible={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmAction}
        title={confirmData?.title}
        message={confirmData?.message}
        confirmText={confirmData?.confirmText}
        confirmButtonClass={confirmData?.confirmButtonClass}
      />
    </AnimatePresence>
  );
};

export default RoomManagementModal;
