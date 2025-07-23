import React, { useState, useEffect } from "react";
import MobileNavbar from "../components/Navbar";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Settings,
  LogOut,
  X,
  Camera,
  MapPin,
  Heart,
  Users2,
  Binoculars,
  Award,
  Quote,
} from "lucide-react";

const BASE_URL = process.env.REACT_APP_BACKEND_BASE_API_URL;

// Helper component for profile stats
const StatItem = ({ count, label }) => (
  <div className="text-center">
    <p className="text-xl font-bold">{count}</p>
    <p className="text-xs text-gray-400">{label}</p>
  </div>
);

// Helper component for profile details with icons
const ProfileDetailItem = ({ icon, text, label }) => (
  <div className="flex items-center space-x-3 bg-[#1c1c1c] p-3 rounded-lg border border-gray-800">
    <div className="text-purple-400">{icon}</div>
    <div>
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-white capitalize">{text}</p>
    </div>
  </div>
);

// Helper component for form fields
const FormInput = ({ id, label, value, onChange, type = "text", rows = 1, placeholder = "" }) => (
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
        placeholder={placeholder}
        className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
    ) : (
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
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
  
  const [user, setUser] = useState({
    username: "",
    bio: "",
    avatar: "",
    status: "",
    followers: [],
    friends: [],
    level: "newbie",
    relationshipStatus: "single",
    gender: "other",
    location: "",
    phone: "",
    lookingFor: "friendship",
    roomNickname: "",
  });
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("main");

  const isSelf = !id || id === localUserId;
  const isFriend = user.friends && user.friends.includes(localUserId);

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
        setUser(prev => ({
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
    setUser((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const token = localStorage.getItem("token");

    const profileUpdateData = {
      bio: user.bio,
      status: user.status,
      relationshipStatus: user.relationshipStatus,
      gender: user.gender,
      avatar: user.avatar,
      location: user.location,
      phone: user.phone,
      lookingFor: user.lookingFor,
      level: user.level,
      roomNickname: user.roomNickname,
    };
    try {
      const res = await axios.put(`${BASE_URL}/api/users/me`, profileUpdateData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = res.data;
      setUser(prev => ({ ...prev, ...data }));
      setEditing(false);
      setActiveTab("main"); // Reset tab on successful save
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
        { friendId: user._id }, // Send the user id as friendId.
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update local user's friends list to include the current user id.
      setUser(prev => ({ ...prev, friends: [...prev.friends, localUserId] }));
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

  if (loading && !user.username) {
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
        <h1 className="text-lg font-bold">{user.username}</h1>
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
                src={user.avatar || `https://i.pravatar.cc/150?u=${user._id}`}
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
              <StatItem count={user.followers.length} label="Followers" />
              <StatItem count={user.friends.length} label="Friends" />
              <StatItem count={0} label="Posts" />
            </div>
          </div>
          <div className="text-center mt-4">
            <h2 className="text-2xl font-bold">{user.username}</h2>
            <div className="flex items-center justify-center gap-2 mt-1 text-purple-400">
              <Award size={16} />
              <p className="text-sm font-semibold capitalize">{user.level || "Newbie"}</p>
            </div>
          </div>

          {/* Status */}
          <div className="my-6 p-4 bg-gradient-to-r from-gray-800/50 to-gray-900/20 rounded-xl text-center relative border border-gray-700 shadow-inner">
            <Quote className="absolute top-3 left-3 text-gray-600" size={20} />
            <p className="text-lg italic text-gray-200">
              {user.status || "Hey there! I'm using Arotu."}
            </p>
            <Quote className="absolute bottom-3 right-3 text-gray-600" size={20} transform="scale(-1, -1)" />
          </div>

          {/* Bio */}
          {user.bio && (
            <div className="my-4">
              <h3 className="font-semibold text-gray-400 mb-2 text-sm uppercase tracking-wider">About Me</h3>
              <p className="text-gray-300 text-sm leading-relaxed bg-[#1c1c1c] p-3 rounded-lg border border-gray-800">{user.bio}</p>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            {user.location && <ProfileDetailItem icon={<MapPin size={20} />} label="From" text={user.location} />}
            {user.relationshipStatus && <ProfileDetailItem icon={<Heart size={20} />} label="Relationship" text={user.relationshipStatus} />}
            {user.gender && <ProfileDetailItem icon={<Users2 size={20} />} label="Gender" text={user.gender} />}
            {user.lookingFor && <ProfileDetailItem icon={<Binoculars size={20} />} label="Looking For" text={user.lookingFor} />}
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
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">Edit Profile</h2>
                <button onClick={() => { setEditing(false); setActiveTab("main"); }} className="p-1 -mt-1 -mr-1 rounded-full hover:bg-gray-700">
                  <X size={20} />
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-gray-700 mb-6">
                {[
                  { id: "main", label: "Main Info" },
                  { id: "details", label: "Details" },
                  { id: "prefs", label: "Preferences" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`capitalize py-2 px-4 text-sm font-medium transition-colors focus:outline-none ${
                      activeTab === tab.id
                        ? "border-b-2 border-purple-500 text-white"
                        : "text-gray-400 hover:text-white border-b-2 border-transparent"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {error && <p className="text-red-500 text-center mb-4">{error}</p>}
              <form onSubmit={handleSubmit}>
                <div className="min-h-[320px]"> {/* Fixed height to prevent layout shifts */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {activeTab === 'main' && (
                        <>
                          <FormInput id="avatar" label="Avatar URL" value={user.avatar} onChange={handleChange} placeholder="https://example.com/avatar.png" />
                          <FormInput id="bio" label="Bio" value={user.bio} onChange={handleChange} type="textarea" rows={3} placeholder="Tell us about yourself..." />
                          <FormInput id="status" label="Status" value={user.status} onChange={handleChange} placeholder="What's on your mind?" />
                        </>
                      )}
                      {activeTab === 'details' && (
                        <>
                          <FormInput id="location" label="Location" value={user.location} onChange={handleChange} placeholder="e.g., Lagos, Nigeria" />
                          <FormInput id="phone" label="Phone" value={user.phone} onChange={handleChange} type="tel" placeholder="+234..." />
                          <div className="grid grid-cols-2 gap-4 pt-2">
                            <FormSelect id="gender" label="Gender" value={user.gender} onChange={handleChange}>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </FormSelect>
                            <FormSelect id="relationshipStatus" label="Relationship" value={user.relationshipStatus} onChange={handleChange}>
                              <option value="single">Single</option>
                              <option value="taken">Taken</option>
                              <option value="complicated">It's Complicated</option>
                            </FormSelect>
                          </div>
                        </>
                      )}
                      {activeTab === 'prefs' && (
                        <>
                          <FormInput id="roomNickname" label="Room Nickname" value={user.roomNickname} onChange={handleChange} placeholder="Your nickname in chat rooms" />
                          <div className="grid grid-cols-2 gap-4 pt-2">
                            <FormSelect id="lookingFor" label="Looking For" value={user.lookingFor} onChange={handleChange}>
                              <option value="friendship">Friendship</option>
                              <option value="dating">Dating</option>
                              <option value="networking">Networking</option>
                              <option value="not-looking">Not Looking</option>
                            </FormSelect>
                            <FormSelect id="level" label="Level" value={user.level} onChange={handleChange}>
                              <option value="jjc">JJC</option>
                              <option value="newbie">Newbie</option>
                              <option value="intermediate">Intermediate</option>
                              <option value="pro">Pro</option>
                              <option value="expert">Expert</option>
                            </FormSelect>
                          </div>
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div className="flex justify-end items-center pt-4 mt-4 border-t border-gray-700/50">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold rounded-md hover:opacity-90 transition disabled:opacity-50"
                  >
                    {loading ? "Saving..." : "Save Changes"}
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
