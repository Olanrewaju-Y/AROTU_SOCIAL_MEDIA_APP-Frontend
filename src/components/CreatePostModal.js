// src/components/CreatePostModal.js
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const CreatePostModal = ({ isCreatingPost, setIsCreatingPost, newPostData, handleNewPostChange, handleCreatePost, postLoading, error }) => {
  return (
    <AnimatePresence>
      {isCreatingPost && (
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
            className="relative w-full max-w-lg bg-[#262626] p-6 rounded-2xl shadow-lg border border-gray-700/50"
          >
            <button
              onClick={() => setIsCreatingPost(false)}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-700"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
              Create Post
            </h2>
            <div className="space-y-4">
              <textarea
                id="content"
                rows="5"
                value={newPostData.content}
                onChange={handleNewPostChange}
                placeholder="Share your thoughts..."
                className={`w-full p-3 bg-[#1a1a1a] border rounded-lg focus:ring-orange-500 focus:border-orange-500 transition ${
                  newPostData.content.length > 300 ? "border-red-500" : "border-gray-600"
                }`}
              />
              <p
                className={`text-sm text-right ${
                  newPostData.content.length > 300 ? "text-red-500" : "text-gray-400"
                }`}
              >
                {newPostData.content.length}/300
              </p>
              <input
                type="url"
                id="image"
                value={newPostData.image}
                onChange={handleNewPostChange}
                placeholder="Image URL (optional)"
                className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg focus:ring-orange-500 focus:border-orange-500 transition"
              />
              <select
                id="visibility"
                value={newPostData.visibility}
                onChange={handleNewPostChange}
                className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg focus:ring-orange-500 focus:border-orange-500 transition"
              >
                <option value="public">Public</option>
                <option value="friends">Friends Only</option>
                <option value="followers">Followers Only</option>
              </select>
              {error && (
                <p className="text-red-500 text-sm text-center">
                  {error}
                </p>
              )}
              <button
                onClick={handleCreatePost}
                disabled={postLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50"
              >
                {postLoading ? "Posting..." : "Post"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreatePostModal;
