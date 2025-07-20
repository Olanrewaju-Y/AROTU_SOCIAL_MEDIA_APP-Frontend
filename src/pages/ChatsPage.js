import React, { useState, useEffect } from "react";
import { TopHeader } from "../components/Navbar";
import MobileNavbar from "../components/Navbar";
import { Link, useNavigate } from "react-router-dom";

// Mock conversations including private messages (initially; will fetch messages on click)
const mockConversations = [
  { 
    id: 1, 
    name: "Alice", 
    receiver_id: "user_1",
    messages: [
      { id: 1, user: "Alice", text: "Hi! How are you?" },
      { id: 2, user: "You", text: "I am good, thanks!" },
    ]
  },
  { 
    id: 2, 
    name: "Bob", 
    receiver_id: "user_2",
    messages: [
      { id: 1, user: "Bob", text: "Hello there!" },
    ]
  },
  // Add more mock conversations as needed
];

function ChatsPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [newMsg, setNewMsg] = useState("");
  const navigate = useNavigate();

  // On mount, load initial conversations (replace with API call if needed)
  useEffect(() => {
    setConversations(mockConversations);
  }, []);

  // Logout function: clear token and redirect
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  // When a conversation is selected, fetch its messages from GET /private/:userId
  const handleConversationClick = async (conv) => {
    setSelectedConv(conv);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_BASE_API_URL}/api/messages/private/${conv.receiver_id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        // Update conversation with fetched messages
        const updatedConv = { ...conv, messages: data };
        setSelectedConv(updatedConv);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conv.id ? updatedConv : c
          )
        );
      } else {
        throw new Error("Failed to fetch messages");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Send message using POST /private
  const handleSendMessage = async () => {
    if (newMsg.trim() && selectedConv) {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId") || "You";
      const newMessageObj = {
        id: Date.now(), // temporary unique id
        user: userId,
        text: newMsg,
      };

      // Optimistically update conversation
      const updatedConv = {
        ...selectedConv,
        messages: [...selectedConv.messages, newMessageObj],
      };
      setSelectedConv(updatedConv);
      setConversations((prev) =>
        prev.map((c) => (c.id === updatedConv.id ? updatedConv : c))
      );
      setNewMsg("");

      try {
        const res = await fetch(
          `${process.env.REACT_APP_BACKEND_BASE_API_URL}/api/messages/private`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              receiver: selectedConv.receiver_id,
              text: newMsg,
            }),
          }
        );
        if (!res.ok) {
          throw new Error("Failed to send message");
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-100 font-sans">
      <TopHeader />
      <div className="container mx-auto pt-16 pb-24 h-screen">
        {/* Navigation Tabs */}
        <div className="mb-4 flex justify-between items-center">
          <div className="flex justify-center space-x-4">
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
            className="px-4 py-2 bg-red-500 rounded-md hover:bg-red-600 font-bold"
          >
            Logout
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 h-full gap-4">
          <aside className="col-span-1 bg-[#262626] p-4 rounded-l-md">
            <h2 className="text-xl font-bold mb-4">Conversations</h2>
            <ul className="space-y-2">
              {conversations.map((conv) => (
                <li key={conv.id}>
                  <button
                    onClick={() => handleConversationClick(conv)}
                    className={`w-full text-left px-4 py-2 rounded-md ${
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
          </aside>
          <section className="col-span-2 bg-[#262626] p-4 rounded-r-md flex flex-col">
            {selectedConv ? (
              <>
                <header className="mb-4">
                  <h3 className="text-lg font-semibold">
                    Chat with {selectedConv.name}
                  </h3>
                </header>
                <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                  {selectedConv.messages &&
                    selectedConv.messages.map((msg) => (
                      <div key={msg.id} className="p-2 rounded-md bg-gray-700">
                        <strong>{msg.user}:</strong> {msg.text}
                      </div>
                    ))}
                </div>
                <div className="mt-auto">
                  <div className="flex">
                    <input
                      type="text"
                      value={newMsg}
                      onChange={(e) => setNewMsg(e.target.value)}
                      className="flex-1 p-2 bg-[#1a1a1a] border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Type your message..."
                    />
                    <button
                      onClick={handleSendMessage}
                      className="ml-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-md"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400">
                  Select a conversation to start chatting.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
      <MobileNavbar />
    </div>
  );
}

export default ChatsPage;