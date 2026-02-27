"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

import unicaen from "../assets/icons/unicaen.png";
import cnd from "../assets/icons/cnd.png";
import mnd from "../assets/icons/mnd.png";
import mills from "../assets/icons/mills.png";
import regent from "../assets/icons/regent.png";

type EducationItem = {
  id: string;
  school: string;
  diploma: string;
  years: string;
  logoSrc?: string;
  logoAlt?: string;
  logoBg?: string;
};

type EducationProps = {
  items?: EducationItem[];
  title?: string;
  className?: string;
};

function initialsFromName(name: string) {
  const words = name.split(/\s+/).filter(Boolean).slice(0, 2);
  return words.map((w) => w[0]?.toUpperCase() ?? "").join("");
}

const defaultItems: EducationItem[] = [
  {
    id: "unicaen-l1",
    school: "Université de Caen 🇫🇷",
    diploma: "Computer Science BSc",
    years: "2025 — 2027",
    logoAlt: "University",
    logoBg: "bg-zinc-100",
    logoSrc: unicaen,
  },
  {
    id: "lycee",
    school: "Lycée Générale Cours Notre Dame 🇫🇷",
    diploma: "Baccalaureat (Maths / Physics / Chemistry)",
    years: "2022 — 2025",
    logoAlt: "Lycée",
    logoBg: "bg-zinc-100",
    logoSrc: cnd,
  },
  {
    id: "middleschool",
    school: "Collège Maîtrise Notre Dame 🇫🇷",
    diploma: "Brevet",
    years: "2018 - 2022",
    logoAlt: "Collège",
    logoBg: "bg-zinc-100",
    logoSrc: mnd,
  },
  {
    id: "primary2",
    school: "Seven Mills Primary School 🇬🇧",
    diploma: "SATs",
    years: "2016 - 2018",
    logoAlt: "Primary",
    logoBg: "bg-zinc-100",
    logoSrc: mills,
  },
  {
    id: "primary1",
    school: "Regent International School 🇦🇪",
    diploma: "",
    years: "2013 - 2016",
    logoAlt: "Primary",
    logoBg: "bg-zinc-100",
    logoSrc: regent,
  },
];

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

export default function Education({
  items = defaultItems,
  title = "Education",
  className,
}: EducationProps) {
  return (
    <section
      className={`relative flex items-center px-6 py-12 ${className ?? ""}`}
    >
      <div className="w-full max-w-2xl mx-auto text-left">
        <h2 className="text-2xl font-medium dark:text-zinc-100">{title}</h2>

        <motion.ul
          variants={container}
          initial="hidden"
          animate="show"
          className="mt-6 space-y-4"
        >
          {items.map((entry) => (
            <motion.li
              key={entry.id}
              variants={item}
              className="group relative flex items-center gap-4 sm:gap-6 rounded-2xl p-4 -mx-4 transition-all hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50"
            >
              <LogoSquare entry={entry} />

              <div className="min-w-0 flex-1">
                <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <h3 className="text-base font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
                    {entry.school}
                  </h3>
                  <div className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    {entry.years}
                  </div>
                </header>

                {entry.diploma && (
                  <div className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-400">
                    {entry.diploma}
                  </div>
                )}
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}

function LogoSquare({ entry }: { entry: EducationItem }) {
  const initials = useMemo(
    () => initialsFromName(entry.logoAlt ?? entry.school),
    [entry.logoAlt, entry.school]
  );

  return (
    <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center">
      {entry.logoSrc ? (
        <img
          src={entry.logoSrc}
          alt={entry.logoAlt ?? entry.school}
          className="h-full w-full object-contain"
          loading="lazy"
        />
      ) : (
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {initials || "—"}
        </span>
      )}
    </div>
  );
}
