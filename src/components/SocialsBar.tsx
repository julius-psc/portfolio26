import { IconArrowRight } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import Text3DFlip from '@/components/ui/text-3d-flip';
import githubIcon from '../assets/icons/github.svg';
import linkedinIcon from '../assets/icons/linkedin.svg';
import xIcon from '../assets/icons/x.svg';

const EMAIL = 'peschardjulius03@gmail.com';

export default function SocialsBar() {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef(0);

  useEffect(() => () => window.clearTimeout(copiedTimer.current), []);

  // The CTA above opens a draft; the address itself copies, for people who
  // write from somewhere other than their default mail app.
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
    } catch {
      window.location.href = `mailto:${EMAIL}`;
      return;
    }
    setCopied(true);
    window.clearTimeout(copiedTimer.current);
    copiedTimer.current = window.setTimeout(() => setCopied(false), 1600);
  };

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="socials-bar"
          className="dark fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center"
        >

          {/* Clip wrapper — hides CTA until it slides up */}
          <div className="overflow-hidden w-full flex justify-center">
            <motion.a
              href={`mailto:${EMAIL}`}
              className="bg-accent rounded-tl-lg rounded-tr-lg px-4 py-2 flex items-center gap-2 w-fit"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%', transition: { type: 'spring', stiffness: 200, damping: 28 } }}
              transition={{ type: 'spring', stiffness: 160, damping: 26, delay: 0.14 }}
            >
              <Text3DFlip
                as="span"
                className="text-primary text-sm font-medium whitespace-nowrap leading-none"
                textClassName="text-primary"
                flipTextClassName="text-primary"
                rotateDirection="top"
                staggerDuration={0.03}
              >
                Let's work together
              </Text3DFlip>
              <IconArrowRight size={14} className="text-primary shrink-0" />
            </motion.a>
          </div>

          {/* Main bar */}
          <motion.div
            className="bg-base border border-white/[0.08] rounded-lg px-5 py-3 flex items-center justify-center gap-5 sm:gap-8 min-w-[260px] sm:min-w-0"
            initial={{ y: 24, scale: 0.97 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 120, transition: { type: 'spring', stiffness: 200, damping: 32, delay: 0.42 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          >

            {/* Email (copies on click) — hidden on mobile. Both labels share one
                grid cell, so the bar keeps the address's width while they swap. */}
            <button
              type="button"
              onClick={copyEmail}
              title="Copy email"
              className="hidden sm:inline-grid cursor-pointer text-primary text-sm font-medium opacity-60 hover:opacity-100 transition-opacity duration-150 whitespace-nowrap selectable"
            >
              <span
                className="[grid-area:1/1] transition-[opacity,filter] duration-200 ease-ui"
                style={{ opacity: copied ? 0 : 1, filter: copied ? 'blur(2px)' : 'none' }}
              >
                {EMAIL}
              </span>
              <span
                aria-hidden
                className="[grid-area:1/1] text-center transition-[opacity,filter] duration-200 ease-ui"
                style={{ opacity: copied ? 1 : 0, filter: copied ? 'none' : 'blur(2px)' }}
              >
                Copied to clipboard
              </span>
              <span aria-live="polite" className="sr-only">
                {copied ? 'Email copied' : ''}
              </span>
            </button>

            {/* Social icons */}
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/julius-psc"
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-60 hover:opacity-100 transition-opacity duration-150"
              >
                <img src={githubIcon} alt="GitHub" className="w-4 h-4 invert" />
              </a>
              <a
                href="https://www.linkedin.com/in/julius-peschard-007822309/"
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-60 hover:opacity-100 transition-opacity duration-150"
              >
                <img src={linkedinIcon} alt="LinkedIn" className="w-4 h-4 invert" />
              </a>
              <a
                href="https://x.com/juliuspsc"
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-60 hover:opacity-100 transition-opacity duration-150"
              >
                <img src={xIcon} alt="X" className="w-4 h-4 invert" />
              </a>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
