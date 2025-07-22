import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    usernameOrEmail: "",
    password: "",
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

    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_BASE_API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json(); // { token: ..., user: { _id: "xxxx", ... } }

      if (!res.ok) {
        throw new Error(data.message || "Failed to login");
      }
     
      const { token, user } = data; // Destructure token and user from data

      // The user object from backend likely has `_id`.
      // Storing the full user object and the userId separately for convenience.
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user)); // Store the whole user object.
      localStorage.setItem('userId', user._id); // Store userId for quick access.

      console.log("Login successful:", data);
      setLoading(false);
      navigate("/home"); // Navigate to home page after successful login
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div
      className="text-gray-100 font-sans min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url('/arotu_login_bg.jpg')` }}
    >
      <div className="min-h-screen flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="relative w-full max-w-md bg-[#262626] p-8 rounded-2xl shadow-lg border border-gray-700/50">
          <Link
            to="/"
            className="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors"
            aria-label="Go back to Welcome page"
          >
            <ArrowLeft size={24} />
          </Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
          My Guy How Far?
        </h1>
        <p className="text-center text-gray-400 mb-6">Login for here.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="usernameOrEmail" className="block text-sm font-medium text-gray-300 mb-2">
              Username or Email
            </label>
            <input
              type="text"
              id="usernameOrEmail"
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-600 rounded-lg focus:ring-orange-500 focus:border-orange-500 transition"
              placeholder="e.g., User001@ or user@example.com"
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-600 rounded-lg focus:ring-orange-500 focus:border-orange-500 transition"
              placeholder="••••••••"
              onChange={handleChange}
              required
            />
          </div>
          <div className="flex items-center justify-end text-sm">
            <Link to="/forgot-password" className="text-orange-400 hover:underline">
              Forgot Password?
            </Link>
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button disabled={loading} className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-6">
          You no get account?{" "}
          <Link to="/register" className="font-medium text-orange-400 hover:underline">
            Register for here
          </Link>
        </p>
        </div>
      </div>
    </div>
  );
}