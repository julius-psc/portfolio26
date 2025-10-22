"use client";

import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { Globe } from "lucide-react";
import github from "@/assets/icons/github.svg";

import flowiv from "../assets/images/flowivate-landing.png";
import coloursw from "../assets/images/colour-switch-landing.png";
import macornette from "../assets/images/macornette-landing.png";
import chiensencavale from "../assets/images/chiens-landing.png";
import digeto from "../assets/images/digeto-landing.png";

type Status = "live" | "building" | "paused";

type ProjectLink = { label: string; href: string; kind: "website" | "github" };
type ProjectItem = {
  id: string;
  name: string;
  year: string;
  status: Status;
  statusLabel?: string;
  description?: string;
  tech?: string[];
  imageSrc?: string;
  imageAlt?: string;
  links?: ProjectLink[];
};

type ProjectsProps = {
  items?: ProjectItem[];
  title?: string;
  className?: string;
};

const statusStyles: Record<
  Status,
  { dot: string; pill: string; text: string }
> = {
  live: {
    dot: "bg-green-500",
    pill: "border-green-500/20 bg-green-50 dark:bg-green-900/10",
    text: "Live",
  },
  building: {
    dot: "bg-orange-500",
    pill: "border-orange-500/20 bg-orange-50 dark:bg-orange-900/10",
    text: "Building",
  },
  paused: {
    dot: "bg-red-500",
    pill: "border-red-500/20 bg-red-50 dark:bg-red-900/10",
    text: "On hold",
  },
};

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

const defaultItems: ProjectItem[] = [
  {
    id: "flowivate",
    name: "Flowivate",
    year: "2024 — Present",
    status: "live",
    description:
      "AI-driven productivity dashboard with modular tools for focus, wellness, journaling, and goal tracking. Includes Pomodoro, mood tracking, and adaptive AI insights.",
    tech: ["React", "Next.js", "TypeScript", "MongoDB", "Tailwind"],
    imageSrc: flowiv,
    imageAlt: "Flowivate preview",
    links: [{ label: "Website", href: "www.flowivate.com", kind: "website" }, {
        label: "Github",
        href: "https://github.com/julius-psc/flowivate",
        kind: "github",
      },],
  },
  {
    id: "chiens-en-cavale",
    name: "Chiens en Cavale",
    year: "2024",
    status: "live",
    description:
      "Designed and developed a full-stack reservation web application for Chiens en Cavale — a non-profit dog walking association, featuring volunteer management, bookings, payments, and admin tools.",
    tech: ["React", "Node.js", "Express", "PostgreSQL", "AWS S3", "Stripe"],
    imageSrc: chiensencavale,
    imageAlt: "Chiens en Cavale app preview",
    links: [
      { label: "Website", href: "https://chiensencavale.fr", kind: "website" },
      {
        label: "Github",
        href: "https://github.com/julius-psc/dog-reservation-system",
        kind: "github",
      },
    ],
  },
  {
    id: "colour-switch",
    name: "Colour Switch",
    year: "2024",
    status: "live",
    description:
      "Fast-paced, kid-friendly Roblox game inspired by Colour Switch, built with modular Luau scripting and balanced level design for accessibility and replayability.",
    tech: ["Luau (Roblox)", "Figma"],
    imageSrc: coloursw,
    imageAlt: "Colour Switch preview",
    links: [{ label: "Roblox Game", href: "https://www.roblox.com/games/8219965802/Color-Switch", kind: "website" }],
  },
  {
    id: "edge",
    name: "EDGE",
    year: "2025",
    status: "live",
    description:
      "Designed and built the landing page for EDGE — Digeto’s global career accelerator helping students and professionals enter the impact startup ecosystem through real-world experience and mentorship.",
    tech: ["React", "Tailwind CSS", "Framer Motion", "Figma"],
    imageSrc: digeto,
    imageAlt: "EDGE landing page preview",
    links: [
      { label: "Website", href: "https://edge.digeto.org", kind: "website" },
      {
        label: "Github",
        href: "https://github.com/julius-psc/digeto-gcap",
        kind: "github",
      },
    ],
  },
  {
    id: "macornette",
    name: "Macornette",
    year: "2024",
    status: "live",
    description:
      "Designed and built the full WordPress website for Macornette — a Swiss ghost kitchen brand by TakTime, specializing in fresh, high-quality pasta dishes.",
    tech: ["WordPress", "Figma"],
    imageSrc: macornette,
    imageAlt: "Macornette website preview",
    links: [
      { label: "Website", href: "https://macornette.ch", kind: "website" },
    ],
  },
];

