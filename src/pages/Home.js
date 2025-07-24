// src/pages/HomePage.js (Updated)
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MobileNavbar, { TopHeader } from "../components/Navbar";
import { motion } from "framer-motion";
import axios from "axios";

// Import the new components
import PostCategories from "../components/PostCategories";
import CreatePostTrigger from "../components/CreatePostTrigger";
import CreatePostModal from "../components/CreatePostModal";
import EditPostModal from "../components/EditPostModal";
import SearchResultsModal from "../components/SearchResultsModal";
import PostCard from "../components/PostCard";

const BASE_URL = process.env.REACT_APP_BACKEND_BASE_API_URL;
const navCategories = ["For You", "Following", "My Posts"];

export default function HomePage() {
  const [posts, setPosts] = useState([]);
  const [activeCategory, setActiveCategory] = useState("For You");
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
  const currentUserId = currentUser?._id || "defaultUserId"; // Fallback for demo purposes
  if (!currentUserId) {
    console.error("No current user found, redirecting to login.");
    // <Navigate to="/login" replace />;
  }
  if (!currentUser) {
    console.error("No current user found, redirecting to login.");
    // <Navigate to="/login" replace />;
  }
  // Get token from localStorage for authenticated requests
  const token = localStorage.getItem("token");

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
  }, [activeCategory, token, navigate]);

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
        `${BASE_URL}/api/posts/${editPostData._id}/settings`,
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
    if (!window.confirm("Are you sure you want to delete this post?" )) return;

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
        <PostCategories
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          searchQuery={searchQuery}
          handleSearchChange={handleSearchChange}
          handleSearchSubmit={handleSearchSubmit}
          navCategories={navCategories}
        />

        <CreatePostTrigger
          setIsCreatingPost={setIsCreatingPost}
          currentUser={currentUser}
          currentUserId={currentUserId}
        />

        <CreatePostModal
          isCreatingPost={isCreatingPost}
          setIsCreatingPost={setIsCreatingPost}
          newPostData={newPostData}
          handleNewPostChange={handleNewPostChange}
          handleCreatePost={handleCreatePost}
          postLoading={postLoading}
          error={error}
        />

        <EditPostModal
          isEditingPost={isEditingPost}
          setIsEditingPost={setIsEditingPost}
          editPostData={editPostData}
          handleEditPostChange={handleEditPostChange}
          handleUpdatePost={handleUpdatePost}
          postLoading={postLoading}
          error={error}
        />

        <SearchResultsModal
          showSearchModal={showSearchModal}
          setShowSearchModal={setShowSearchModal}
          searchQuery={searchQuery}
          searchResults={searchResults}
        />

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
            posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                currentUserId={currentUserId}
                currentUser={currentUser} // Pass currentUser for comment input avatar
                handleFollowUser={handleFollowUser}
                handleToggleLike={handleToggleLike}
                handleToggleCommentSection={handleToggleCommentSection}
                handleRepost={handleRepost}
                handleBookmarkPost={handleBookmarkPost}
                openEditPostModal={openEditPostModal}
                handleDeletePost={handleDeletePost}
                expandedPostId={expandedPostId}
                commentInputs={commentInputs}
                handleCommentInputChange={handleCommentInputChange}
                handleAddComment={handleAddComment}
                handleDeleteComment={handleDeleteComment}
                openMenuId={openMenuId}
                handleToggleMenu={handleToggleMenu}
              />
            ))}
        </div>
      </main>
      <MobileNavbar />
    </div>
  );
}
