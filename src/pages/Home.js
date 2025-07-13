import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Send,
  MoreHorizontal,
  Bell,
} from "lucide-react";
import MobileNavbar from "../components/MobileNavbar";

const navCategories = ['Live', 'Follows', 'Fans', 'Family', 'myPeople'];

export default function HomePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('Follows');

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        // NOTE: You'll need to get the actual token from where you store it
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.REACT_APP_BACKEND_BASE_API_URL}/posts`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          throw new Error('Failed to fetch posts. Are you logged in?');
        }
        const data = await res.json();
        // Assuming the API returns posts in reverse chronological order
        setPosts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    // Main container with new black, purple, and blue theme
    <div className="bg-black text-gray-100 font-sans min-h-screen">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="flex justify-between items-center h-16 px-4">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">
            Arotu
          </h1>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full hover:bg-gray-800 transition-colors">
              <Bell size={22} />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-800 transition-colors">
              <Send size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Main content area with padding for fixed header and footer */}
      <main className="pt-16 pb-20">
        {/* Top Navigation Categories */}
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
        </section>

        {/* Feed Posts */}
        <div className="mt-4">
          {loading && <p className="text-center text-gray-400 py-10">Loading posts...</p>}
          {error && <p className="text-center text-red-500 py-10">{error}</p>}
          {!loading && !error && posts.map((post, i) => (
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
                    <img src={post.author?.avatar || `https://i.pravatar.cc/150?u=${post.author?._id}`} alt={post.author?.username} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <span className="font-semibold text-sm text-white">{post.author?.username || 'Anonymous'}</span>
                      <p className="text-xs text-gray-500">2h ago</p>
                    </div>
                  </div>
                  <button className="p-1 rounded-full hover:bg-gray-800">
                    <MoreHorizontal size={20} />
                  </button>
                </div>

                {/* Post Content */}
                <p className="whitespace-pre-line text-gray-300 text-sm leading-relaxed mb-3">{post.content}</p>
                {post.image && <img src={post.image} alt="Post content" className="rounded-lg mt-2 w-full object-cover" />}

                {/* Post Actions */}
                <div className="flex items-center justify-between pt-3 text-gray-400">
                  <div className="flex items-center space-x-5">
                    <button className="flex items-center space-x-1.5 group">
                      <Heart size={22} className="group-hover:text-red-500 transition-colors" />
                      <span className="text-xs font-semibold">{post.likes?.length || 0}</span>
                    </button>
                    <button className="flex items-center space-x-1.5 group">
                      <MessageCircle size={22} className="group-hover:text-blue-400 transition-colors" />
                      <span className="text-xs font-semibold">{post.comments?.length || 0}</span>
                    </button>
                    <button className="group">
                      <Send size={22} className="group-hover:text-purple-500 transition-colors" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
          {!loading && !error && posts.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-400">No posts yet. Be the first to share!</p>
              <Link to="/create-post" className="mt-4 inline-block bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition">
                Create Post
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <MobileNavbar />
    </div>
  );
}
