import React, { useState, useEffect } from "react";
import { TopHeader } from "../components/Navbar"; // Import TopHeader
import MobileNavbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const [profile, setProfile] = useState({ username: "", bio: "", avatar: "" });
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch profile on mount using GET /me
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(
          `${process.env.REACT_APP_BACKEND_BASE_API_URL}/api/users/me`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        setProfile({
          username: data.username || "",
          bio: data.bio || "",
          avatar: data.avatar || "",
        });
      } catch (err) {
        setError(err.message);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_BASE_API_URL}/api/users/me`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(profile),
        }
      );
      if (!res.ok) throw new Error("Failed to update profile");
      const data = await res.json();
      setProfile({
        username: data.username || "",
        bio: data.bio || "",
        avatar: data.avatar || "",
      });
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans">
      <TopHeader />
      <div className="container mx-auto pt-16 pb-24">
        <div className="max-w-xl mx-auto bg-[#262626] p-6 rounded-lg shadow-lg border border-gray-800">
          <h1 className="text-3xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">
            My Profile
          </h1>
          {error && (
            <p className="text-red-500 text-center mb-4">{error}</p>
          )}
          <div className="flex justify-center mb-6">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center">
                <span className="text-2xl">?</span>
              </div>
            )}
          </div>
          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={profile.username}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="bio"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows="4"
                  value={profile.bio}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>
              <div>
                <label
                  htmlFor="avatar"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Avatar URL
                </label>
                <input
                  type="url"
                  id="avatar"
                  name="avatar"
                  value={profile.avatar}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-black font-bold rounded-md hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <p>
                <span className="font-semibold">Username: </span>
                {profile.username || "N/A"}
              </p>
              <p>
                <span className="font-semibold">Bio: </span>
                {profile.bio || "N/A"}
              </p>
              <p>
                <span className="font-semibold">Avatar URL: </span>
                {profile.avatar || "N/A"}
              </p>
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-black font-bold rounded-md hover:opacity-90 transition"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <MobileNavbar />
    </div>
  );
}