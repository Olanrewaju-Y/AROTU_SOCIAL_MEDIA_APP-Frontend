// src/components/SearchResultsModal.js
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MessageCircle } from 'lucide-react';

const SearchResultsModal = ({ showSearchModal, setShowSearchModal, searchQuery, searchResults }) => {
  return (
    <AnimatePresence>
      {showSearchModal && (
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
            className="relative w-full max-w-2xl bg-[#262626] p-6 rounded-2xl shadow-lg border border-gray-700/50 max-h-[80vh] overflow-y-auto"
          >
            <button
              onClick={() => setShowSearchModal(false)}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-700"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500">
              Search Results for "{searchQuery}"
            </h2>
            {searchResults.length === 0 ? (
              <p className="text-center text-gray-400 py-10">No posts found for your search.</p>
            ) : (
              <div className="space-y-4">
                {searchResults.map((post) => (
                  <div key={post._id} className="bg-[#1a1a1a] rounded-lg p-4 shadow-md">
                    <div className="flex items-center space-x-3 mb-2">
                      <img
                        src={post.user?.avatar || `https://i.pravatar.cc/150?u=${post.user?._id}`}
                        alt={post.user?.username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="font-semibold text-sm text-white">
                        {post.user?.username || "Anonymous"}
                      </span>
                    </div>
                    <p className="whitespace-pre-line text-gray-300 text-sm leading-relaxed mb-2">
                      {post.content}
                    </p>
                    {post.image && (
                      <img src={post.image} alt="Post content" className="rounded-lg mt-2 w-full object-cover max-h-48" />
                    )}
                    <div className="flex items-center space-x-4 mt-3 text-gray-400 text-xs">
                      <span className="flex items-center"><Heart size={16} className="mr-1" /> {post.likes?.length || 0}</span>
                      <span className="flex items-center"><MessageCircle size={16} className="mr-1" /> {post.comments?.length || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchResultsModal;
