// src/components/CreatePostTrigger.js
import React from 'react';
import { Image as ImageIcon } from 'lucide-react';

const CreatePostTrigger = ({ setIsCreatingPost, currentUser, currentUserId }) => {
  return (
    <div className="p-4 border-b border-gray-800">
      <div className="flex items-center space-x-3">
        <img
          src={currentUser?.avatar || `https://i.pravatar.cc/150?u=${currentUserId}`}
          alt="Your avatar"
          className="w-10 h-10 rounded-full object-cover"
        />
        <div
          onClick={() => setIsCreatingPost(true)}
          className="flex-1 text-gray-500 bg-[#1a1a1a] rounded-full py-2 px-4 cursor-pointer hover:bg-gray-800 transition-colors"
        >
          What's on your mind?
        </div>
        <button
          onClick={() => setIsCreatingPost(true)}
          className="p-2 rounded-full hover:bg-gray-800"
          aria-label="Create a post with an image"
        >
          <ImageIcon size={24} className="text-purple-500" />
        </button>
      </div>
    </div>
  );
};

export default CreatePostTrigger;
