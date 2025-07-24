// src/components/PostCard.js
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Send,
  MoreHorizontal,
  UserPlus,
  Bookmark,
  Repeat2,
  Edit,
  Trash2,
} from 'lucide-react';

const PostCard = ({
  post,
  currentUserId,
  handleFollowUser,
  handleToggleLike,
  handleToggleCommentSection,
  handleRepost,
  handleBookmarkPost,
  openEditPostModal,
  handleDeletePost,
  expandedPostId,
  commentInputs,
  handleCommentInputChange,
  handleAddComment,
  handleDeleteComment,
  openMenuId,
  handleToggleMenu,
  currentUser // Passed to allow comment input avatar
}) => {
  return (
    <motion.article
      key={post._id}
      className="bg-[#121212] border-b border-gray-800"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-4">
        {/* Post Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <img
              src={post.user?.avatar || `https://i.pravatar.cc/150?u=${post.user?._id}`}
              alt={post.user?.username}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-white">
                {/* {post.user?.username || "Anonymous"} */}
                {post.user?.username ? post.user?.username : 'Anonymous'}
              </span>
              <p className="text-xs text-gray-500">
                {new Date(post.createdAt).toLocaleString()}
              </p>
            </div>
            {/* Follow Icon: Only show if the post author is not you */}
            {post.user?._id !== currentUserId && (
              <button
                onClick={() => handleFollowUser(post.user?._id)}
                className="ml-2 text-gray-400 hover:text-purple-500 transition-colors"
                title="Follow user"
              >
                <UserPlus size={18} />
              </button>
            )}
          </div>
          {/* More options button (for edit/delete) */}
          {post.user?._id === currentUserId && (
            <div className="relative">
              <button
                onClick={() => handleToggleMenu(post._id)}
                className="p-1 rounded-full hover:bg-gray-800"
              >
                <MoreHorizontal size={20} />
              </button>
              <AnimatePresence>
                {openMenuId === post._id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-32 bg-gray-800 rounded-md shadow-lg py-1 z-20 origin-top-right"
                  >
                    <button
                      onClick={() => {
                        openEditPostModal(post);
                        handleToggleMenu(null); // Close menu
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 w-full text-left"
                    >
                      <Edit size={16} className="mr-2" /> Edit
                    </button>
                    
                    <button
                      onClick={() => {
                        console.log("Post:", post);

                        handleDeletePost(post._id);
                        handleToggleMenu(null); // Close menu
                      }}
                      className="flex items-center px-4 py-2 text-sm text-red-400 hover:bg-gray-700 w-full text-left"
                    >
                      <Trash2 size={16} className="mr-2" /> Delete
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
        {/* Post Content */}
        <p className="whitespace-pre-line text-gray-300 text-sm leading-relaxed mb-3">
          {post.content}
        </p>
        {post.image && (
          <img
            src={post.image}
            alt="Post content"
            className="rounded-lg mt-2 w-full object-cover"
          />
        )}
        {/* Post Actions */}
        <div className="flex items-center justify-between pt-3 text-gray-400">
          <div className="flex items-center space-x-5">
            <button
              onClick={() => handleToggleLike(post._id)}
              className="flex items-center space-x-1.5 group"
            >
              <Heart
                size={22}
                className={`group-hover:text-red-500 transition-colors ${
                  post.likes?.includes(currentUserId)
                    ? "text-red-500 fill-current"
                    : ""
                }`}
              />
              <span className="text-xs font-semibold">
                {post.likes?.length || 0}
              </span>
            </button>
            <button
              onClick={() => handleToggleCommentSection(post._id)}
              className="flex items-center space-x-1.5 group"
            >
              <MessageCircle
                size={22}
                className="group-hover:text-blue-400 transition-colors"
              />
              <span className="text-xs font-semibold">
                {post.comments?.length || 0}
              </span>
            </button>
            <button onClick={() => handleRepost(post._id)} className="group">
              <Repeat2
                size={22}
                className="group-hover:text-green-400 transition-colors"
              />
            </button>
            <button onClick={() => handleBookmarkPost(post._id)} className="group">
              <Bookmark
                size={22}
                className="group-hover:text-yellow-400 transition-colors"
              />
            </button>
          </div>
        </div>
      </div>
      {/* Comment Section */}
      <AnimatePresence>
        {expandedPostId === post._id && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-800 px-4 pt-3 pb-2">
              {/* Comment Input */}
              <div className="flex items-center gap-2 mb-4">
                <img
                  src={currentUser?.avatar || `https://i.pravatar.cc/150?u=${currentUserId}`}
                  alt="Your avatar"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1 flex items-center bg-[#1a1a1a] rounded-full">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={commentInputs[post._id] || ""}
                    onChange={(e) => handleCommentInputChange(post._id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddComment(post._id);
                      }
                    }}
                    className="w-full bg-transparent px-4 py-2 text-sm focus:outline-none"
                  />
                  <button
                    onClick={() => handleAddComment(post._id)}
                    disabled={!commentInputs[post._id]?.trim()}
                    className="p-2 text-purple-500 hover:text-purple-400 disabled:text-gray-600 disabled:cursor-not-allowed"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
              {/* Comments List */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {post.comments && post.comments.length > 0 ? (
                  post.comments.map((comment) => (
                    <div key={comment._id} className="flex items-start gap-2">
                      <img
                        src={comment.user?.avatar || `https://i.pravatar.cc/150?u=${comment.user?._id}`}
                        alt={comment.user?.username}
                        className="w-8 h-8 rounded-full object-cover mt-1"
                      />
                      <div className="flex-1 bg-gray-800/50 rounded-lg p-2">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-semibold text-white">
                            {/* {comment.user?.username || "Anonymous"} */}
                           {comment.user?.username ? comment.user?.username : 'Anonymous'}
                          </p>
                          {comment.user?._id === currentUserId && (
                            <button
                              onClick={() => handleDeleteComment(post._id, comment._id)}
                              className="text-red-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-700"
                              title="Delete comment"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-300">{comment.text}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 text-center py-2">
                    No comments yet. Be the first to comment!
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
};

export default PostCard;
