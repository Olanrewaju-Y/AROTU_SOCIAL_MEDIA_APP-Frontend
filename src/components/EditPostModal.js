// src/components/EditPostModal.js
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const EditPostModal = ({ isEditingPost, setIsEditingPost, editPostData, handleEditPostChange, handleUpdatePost, postLoading, error }) => {
  return (
    <AnimatePresence>
      {isEditingPost && (
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
              onClick={() => setIsEditingPost(false)}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-700"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-500">
              Edit Post
            </h2>
            <div className="space-y-4">
              <textarea
                id="content"
                rows="5"
                value={editPostData.content}
                onChange={handleEditPostChange}
                placeholder="Edit your thoughts..."
                className={`w-full p-3 bg-[#1a1a1a] border rounded-lg focus:ring-teal-500 focus:border-teal-500 transition ${
                  editPostData.content.length > 300 ? "border-red-500" : "border-gray-600"
                }`}
              />
              <p
                className={`text-sm text-right ${
                  editPostData.content.length > 300 ? "text-red-500" : "text-gray-400"
                }`}
              >
                {editPostData.content.length}/300
              </p>
              <input
                type="url"
                id="image"
                value={editPostData.image}
                onChange={handleEditPostChange}
                placeholder="Image URL (optional)"
                className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition"
              />
              <select
                id="visibility"
                value={editPostData.visibility}
                onChange={handleEditPostChange}
                className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-600 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition"
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
                onClick={handleUpdatePost}
                disabled={postLoading}
                className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50"
              >
                {postLoading ? "Updating..." : "Update Post"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditPostModal;
