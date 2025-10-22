"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

import digeto from "../assets/icons/dig.png";
import chiens from "../assets/icons/chiens.png";

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

const defaultItems = [
  {
    id: "digeto",
    company: "Digeto / EDGE",
    role: "Freelance Technical Lead",
    years: "2025",
    description:
      "Led product documentation, UX, and first React/TypeScript landing pages for Digeto’s platform and EDGE accelerator.",
    bullets: [
      "Defined data models and MVP scope for non-technical founders",
      "Built Digeto and EDGE landing pages with consistent design system",
    ],
    logoAlt: "Digeto",
    logoBg: "bg-zinc-100",
    logoSrc: digeto
  },
  {
    id: "chiens",
    company: "Chiens en Cavale (Non-profit)",
    role: "Vice President & Lead Developer",
    years: "2024 — 2025",
    description:
      "Created full-stack reservation system and brand identity for a non-profit dog walking association.",
    bullets: [
      "Built React/Node/PostgreSQL app with AWS S3 and Stripe integration",
      "Designed UX/UI used by 80+ users, including analytics dashboard",
    ],
    logoAlt: "CEC",
    logoBg: "bg-zinc-100",
    logoSrc: chiens
  }
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
        <h2 className="text-2xl font-medium">{title}</h2>

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
              className="relative flex items-start gap-4 rounded-2xl border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              <LogoSquare entry={entry} />

              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {entry.years}
                </div>

                <div className="mt-1 text-base font-semibold truncate">
                  {entry.company}
                </div>

                <div className="mt-0.5 text-sm text-gray-700 dark:text-gray-200">
                  {entry.role}
                </div>

                {entry.description && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    {entry.description}
                  </p>
                )}

                {entry.bullets?.length ? (
                  <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    {entry.bullets.map((b, i) => (
                      <li key={i} className="marker:text-gray-400">
                        {b}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
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
    <div
      className={[
        "relative h-14 w-14 shrink-0 rounded-xl overflow-hidden",
        entry.logoBg ?? "bg-zinc-100",
        "flex items-center justify-center border border-zinc-200 dark:border-zinc-700",
      ].join(" ")}
    >
      {entry.logoSrc ? (
        <img
          src={entry.logoSrc}
          alt={entry.logoAlt ?? entry.company}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          {initials || "—"}
        </span>
      )}
    </div>
  );
}