export default function Projects({
  items = defaultItems,
  title = "Projects",
  className,
}: ProjectsProps) {
  return (
    <section
      className={`relative flex items-center px-6 py-12 ${className ?? ""}`}
    >
      {/* Match Experience container: centered, left-aligned, narrower */}
      <div className="w-full max-w-2xl mx-auto text-left">
        <h2 className="text-2xl font-medium">{title}</h2>

        <motion.ul
          variants={container}
          initial="hidden"
          animate="show"
          className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {items.map((p) => (
            <ProjectCard key={p.id} entry={p} />
          ))}
        </motion.ul>
      </div>
    </section>
  );
}

function ProjectCard({ entry }: { entry: ProjectItem }) {
  const status = statusStyles[entry.status];
  const statusText = entry.statusLabel ?? status.text;

  return (
    <motion.li
      variants={item}
      className="rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden"
    >
      {/* Cover */}
      <div className="aspect-16/10 bg-zinc-100 dark:bg-zinc-800">
        {entry.imageSrc ? (
          <img
            src={entry.imageSrc}
            alt={entry.imageAlt ?? entry.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : null}
      </div>

      {/* Body (left-aligned, with a bit of bottom padding like Experience) */}
      <div className="px-4 pt-4 pb-4">
        {/* Title + Status + Year */}
        <div className="flex items-baseline justify-between gap-3">
          <div className="min-w-0 text-left">
            <div className="text-base leading-none font-semibold truncate pb-1">
              {entry.name}
            </div>
            <div
              className={[
                "mt-1 inline-flex items-center gap-2 rounded-full border px-2 py-0.5",
                "text-xs",
                status.pill,
              ].join(" ")}
            >
              <span
                className={[
                  "relative inline-flex h-2 w-2 rounded-full",
                  status.dot,
                ].join(" ")}
              >
                <span
                  className={[
                    "absolute inline-flex h-2 w-2 rounded-full",
                    "animate-ping",
                    status.dot,
                    "opacity-30",
                  ].join(" ")}
                />
              </span>
              <span className="font-medium text-zinc-700 dark:text-zinc-200">
                {statusText}
              </span>
            </div>
          </div>

          <div className="text-[10px] sm:text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 shrink-0">
            {entry.year}
          </div>
        </div>

        {/* Description */}
        {entry.description && (
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 text-left">
            {entry.description}
          </p>
        )}

        {/* Tech tags */}
        {(entry.tech?.length ?? 0) > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {entry.tech!.map((t) => (
              <li
                key={t}
                className="text-[11px] px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300"
              >
                {t}
              </li>
            ))}
          </ul>
        )}

        {/* Links (fixed labels + proper icon sizing) */}
        {(entry.links?.length ?? 0) > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            {entry.links!.map((l) =>
              l.kind === "github" ? (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm underline underline-offset-4 hover:opacity-80"
                >
                  <img src={github} alt="GitHub" className="h-4 w-4 shrink-0" />
                  Github
                </a>
              ) : (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm underline underline-offset-4 hover:opacity-80"
                >
                  <Globe className="h-4 w-4 shrink-0" aria-hidden />
                  Website
                </a>
              )
            )}
          </div>
        )}
      </div>
    </motion.li>
  );
}