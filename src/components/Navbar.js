import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  CircleUserRound,
  MessageCircle,
  DoorOpen,
} from "lucide-react";
import { Search, Bell, Send } from "lucide-react";

const navItems = [
  { to: "/home", icon: Home, label: "Home" },
  { to: "/rooms", icon: DoorOpen, label: "Rooms" },
  { to: "/friends", icon: Users, label: "Friends" },
  { to: "/chats", icon: MessageCircle, label: "Chat" },
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
            className={`flex flex-col items-center p-2 transition-colors ${
              location.pathname === to
                ? "text-purple-400"
                : "hover:text-purple-400 text-gray-400"
            }`}
            aria-label={label}
          >
            <Icon size={24} strokeWidth={2} />
            <span className="text-xs mt-1">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export const TopHeader = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
      <div className="flex justify-between items-center h-16 px-4">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">
          Arotu
        </h1>
        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-full hover:bg-gray-800 transition-colors">
            <Search size={22} />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-800 transition-colors">
            <Bell size={22} />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-800 transition-colors">
            <Send size={22} />
          </button>
        </div>
      </div>
    </header>
  );
};
