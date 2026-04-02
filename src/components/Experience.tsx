"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import digetoLogo from "../assets/icons/dig-logo.svg";
import xstreamLogo from "../assets/icons/xstream-logo.svg";
import cecLogo from "../assets/icons/cec-logo.svg";

type ExperienceItem = {
  id: string;
  company: string;
  role: string;
  years: string;
  description?: string;
  bullets?: string[];
  logoSrc?: string;
  logoAlt?: string;
  logoBg?: string;
};

type ExperienceProps = {
  items?: ExperienceItem[];
  title?: string;
  className?: string;
};

function initialsFromName(name: string) {
  const words = name.split(/\s+/).filter(Boolean).slice(0, 2);
  return words.map((w) => w[0]?.toUpperCase() ?? "").join("");
}

const defaultItems: ExperienceItem[] = [
  {
    id: "digeto-edge",
    company: "Digeto / EDGE",
    role: "Freelance Technical Lead → Product Engineer",
    years: "2025, Apr — Aug 2026",
    bullets: [
      "Designed and developed the landing pages for Digeto and EDGE with a consistent design system",
      "Returning Apr 2026 as lead product engineer on Digeto's GTM engine MVP",
    ],
    logoAlt: "Digeto",
    logoSrc: digetoLogo,
  },
  {
    id: "xstream",
    company: "XStream",
    role: "Product Designer",
    years: "2026",
    bullets: [
      "Designing first prototypes and redefining UX for a live streaming platform launching Q1 2027",
      "Collaborating on XStream's brand identity and design system",
    ],
    logoAlt: "XStream",
    logoSrc: xstreamLogo,
  },
  {
    id: "chiens-en-cavale",
    company: "Chiens en Cavale",
    role: "Vice President & Product Engineer",
    years: "2024 — 2025",
    bullets: [
      "Built a full-stack reservation platform for a dog-walking non-profit serving senior and disabled people — 100+ users nationwide",
      "Secured a €3,000 private grant in recognition of the platform's social impact",
    ],
    logoAlt: "CEC",
    logoSrc: cecLogo,
  },
];

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export default function Experience({
  items = defaultItems,
  title = "Experience",
  className,
}: ExperienceProps) {
  return (
    <section className={`relative flex items-center px-6 py-12 ${className ?? ""}`}>
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
              className="group relative flex flex-col rounded-2xl p-4 -mx-4 transition-all hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50"
            >
              <div className="flex items-center gap-4">
                <LogoSquare entry={entry} />
                <div className="min-w-0 flex-1">
                  <header className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                    <h3 className="text-base font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
                      {entry.company}
                    </h3>
                    <div className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      {entry.years}
                    </div>
                  </header>
                  <div className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {entry.role}
                  </div>
                </div>
              </div>

              {entry.bullets?.length ? (
                <ul className="mt-3 ml-[52px] list-disc pl-4 space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                  {entry.bullets.map((b, i) => (
                    <li key={i} className="marker:text-zinc-400 dark:marker:text-zinc-600">
                      {b}
                    </li>
                  ))}
                </ul>
              ) : null}
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}

function LogoSquare({ entry }: { entry: ExperienceItem }) {
  const initials = useMemo(
    () => initialsFromName(entry.logoAlt ?? entry.company),
    [entry.logoAlt, entry.company]
  );

  return (
    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
      {entry.logoSrc ? (
        <img
          src={entry.logoSrc}
          alt={entry.logoAlt ?? entry.company}
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