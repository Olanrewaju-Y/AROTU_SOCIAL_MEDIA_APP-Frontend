import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

// Typewriter effect hook
function useTypewriter(text, speed = 30) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed((prev) => prev + text[i]);
      i++;
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  return displayed;
}

const sections = [
  {
    id: "intro",
    title: "Welcome to Arotu",
    content: ` In a land of 500+ languages — from the peaks of Oyo; to Jos; to the creeks of the Niger Delta — one dream unites us: connection!
Nigeria, diverse in tribe and tongue, but bound by the desire to share, to belong.
This is Arotu’s story.`,
    image: "./public/arotu_people.jpg"
  },
  {
    id: "name",
    title: "The Name, The Dream",
    content: ` Arotu is more than a name. It’s a vision. Born from the three major languages of Nigeria — Ara (Yoruba) – soul or person, Otu (Igbo) – group or family, Tare (Hausa) – together or unity — it means: A person. A group. Together.`,
    image: "../public/arotu_drummers.jpg"
  },   
  {
    id: "unity",
    title: "A Platform for Unity",
    content: ` In a world full of divisions, Arotu builds bridges. Through language, stories, and digital connection — we remind each other that our differences are our greatest strength.`,
    image: ".../public/arotu_men.jpg"
  }
];

export default function WelcomePage() {
  const [slide, setSlide] = useState(0);
  const [userInteracted, setUserInteracted] = useState(false);
  const audioRef = useRef(null);

  // Typewriter text for current slide
  const typewriterText = useTypewriter(sections[slide].content, 30);

  const playDrum = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  // Automatic slide transition every 6 seconds
  useEffect(() => {
    if (slide < sections.length - 1) {
      const timer = setTimeout(() => {
        setSlide((prev) => prev + 1);
        // Only play drum if user has interacted
        if (userInteracted) playDrum();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [slide, userInteracted]);

  const nextSlide = () => {
    if (slide < sections.length - 1) {
      setSlide(slide + 1);
      setUserInteracted(true);
      playDrum();
    }
  };

  const prevSlide = () => {
    if (slide > 0) {
      setSlide(slide - 1);
      setUserInteracted(true);
      playDrum();
    }
  };

  return (
    <div className="bg-black text-white font-sans min-h-screen flex flex-col">
      {/* Drum sound */}
      <audio ref={audioRef} src="https://www.epidemicsound.com/sound-effects/tracks/224bca89-9e06-4b36-83b7-5dd02a42b900/" preload="auto" />

      {/* Cinematic Slide */}
      <section
        className="flex-1 flex flex-col items-center justify-center text-center px-6 relative overflow-hidden"
        style={{
          background: `linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.85)), url(${sections[slide].image}) center/cover no-repeat`
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={sections[slide].id}
            initial={{ opacity: 0, scale: 0.92, y: 60 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -60 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 drop-shadow-lg">
              {sections[slide].title}
            </h2>
            <p className="text-lg md:text-2xl mb-8 text-gray-200 min-h-[120px]">
              {typewriterText}
              <span className="animate-pulse text-yellow-400">|</span>
            </p>
          </motion.div>
        </AnimatePresence>
        {/* Slide Controls */}
        <div className="flex justify-center items-center space-x-6 mt-8">
          <button
            onClick={prevSlide}
            disabled={slide === 0}
            className={`py-2 px-4 rounded-lg bg-gray-800 text-yellow-400 font-bold transition-all ${
              slide === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-yellow-400 hover:text-black"
            }`}
          >
            ◀ Prev
          </button>
          <span className="text-gray-400 font-bold">{slide + 1} / {sections.length}</span>
          <button
            onClick={nextSlide}
            disabled={slide === sections.length - 1}
            className={`py-2 px-4 rounded-lg bg-gray-800 text-yellow-400 font-bold transition-all ${
              slide === sections.length - 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-yellow-400 hover:text-black"
            }`}
          >
            Next ▶
          </button>
        </div>
        {/* Get Started and Learn More only on last slide */}
        {slide === sections.length - 1 && (
          <motion.div
            className="flex space-x-4 mt-10"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <Link to="/login" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-2 px-4 rounded-lg">
              Get Started
            </Link>
            <Link to="/about" className="text-gray-300 hover:underline">
              Learn More
            </Link>
          </motion.div>
        )}
      </section>
    </div>
  );
}
