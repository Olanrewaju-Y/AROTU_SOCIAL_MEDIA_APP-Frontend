import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const sections = [
    {
      id: "intro",
      title: "Arotu: Unity in Connection",
      content: `In a land of over 500 languages — where voices echo from the peaks of Jos to the creeks of the Niger Delta — one dream rises above all: unity.
  Nigeria, diverse in tribe and tongue, but united in the desire to connect, to share, to belong. This… is the story of Arotu.`
    },
    {
      id: "name",
      title: "The Name, The Dream",
      content: `Arotu is more than a name. It’s a vision. Born from the three major languages of Nigeria — Ara (Yoruba) – soul or person, Otu (Igbo) – group or family, Tare (Hausa) – together or unity — it means: A person. A group. Together.`
    },
    {
      id: "platform",
      title: "The Platform – Social Media, Reimagined",
      content: `Inspired by the connection of Facebook and the nostalgia of 2go, Arotu brings Nigerians together — family, friends, fans — under one homegrown platform. Here, connection isn’t just digital… it’s cultural.`
    },
    {
      id: "features",
      title: "Key Features",
      content: `- Arotu Feed — Share posts and stories
  - Circles — Community rooms by tribe, interest, school
  - Moments — Temporary updates that disappear in 24 hours
  - Multilingual UI — English, Yoruba, Igbo, Hausa, Pidgin
  - Marketplace — Buy and sell locally
  - Lite Mode — Works on 2G/3G, low data
  - Push Notifications & Typing Indicators
  - Friend Requests & Real-time Messaging`
    },
    {
      id: "built",
      title: "Built for Us, By Us",
      content: `Arotu is proudly Nigerian. Whether you're a student in Enugu or a trader in Kano — it works for you. It’s light, fast, and free.`
    },
    {
      id: "unity",
      title: "A Platform for Unity",
      content: `In a world full of divisions, Arotu builds bridges. Through language, stories, and digital connection — we remind each other that our differences are our greatest strength.`
    },
    {
      id: "future",
      title: "Closing Message – Future Forward",
      content: `From the rhythms of the talking drum to the speed of 4G, Nigerians have always found a way to connect. Arotu is our next chapter. Built by our voices, for our people. Unity, in connection.`
    }
  ];

export default function WelcomePage() {
  return (
    <div className="bg-black text-white font-sans">
      <section className="h-screen flex flex-col items-center justify-center text-center bg-gradient-to-br from-cyan-900 to-black px-6">
        <motion.h1
            className="text-4xl md:text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
          Arotu
        </motion.h1>
        <motion.p
            className="text-lg md:text-2xl mb-8 max-w-2xl"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
        >
          Connecting Nigeria, One Story at a Time
        </motion.p>
        <motion.div
            className="flex space-x-4"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Link to="/login" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-2 px-4 rounded-lg">
            Get Started
          </Link>
          <Link to="/about" className="text-gray-300 hover:underline">
            Learn More
          </Link>
        </motion.div>
      </section>
        <section className="py-16 px-6 bg-gray-900">
            <div className="max-w-4xl mx-auto space-y-12">
            {sections.map((section) => (
                <motion.div
                key={section.id}
                className="space-y-4"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: section.id === "intro" ? 0 : 0.2 }}
                >
                <h2 className="text-3xl font-bold text-yellow-400">{section.title}</h2>
                <p className="text-gray-300">{section.content}</p>
                </motion.div>
            ))}
            </div>
        </section>
    </div>
  );
}
