import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileNavbar, { TopHeader } from "../components/Navbar";

export default function CreatePostPage({ onClose }) {
  const [formData, setFormData] = useState({
    content: "",
    image: "",
    visibility: "public", // Default visibility
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate character limit
    if (formData.content.length > 300) {
      setError("Content exceeds the maximum limit of 300 characters. Please reduce the length.");
      return;
    }

    setLoading(true);

    const token = localStorage.getItem("token"); // Retrieve token from localStorage

    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_BASE_API_URL}/api/posts/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // Add authorization header
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create post");
      }

      setLoading(false);
      // If an onClose callback is provided, call it to close the modal.
      if (onClose) {
        onClose();
      } else {
        navigate("/welcome"); // Fallback: navigate to homepage on success
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
      <div className="relative w-full max-w-lg bg-[#262626] p-8 rounded-2xl shadow-lg border border-gray-700/50">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-300 hover:text-white text-3xl font-bold"
        >
          &times;
        </button>

        <h1 className="text-3xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
          Create a New Post
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-2">
              What's on your mind? (Max 300 characters)
            </label>
            <textarea
              id="content"
              rows="5"
              value={formData.content}
              className={`w-full px-4 py-3 bg-[#1a1a1a] border ${
                formData.content.length > 300 ? "border-red-500" : "border-gray-600"
              } rounded-lg focus:ring-orange-500 focus:border-orange-500 transition`}
              placeholder="Share your thoughts with the community..."
              onChange={handleChange}
              required
            ></textarea>
            <p
              className={`text-sm mt-1 ${
                formData.content.length > 300 ? "text-red-500" : "text-gray-400"
              }`}
            >
              {formData.content.length}/300
            </p>
          </div>
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-300 mb-2">
              Image URL (Optional)
            </label>
            <input
              type="url"
              id="image"
              value={formData.image}
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-600 rounded-lg focus:ring-orange-500 focus:border-orange-500 transition"
              placeholder="https://example.com/image.png"
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="visibility" className="block text-sm font-medium text-gray-300 mb-2">
              Who can see this post?
            </label>
            <select
              id="visibility"
              value={formData.visibility}
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-600 rounded-lg focus:ring-orange-500 focus:border-orange-500 transition"
              onChange={handleChange}
            >
              <option value="public">Public</option>
              <option value="friends">Friends</option>
              <option value="followers">Followers</option>
              <option value="onlyMe">Only Me</option>
            </select>
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Posting..." : "Create Post"}
          </button>
        </form>
      </div>
    </div>
  );
}