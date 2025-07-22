import React, { useState, useEffect } from "react";
import MobileNavbar from "../components/Navbar";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Settings, LogOut, X, Camera } from "lucide-react";

const BASE_URL = process.env.REACT_APP_BACKEND_BASE_API_URL;

// Helper component for profile stats
const StatItem = ({ count, label }) => (
  <div className="text-center">
    <p className="text-xl font-bold">{count}</p>
    <p className="text-xs text-gray-400">{label}</p>
  </div>
);

// Helper component for form fields
const FormInput = ({ id, label, value, onChange, type = "text", rows = 1 }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
      {label}
    </label>
    {type === "textarea" ? (
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
    ) : (
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
    )}
  </div>
);

const FormSelect = ({ id, label, value, onChange, children }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
      {label}
    </label>
    <select
      id={id}
      value={value}
      onChange={onChange}
      className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
    >
      {children}
    </select>
  </div>
);

export default function ProfilePage() {
  const { id } = useParams(); // if provided, viewing another user's profile
  const navigate = useNavigate();
  const localUserId = localStorage.getItem("userId");

  const [profile, setProfile] = useState({
    username: "",
    bio: "",
    avatar: "",
    status: "",
    followers: [],
    friends: [],
    level: "",
    relationshipStatus: "single",
    gender: "other",
  });
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const isSelf = !id || id === localUserId;
  const isFriend = profile.friends && profile.friends.includes(localUserId);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        // If id is provided and not self, fetch that user's profile; otherwise fetch your own profile via /me
        const endpoint = id && !isSelf 
          ? `${BASE_URL}/api/users/${id}` 
          : `${BASE_URL}/api/users/me`;
        const res = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data;
        setProfile(prev => ({
          ...prev,
          ...data,
          followers: data.followers || [],
          friends: data.friends || [],
        }));
      } catch (err) {
        if (err.response?.status === 401) {
          navigate("/login");
        }
        setError(err.response?.data?.message || "Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id, isSelf, navigate]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setProfile((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const token = localStorage.getItem("token");

    const profileUpdateData = {
      bio: profile.bio,
      status: profile.status,
      relationshipStatus: profile.relationshipStatus,
      gender: profile.gender,
      avatar: profile.avatar,
    };
    try {
      const res = await axios.put(`${BASE_URL}/api/users/me`, profileUpdateData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = res.data;
      setProfile(prev => ({ ...prev, ...data }));
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // New functionality: "Make Friend"
  const handleMakeFriend = async () => {
    setError(null);
    const token = localStorage.getItem("token");
    try {
      await axios.post(`${BASE_URL}/api/users/friends`, 
        { friendId: profile._id }, // Send the profile id as friendId.
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update local profile friends list to include the current user id.
      setProfile(prev => ({ ...prev, friends: [...prev.friends, localUserId] }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to make friend");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  if (loading && !profile.username) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400">Loading Profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between p-4 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <button onClick={handleLogout} className="p-2 -ml-2 text-red-500 hover:text-red-400">
          <LogOut size={24} />
        </button>
        <h1 className="text-lg font-bold">{profile.username}</h1>
        {isSelf && (
          <button onClick={() => setEditing(true)} className="p-2 -mr-2 text-gray-300 hover:text-white">
            <Settings size={24} />
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="pt-4 pb-24">
        {/* Profile Info */}
        <section className="p-4">
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative">
              <img
                src={profile.avatar || `https://i.pravatar.cc/150?u=${profile._id}`}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-800"
              />
              {isSelf && (
                <button onClick={() => setEditing(true)} className="absolute bottom-0 right-0 bg-purple-600 p-2 rounded-full border-2 border-black">
                  <Camera size={16} />
                </button>
              )}
            </div>
            <div className="flex-1 grid grid-cols-3 gap-2">
              <StatItem count={profile.followers.length} label="Followers" />
              <StatItem count={profile.friends.length} label="Friends" />
              <StatItem count={0} label="Posts" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold">{profile.username}</h2>
            <p className="text-sm text-purple-400 capitalize">{profile.level || "Newbie"}</p>
            <p className="text-gray-300 mt-2 text-sm">{profile.bio || "No bio yet."}</p>
            <p className="text-gray-500 mt-1 text-xs italic">
              "{profile.status || "Hey there! I'm using Arotu."}"
            </p>
          </div>
          {/* If viewing someone else's profile and you are not already friends, show "Make Friend" */}
          {!isSelf && !isFriend && (
            <button onClick={handleMakeFriend} className="mt-4 w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition">
              Make Friend
            </button>
          )}
          {error && <p className="text-red-500 mt-2">{error}</p>}
          {isSelf && (
            <button onClick={() => setEditing(true)} className="mt-4 w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 rounded-lg transition-colors">
              Edit Profile
            </button>
          )}
        </section>

        {/* User's Posts/Content Tabs would go here */}
        <section className="border-t border-gray-800 mt-4">
          <div className="text-center py-20">
            <p className="text-gray-500">Your posts will appear here.</p>
          </div>
        </section>
      </main>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {editing && isSelf && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 50, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 50, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#1c1c1c] p-6 rounded-2xl shadow-lg border border-gray-700"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Edit Profile</h2>
                <button onClick={() => setEditing(false)} className="p-1 rounded-full hover:bg-gray-700">
                  <X size={20} />
                </button>
              </div>
              {error && <p className="text-red-500 text-center mb-4">{error}</p>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <FormInput id="avatar" label="Avatar URL" value={profile.avatar} onChange={handleChange} />
                <FormInput id="bio" label="Bio" value={profile.bio} onChange={handleChange} type="textarea" rows={3} />
                <FormInput id="status" label="Status" value={profile.status} onChange={handleChange} />
                <div className="grid grid-cols-2 gap-4">
                  <FormSelect id="relationshipStatus" label="Relationship" value={profile.relationshipStatus} onChange={handleChange}>
                    <option value="single">Single</option>
                    <option value="taken">Taken</option>
                    <option value="complicated">It's Complicated</option>
                  </FormSelect>
                  <FormSelect id="gender" label="Gender" value={profile.gender} onChange={handleChange}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </FormSelect>
                </div>
                <div className="flex justify-end items-center pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold rounded-md hover:opacity-90 transition disabled:opacity-50"
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <MobileNavbar />
    </div>
  );
}
