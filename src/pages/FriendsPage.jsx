import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import MobileNavbar, { TopHeader } from '../components/Navbar';
import { UserX, MessageSquare } from 'lucide-react';

const BASE_URL = process.env.REACT_APP_BACKEND_BASE_API_URL;

export default function FriendsPage() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFriends = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const res = await axios.get(`${BASE_URL}/api/users/friends`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFriends(res.data);
      } catch (err) {
        setError('Failed to fetch friends list.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [navigate]);

  const handleRemoveFriend = async (friendId) => {
    // This is a placeholder for an "unfriend" API call.
    // You would need a backend endpoint like `DELETE /api/users/friends/:friendId`
    alert(`Unfriending user ${friendId}. API endpoint not implemented.`);
    // To make it work visually for now:
    // setFriends(prev => prev.filter(friend => friend._id !== friendId));
  };

  return (
    <div className="bg-black text-gray-100 font-sans min-h-screen">
      <TopHeader />
      <main className="pt-20 pb-24 px-4">
        <h1 className="text-2xl font-bold mb-6 text-center">My Padi Dem</h1>

        {loading && <p className="text-center text-gray-400">Loading friends...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        {!loading && !error && friends.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500">You haven't added any friends yet.</p>
            <Link to="/home" className="mt-4 inline-block text-purple-400 hover:underline">
              Find people to connect with
            </Link>
          </div>
        )}

        {!loading && !error && (
          <motion.ul className="space-y-3 max-w-2xl mx-auto">
            {friends.map((friend, i) => (
              <motion.li
                key={friend._id}
                className="flex items-center justify-between bg-[#1c1c1c] p-3 rounded-lg border border-gray-800"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Link to={`/profile/${friend._id}`} className="flex items-center gap-4 flex-1">
                  <img
                    src={friend.avatar || `https://i.pravatar.cc/150?u=${friend._id}`}
                    alt={friend.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold">{friend.username}</p>
                    <p className="text-xs text-gray-400 capitalize">{friend.status || 'Available'}</p>
                  </div>
                </Link>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </main>
      <MobileNavbar />
    </div>
  );
}

