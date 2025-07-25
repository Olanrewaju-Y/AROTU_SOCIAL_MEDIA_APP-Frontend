// src/components/MessageBubble.js (or directly in RoomsPage.js if not separated)
import React from 'react';
import { motion } from 'framer-motion';

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
        {/* Sender Name: Always display the sender's username */}
        <p className={`text-xs text-gray-400 mb-1 px-1 font-semibold ${isCurrentUser ? 'text-right' : 'text-left'}`}>
          {msg.sender.username || 'Anonymous'} {/* Added fallback for username */}
        </p>
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

export default MessageBubble;
