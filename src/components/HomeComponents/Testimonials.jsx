import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const testimonials = [
  {
    text: "With Nivaso, our society runs smoother than ever! No more scattered documents or late maintenance payments.",
    author: "Resident, XYZ Society",
  },
  {
    text: "A complete game-changer! The gate security and digital records have made management stress-free.",
    author: "Committee Member, ABC Apartments",
  },
  {
    text: "The modular pricing means we only pay for what we actually need—huge cost savings!",
    author: "Society Treasurer, LMN Residency",
  },
];

const Testimonials = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-3xl mx-auto mt-16 px-3 py-2 bg-gradient-to-b from-transparent to-gray-500 rounded-xl shadow-lg">
      <div className="overflow-hidden w-full h-30 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute inset-0 flex flex-col items-center text-center"
          >
            <p className="text-lg italic text-white">{testimonials[index].text}</p>
            <p className="mt-2 text-sm font-semibold bg-white p-2 text-gray-800 rounded-2xl">{testimonials[index].author}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Testimonials;
