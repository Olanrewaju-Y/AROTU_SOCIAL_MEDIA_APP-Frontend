import React, { useEffect, useState } from 'react';

const mockConversations = [
  { id: 1, name: 'Alice', receiver_id: 'user_1' },
  { id: 2, name: 'Bob', receiver_id: 'user_2' },
  // Add more mock conversations as needed
];

function ChatsPage() {
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    // Replace with API call to fetch conversations
    setConversations(mockConversations);
  }, []);

  const handleConversationClick = async (receiver_id) => {
    try {
      await fetch('/chat/private', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver: receiver_id,
          text: 'Hello!',
        }),
      });
      alert('Message sent!');
    } catch (error) {
      alert('Failed to send message');
    }
  };

  return (
    <div>
      <h2>Chats</h2>
      <ul>
        {conversations.map((conv) => (
          <li key={conv.id}>
            <button onClick={() => handleConversationClick(conv.receiver_id)}>
              {conv.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ChatsPage;