// src/components/PostCategories.js
import React from 'react';
import { Search } from 'lucide-react';

const PostCategories = ({ activeCategory, setActiveCategory, searchQuery, handleSearchChange, handleSearchSubmit, navCategories = [] }) => {
  return (
    <section className="sticky top-16 z-40 bg-black/80 backdrop-blur-md border-b border-gray-800">
      <div className="flex justify-around items-center h-12 text-sm font-semibold text-gray-400">
        {navCategories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`py-2 px-3 border-b-2 transition-all duration-300 ${
              activeCategory === category
                ? "border-purple-500 text-white"
                : "border-transparent hover:text-white"
            }`}
          >
            {category}
          </button>
        ))}
      </div>
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="p-3 border-t border-gray-800">
        <div className="relative">
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-gray-600 rounded-full focus:ring-purple-500 focus:border-purple-500 transition"
          />
          <Search
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <button type="submit" className="sr-only">Search</button>
        </div>
      </form>
    </section>
  );
};

export default PostCategories;
