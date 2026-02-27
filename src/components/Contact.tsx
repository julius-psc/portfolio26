"use client";

import { motion, type Variants } from "framer-motion";
import { Mail } from "lucide-react";
import Linkedin from "../assets/icons/linkedin.svg";
import Github from "../assets/icons/github.svg";

type ContactLink = {
  id: string;
  href: string;
  icon: "mail" | "linkedin" | "github";
  label: string;
};

type ContactProps = {
  title?: string;
  description?: string;
  links?: ContactLink[];
  className?: string;
};

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

const defaultLinks: ContactLink[] = [
  { id: "linkedin", href: "https://www.linkedin.com/in/julius-peschard-007822309/", icon: "linkedin", label: "LinkedIn" },
  { id: "github", href: "https://github.com/julius-psc", icon: "github", label: "GitHub" },
  { id: "email", href: "mailto:peschardjulius03@gmail.com", icon: "mail", label: "Email" },
];

export default function Contact({
  title = "Get in Touch",
  description = "Let’s build something great together — I’m open to offers and collaborations!",
  links = defaultLinks,
  className,
}: ContactProps) {
  return (
    <section className={`relative flex items-center px-6 py-12 ${className ?? ""}`}>
      <div className="w-full max-w-2xl mx-auto text-left">
        <h2 className="text-2xl font-medium dark:text-zinc-100">{title}</h2>

        {description && <p className="mt-4 text-gray-600 dark:text-gray-400">{description}</p>}

        <motion.div variants={container} initial="hidden" animate="show" className="mt-6 flex gap-3">
          {links.map((link) => (
            <motion.a
              key={link.id}
              variants={item}
              href={link.href}
              target={link.icon !== "mail" ? "_blank" : undefined}
              rel={link.icon !== "mail" ? "noopener noreferrer" : undefined}
              aria-label={link.label}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              {link.icon === "mail" ? (
                <Mail className="h-5 w-5 text-zinc-600 dark:text-zinc-400" strokeWidth={2} />
              ) : link.icon === "linkedin" ? (
                <img src={Linkedin as unknown as string} alt="LinkedIn" className="h-5 w-5 dark:invert" />
              ) : (
                <img src={Github as unknown as string} alt="GitHub" className="h-5 w-5 dark:invert" />
              )}
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  );
}