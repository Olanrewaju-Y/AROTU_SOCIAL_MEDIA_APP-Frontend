import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import MobileNavbar, { TopHeader } from "../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Send,
  MoreHorizontal,
  UserPlus,
  Image as ImageIcon,
  Globe,
  Users,
  UserCheck,
  X,
  Bookmark, // Added for bookmarking
  Repeat2, // Added for reposting
  Search, // Added for search
  Edit, // Added for editing
  Trash2, // Added for deleting
} from "lucide-react";
import axios from "axios";

const BASE_URL = process.env.REACT_APP_BACKEND_BASE_API_URL;
// Adjusted categories to better map to your endpoints
const navCategories = ["For You", "Following", "My Posts"];

export default function HomePage() {
  const [posts, setPosts] = useState([]);
  const [activeCategory, setActiveCategory] = useState("For You"); // 'For You' maps to getAllPosts
  const [loading, setLoading] = useState(true);
  const [postLoading, setPostLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // State for post overflow menu
  const [openMenuId, setOpenMenuId] = useState(null);

  // State for comment sections
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});

  // State for the new post creation modal
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [newPostData, setNewPostData] = useState({
    content: "",
    image: "",
    visibility: "public",
  });

  // State for edit post modal
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editPostData, setEditPostData] = useState({
    _id: null,
    content: "",
    image: "",
    visibility: "public",
  });

  const currentUser = JSON.parse(localStorage.getItem("user"));
  const currentUserId = localStorage.getItem("userId");
  const token = localStorage.getItem("token"); // Get token once

  const navigate = useNavigate();

  // Helper to get authorization headers
  const getAuthHeaders = () => {
    if (!token) {
      navigate("/login");
      return null;
    }
    return { Authorization: `Bearer ${token}` };
  };

  // Fetch posts based on active category
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        let endpoint = "";
        let headers = {};

        if (activeCategory === "For You") {
          endpoint = `${BASE_URL}/api/posts/all-posts`; // Public feed
        } else if (activeCategory === "Following") {
          endpoint = `${BASE_URL}/api/posts/friends-posts`; // Friends' posts
          headers = getAuthHeaders();
          if (!headers) return; // Stop if not authenticated
        } else if (activeCategory === "My Posts") {
          endpoint = `${BASE_URL}/api/posts/my-posts`; // User's own posts
          headers = getAuthHeaders();
          if (!headers) return; // Stop if not authenticated
        }

        const res = await axios.get(endpoint, { headers });
        setPosts(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch posts.");
        console.error("Error fetching posts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [activeCategory, token, navigate]); // Depend on token and navigate for re-fetching or redirection

  // Handle changes for new post form
  const handleNewPostChange = (e) => {
    const { id, value } = e.target;
    setNewPostData({ ...newPostData, [id]: value });
  };

  // Handle changes for edit post form
  const handleEditPostChange = (e) => {
    const { id, value } = e.target;
    setEditPostData({ ...editPostData, [id]: value });
  };

  // Create new post using POST '/api/posts/'
  const handleCreatePost = async () => {
    if (!newPostData.content.trim()) {
      setError("Post content cannot be empty.");
      return;
    }
    if (newPostData.content.length > 300) {
      setError("Content cannot exceed 300 characters.");
      return;
    }

    const headers = getAuthHeaders();
    if (!headers) return;

    setPostLoading(true);
    setError(null);
    try {
      const res = await axios.post(
        `${BASE_URL}/api/posts/`,
        newPostData,
        { headers }
      );
      setPosts((prev) => [res.data, ...prev]);
      setNewPostData({ content: "", image: "", visibility: "public" });
      setIsCreatingPost(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create post");
      console.error("Error creating post:", err);
    } finally {
      setPostLoading(false);
    }
  };

  // Open edit post modal and populate with current post data
  const openEditPostModal = (post) => {
    setEditPostData({
      _id: post._id,
      content: post.content,
      image: post.image || "",
      visibility: post.visibility || "public",
    });
    setIsEditingPost(true);
  };

  // Update a post using PUT '/posts/:id'
  const handleUpdatePost = async () => {
    if (!editPostData.content.trim()) {
      setError("Post content cannot be empty.");
      return;
    }
    if (editPostData.content.length > 300) {
      setError("Content cannot exceed 300 characters.");
      return;
    }

    const headers = getAuthHeaders();
    if (!headers) return;

    setPostLoading(true);
    setError(null);
    try {
      const res = await axios.put(
        `${BASE_URL}/api/posts/${editPostData._id}`,
        {
          content: editPostData.content,
          image: editPostData.image,
          visibility: editPostData.visibility,
        },
        { headers }
      );
      setPosts((prev) =>
        prev.map((post) => (post._id === editPostData._id ? res.data : post))
      );
      setIsEditingPost(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update post");
      console.error("Error updating post:", err);
    } finally {
      setPostLoading(false);
    }
  };

  // Delete a post using DELETE '/posts/:id'
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      await axios.delete(`${BASE_URL}/api/posts/${postId}`, { headers });
      setPosts((prev) => prev.filter((post) => post._id !== postId));
      alert("Post deleted successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete post");
      console.error("Error deleting post:", err);
    }
  };

  // Toggle like using PATCH '/posts/:id/like'
  const handleToggleLike = async (postId) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const res = await axios.patch(
        `${BASE_URL}/api/posts/${postId}/like`,
        {},
        { headers }
      );
      setPosts((prev) =>
        prev.map((post) => (post._id === postId ? res.data : post))
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to toggle like");
      console.error("Error toggling like:", err);
    }
  };

  // Repost functionality
  const handleRepost = async (postId) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const res = await axios.post(
        `${BASE_URL}/api/posts/${postId}/repost`,
        {},
        { headers }
      );
      // Assuming repost returns the new reposted post, add it to the feed
      setPosts((prev) => [res.data, ...prev]);
      alert("Post reposted successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to repost.");
      console.error("Error reposting:", err);
    }
  };

  // Bookmark post
  const handleBookmarkPost = async (postId) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      await axios.post(
        `${BASE_URL}/api/posts/${postId}/bookmark`,
        {},
        { headers }
      );
      alert("Post bookmarked!");
      // Optionally update the post state to reflect it's bookmarked if your API provides this in the post object
    } catch (err) {
      setError(err.response?.data?.message || "Failed to bookmark post.");
      console.error("Error bookmarking:", err);
    }
  };

  // Toggle post overflow menu
  const handleToggleMenu = (postId) => {
    setOpenMenuId((prevId) => (prevId === postId ? null : postId));
  };

  // --- Comment Handlers ---
  const handleToggleCommentSection = (postId) => {
    setExpandedPostId((prevId) => (prevId === postId ? null : postId));
    // Fetch comments if section is being expanded and not already fetched or is stale
    if (expandedPostId !== postId) {
      fetchCommentsForPost(postId);
    }
  };

  const handleCommentInputChange = (postId, value) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: value }));
  };

  // Fetch comments for a specific post using GET '/posts/:id/comments'
  const fetchCommentsForPost = async (postId) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const res = await axios.get(`${BASE_URL}/api/posts/${postId}/comments`, {
        headers,
      });
      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId ? { ...post, comments: res.data } : post
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch comments.");
      console.error("Error fetching comments:", err);
    }
  };

  // Add comment using POST '/posts/:id/comment'
  const handleAddComment = async (postId) => {
    const commentText = commentInputs[postId] || "";
    if (!commentText.trim()) return;

    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const res = await axios.post(
        `${BASE_URL}/api/posts/${postId}/comment`,
        { text: commentText },
        { headers }
      );
      setPosts((prev) =>
        prev.map((post) => (post._id === postId ? res.data : post))
      );
      handleCommentInputChange(postId, ""); // Clear input after submission
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add comment");
      console.error("Error adding comment:", err);
    }
  };

  // Delete comment using DELETE '/posts/:id/comment/:commentId'
  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;

    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      await axios.delete(
        `${BASE_URL}/api/posts/${postId}/comment/${commentId}`,
        { headers }
      );
      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId
            ? {
                ...post,
                comments: post.comments.filter(
                  (comment) => comment._id !== commentId
                ),
              }
            : post
        )
      );
      alert("Comment deleted successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete comment.");
      console.error("Error deleting comment:", err);
    }
  };

  // Follow a user – this still assumes a separate /users/follow endpoint
  const handleFollowUser = async (userIdToFollow) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      await axios.post(
        `${BASE_URL}/users/follow/${userIdToFollow}`, // Assuming this endpoint exists
        {},
        { headers }
      );
      alert("User followed successfully");
      // Optionally update UI to mark that user as followed, e.g., refresh relevant posts
    } catch (err) {
      setError(err.response?.data?.message || "Failed to follow user");
      console.error("Error following user:", err);
    }
  };

  // Search posts
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchModal(false);
      return;
    }

    const headers = getAuthHeaders();
    if (!headers) return;

    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `${BASE_URL}/api/posts/search?q=${encodeURIComponent(searchQuery)}`,
        { headers }
      );
      setSearchResults(res.data);
      setShowSearchModal(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to search posts.");
      console.error("Error searching posts:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black text-gray-100 font-sans min-h-screen">
      <TopHeader />
      <main className="pt-16 pb-20">
        <section className="sticky top-16 z-40 bg-black/80 backdrop-blur-md border-b border-gray-800">
          <div className="flex justify-around items-center h-12 text-sm font-semibold text-gray-400">
            {navCategories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`py-2 px-3 border-b-2 transition-all duration-300 ${
                  activeCategory === category
                    ? "border-purple-500 text-white"
                    : "border-transparent hover:text-white"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="p-3 border-t border-gray-800">
            <div className="relative">
              <input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-gray-600 rounded-full focus:ring-purple-500 focus:border-purple-500 transition"
              />
              <Search
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <button type="submit" className="sr-only">Search</button>
            </div>
          </form>
        </section>

        {/* Create Post Trigger */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <img
              src={
                currentUser?.avatar ||
                `https://i.pravatar.cc/150?u=${currentUserId}`
              }
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

        {/* Create Post Modal */}
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
                      newPostData.content.length > 300
                        ? "border-red-500"
                        : "border-gray-600"
                    }`}
                  />
                  <p
                    className={`text-sm text-right ${
                      newPostData.content.length > 300
                        ? "text-red-500"
                        : "text-gray-400"
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

        {/* Edit Post Modal */}
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
                      editPostData.content.length > 300
                        ? "border-red-500"
                        : "border-gray-600"
                    }`}
                  />
                  <p
                    className={`text-sm text-right ${
                      editPostData.content.length > 300
                        ? "text-red-500"
                        : "text-gray-400"
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

        {/* Search Results Modal */}
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
                          {/* Add other actions like repost, bookmark for search results if desired */}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* Feed Posts */}
        <div className="mt-1">
          {loading && (
            <p className="text-center text-gray-400 py-10">Loading posts...</p>
          )}
          {error && !isCreatingPost && !showSearchModal && (
            <p className="text-center text-red-500 py-10">{error}</p>
          )}
          {!loading && !error && posts.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-400">
                No posts yet. Be the first to share!
              </p>
              <button
                onClick={() => setIsCreatingPost(true)}
                className="mt-4 inline-block bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition"
              >
                Create Post
              </button>
            </div>
          )}
          {!loading &&
            posts.map((post, i) => (
              <motion.article
                key={post._id || i}
                className="bg-[#121212] border-b border-gray-800"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <div className="p-4">
                  {/* Post Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <img
                        src={
                          post.user?.avatar ||
                          `https://i.pravatar.cc/150?u=${post.user?._id}`
                        }
                        alt={post.user?.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-white">
                          {post.user?.username || "Anonymous"}
                        </span>
                        <p className="text-xs text-gray-500">
                          {new Date(post.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {/* Follow Icon: Only show if the post author is not you */}
                      {post.user?._id !== currentUserId && (
                        <button
                          onClick={() => handleFollowUser(post.user?._id)} // Corrected to post.user?._id
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
                                  setOpenMenuId(null); // Close menu
                                }}
                                className="flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 w-full text-left"
                              >
                                <Edit size={16} className="mr-2" /> Edit
                              </button>
                              <button
                                onClick={() => {
                                  handleDeletePost(post._id);
                                  setOpenMenuId(null); // Close menu
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
                            src={
                              currentUser?.avatar ||
                              `https://i.pravatar.cc/150?u=${currentUserId}`
                            }
                            alt="Your avatar"
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div className="flex-1 flex items-center bg-[#1a1a1a] rounded-full">
                            <input
                              type="text"
                              placeholder="Add a comment..."
                              value={commentInputs[post._id] || ""}
                              onChange={(e) =>
                                handleCommentInputChange(post._id, e.target.value)
                              }
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
                                  src={
                                    comment.user?.avatar ||
                                    `https://i.pravatar.cc/150?u=${comment.user?._id}`
                                  }
                                  alt={comment.user?.username}
                                  className="w-8 h-8 rounded-full object-cover mt-1"
                                />
                                <div className="flex-1 bg-gray-800/50 rounded-lg p-2">
                                  <div className="flex justify-between items-center">
                                    <p className="text-sm font-semibold text-white">
                                      {comment.user?.username || "Anonymous"}
                                    </p>
                                    {comment.user?._id === currentUserId && (
                                      <button
                                        onClick={() =>
                                          handleDeleteComment(
                                            post._id,
                                            comment._id
                                          )
                                        }
                                        className="text-red-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-700"
                                        title="Delete comment"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-300">
                                    {comment.text}
                                  </p>
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
            ))}
        </div>
      </main>
      <MobileNavbar />
    </div>
  );
}