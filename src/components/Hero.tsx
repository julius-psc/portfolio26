"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";
import { DotPattern } from "../components/ui/dot-pattern";
import profilePic from "../assets/images/profile-pic.png";

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
      <div className="absolute inset-0 dark:hidden">
        <DotPattern
          className={cn(
            "opacity-40",
            "mask-[linear-gradient(to_bottom,transparent,white_20%,white_80%,transparent)]",
            "-webkit-mask-[linear-gradient(to_bottom,transparent,white_20%,white_80%,transparent)]"
          )}
          patternSize={24}
          color="hsl(0 0% 90%)"
        />
      </div>
      <div className="absolute inset-0 hidden dark:block">
        <DotPattern
          className={cn(
            "opacity-20",
            "mask-[linear-gradient(to_bottom,transparent,white_20%,white_80%,transparent)]",
            "-webkit-mask-[linear-gradient(to_bottom,transparent,white_20%,white_80%,transparent)]"
          )}
          patternSize={24}
          color="hsl(0 0% 30%)"
        />
      </div>

      {/* Foreground */}
      <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-8">
        {/* Profile Avatar */}
        <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 rounded-full bg-white shadow-sm dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
          <img src={typeof profilePic === "string" ? profilePic : (profilePic as any).src} alt="Profile" className="w-full h-full object-cover" />
        </div>

        <div className="text-left flex-1">
          <div className="h-5 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={index}
                initial={{ opacity: 0, y: -20, rotateX: 90 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                exit={{ opacity: 0, y: 20, rotateX: -90 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="text-sm uppercase tracking-widest text-zinc-600 dark:text-zinc-400"
              >
                {greetings[index]}
              </motion.p>
            </AnimatePresence>
          </div>

          <h1 className="text-7xl sm:text-8xl font-semibold mt-2 tracking-tight text-zinc-900 dark:text-zinc-50">Julius</h1>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 mt-3 leading-relaxed">
            Solopreneur building apps & thoughtful digital
            experiences. 👨🏽‍💻
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;