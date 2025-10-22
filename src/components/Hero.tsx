"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";
import { DotPattern } from "../components/ui/dot-pattern";

const greetings = [
  "Bonjour, je suis",   // French
  "مرحباً، أنا",        // Arabic
  "こんにちは、私は",     // Japanese
  "Hola, soy",          // Spanish
];

const Hero = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % greetings.length);
    }, 2000); // change every 2s
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative flex items-center min-h-[70vh] px-6 overflow-hidden">
      {/* Background dots */}
      <DotPattern
        className={cn(
          "absolute inset-0 opacity-40",
          "mask-[linear-gradient(to_bottom,transparent,white_20%,white_80%,transparent)]",
          "-webkit-mask-[linear-gradient(to_bottom,transparent,white_20%,white_80%,transparent)]"
        )}
        patternSize={24}
        color="hsl(0 0% 90%)"
      />

      {/* Foreground */}
      <div className="relative z-10 w-full max-w-2xl mx-auto text-left">
        <div className="h-5 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={index}
              initial={{ opacity: 0, y: -20, rotateX: 90 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, y: 20, rotateX: -90 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="text-sm uppercase tracking-widest text-gray-600"
            >
              {greetings[index]}
            </motion.p>
          </AnimatePresence>
        </div>

        <h1 className="text-7xl sm:text-8xl font-semibold mt-2">Julius</h1>

        <p className="text-base sm:text-lg text-gray-500 mt-2">
          Passionate developer crafting clean interfaces & thoughtful digital
          experiences. 👨🏽‍💻
        </p>
      </div>
    </section>
  );
};

export default Hero;