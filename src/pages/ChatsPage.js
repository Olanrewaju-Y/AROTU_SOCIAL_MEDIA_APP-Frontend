import React, { useState, useEffect } from "react";
import { TopHeader } from "../components/Navbar";
import MobileNavbar from "../components/Navbar";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const BASE_URL = process.env.REACT_APP_BACKEND_BASE_API_URL;

// Mock conversations (replace with your API call if needed)
const mockConversations = [
  { 
    id: 1, 
    name: "Alice", 
    receiver_id: "user_1",
    messages: []
  },
  { 
    id: 2, 
    name: "Bob", 
    receiver_id: "user_2",
    messages: []
  },
  // ... add more if needed
];

function ChatsPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [newMsg, setNewMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Load conversations (could be replaced with an API call)
    setConversations(mockConversations);
  }, []);

  // Logout function: clear token and redirect
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  // Fetch private messages for selected conversation using GET /messages/private/:userId
  const handleConversationClick = async (conv) => {
    setSelectedConv(conv);
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(
        `${BASE_URL}/api/messages/private/${conv.receiver_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const updatedConv = { ...conv, messages: res.data };
      setSelectedConv(updatedConv);
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? updatedConv : c))
      );
    } catch (err) {
      console.error("Failed to fetch private messages:", err);
    }
  };

  // Send message using POST /messages/private
  const handleSendMessage = async () => {
    if (!newMsg.trim() || !selectedConv) return;
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId") || "You";
    const newMessageObj = {
      id: Date.now(), // temporary id
      user: userId,
      text: newMsg,
    };

    // Optimistically update the conversation
    const updatedConv = {
      ...selectedConv,
      messages: [...(selectedConv.messages || []), newMessageObj],
    };
    setSelectedConv(updatedConv);
    setConversations((prev) =>
      prev.map((c) => (c.id === updatedConv.id ? updatedConv : c))
    );
    setNewMsg("");

    try {
      const res = await axios.post(
        `${BASE_URL}/api/messages/private`,
        {
          receiver: selectedConv.receiver_id,
          text: newMsg,
        },
        {
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` 
          },
        }
      );
      // Optionally update messages with response data if needed
    } catch (err) {
      console.error("Failed to send private message:", err);
    }
  };

  return (
    <div className="bg-black text-gray-100 font-sans h-screen flex flex-col">
      <TopHeader />
      <div className="container mx-auto pt-16 pb-4 flex-1 flex">
        {/* Sidebar Conversations */}
        <aside className="w-full md:w-1/3 bg-[#262626] p-4 rounded-l-md overflow-y-auto">
          <h2 className="text-2xl font-bold mb-6">Conversations</h2>
          <ul className="space-y-3">
            {conversations.map((conv) => (
              <li key={conv.id}>
                <button
                  onClick={() => handleConversationClick(conv)}
                  className={`w-full text-left px-4 py-3 rounded-md ${
                    selectedConv && selectedConv.id === conv.id
                      ? "bg-gray-700"
                      : "hover:bg-gray-600"
                  }`}
                >
                  {conv.name}
                </button>
              </li>
            ))}
          </ul>
          <div className="flex justify-center mt-6 space-x-4">
            <Link
              to="/chats"
              className="px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600"
            >
              Chats
            </Link>
            <Link
              to="/comments"
              className="px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600"
            >
              Comments
            </Link>
            <Link
              to="/rooms"
              className="px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600"
            >
              Rooms
            </Link>
          </div>
          <button
            onClick={handleLogout}
            className="mt-6 px-4 py-2 bg-red-500 rounded-md hover:bg-red-600 font-bold w-full"
          >
            Logout
          </button>
        </aside>

        {/* Chat Window */}
        <section className="flex-1 bg-[#262626] p-4 rounded-r-md flex flex-col">
          {selectedConv ? (
            <>
              <header className="mb-4">
                <h3 className="text-2xl font-bold">
                  Chat with {selectedConv.name}
                </h3>
              </header>
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {selectedConv.messages &&
                  selectedConv.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-3 bg-gray-700 rounded-md"
                    >
                      <strong>{msg.user}:</strong> {msg.text}
                    </div>
                  ))}
              </div>
              <footer className="mt-auto">
                <div className="flex items-center gap-2 bg-gray-900 rounded-full p-1">
                  <input
                    type="text"
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 bg-transparent text-white focus:outline-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="p-3 bg-purple-600 hover:bg-purple-700 rounded-full text-white transition-colors disabled:bg-gray-600"
                    disabled={!newMsg.trim()}
                  >
                    Send
                  </button>
                </div>
              </footer>
            </>
          ) : (
            <div className="flex items-center justify-center flex-1">
              <p className="text-gray-400 text-xl">
                Select a conversation to start chatting.
              </p>
            </div>
          )}
        </section>
      </div>
      <MobileNavbar />
    </div>
  );
}

export default ChatsPage;