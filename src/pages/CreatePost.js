import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreatePostPage() {
  const [formData, setFormData] = useState({
    content: "",
    image: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // NOTE: You'll need to get the actual token from where you store it (e.g., localStorage)
    const token = localStorage.getItem("token"); // Placeholder for auth token

    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_BASE_API_URL}/posts`, {
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
      navigate("/"); // Navigate to homepage on successful post creation
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1a1a1a] text-gray-100 font-sans min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#262626] p-8 rounded-2xl shadow-lg border border-gray-700/50">
        <h1 className="text-3xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
          Create a New Post
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-2">
              What's on your mind?
            </label>
            <textarea
              id="content"
              rows="5"
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-600 rounded-lg focus:ring-orange-500 focus:border-orange-500 transition"
              placeholder="Share your thoughts with the community..."
              onChange={handleChange}
              required
            ></textarea>
          </div>
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-300 mb-2">
              Image URL (Optional)
            </label>
            <input
              type="url"
              id="image"
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-600 rounded-lg focus:ring-orange-500 focus:border-orange-500 transition"
              placeholder="https://example.com/image.png"
              onChange={handleChange}
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button disabled={loading} className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Posting..." : "Create Post"}
          </button>
        </form>
      </div>
    </div>
  );
}