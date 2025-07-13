import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Search,
  PlusSquare,
  CircleUserRound,
  MessageCircle,
} from "lucide-react";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/search", icon: Search, label: "Search" },
  { to: "/create-post", icon: PlusSquare, label: "Create" },
  { to: "/chats", icon: MessageCircle, label: "Chats" },
  { to: "/profile", icon: CircleUserRound, label: "Profile" },
];

export default function MobileNavbar() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-t border-gray-800">
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`p-2 rounded-full transition-colors ${
              location.pathname === to ? "text-purple-400" : "hover:text-purple-400 text-gray-400"
            }`}
            aria-label={label}
          >
            <Icon size={28} strokeWidth={2.5} />
          </Link>
        ))}
      </div>
    </nav>
  );
}