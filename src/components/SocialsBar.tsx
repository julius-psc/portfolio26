import { IconArrowUpRight, IconArrowRight } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import Text3DFlip from '@/components/ui/text-3d-flip';
import githubIcon from '../assets/icons/github.svg';
import linkedinIcon from '../assets/icons/linkedin.svg';

export default function SocialsBar() {
  const [visible, setVisible] = useState(false);

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
              href="mailto:peschardjulius03@gmail.com"
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
            className="bg-base border border-white/[0.08] rounded-lg px-5 py-3 flex items-center gap-5 sm:gap-8 min-w-[260px] sm:min-w-0"
            initial={{ y: 24, scale: 0.97 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 120, transition: { type: 'spring', stiffness: 200, damping: 32, delay: 0.42 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          >

            {/* Email — hidden on mobile */}
            <a
              href="mailto:peschardjulius03@gmail.com"
              className="hidden sm:inline text-primary text-sm font-medium opacity-60 hover:opacity-100 transition-opacity duration-150 whitespace-nowrap"
            >
              peschardjulius03@gmail.com
            </a>

            {/* Social icons */}
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/juliuspeschard"
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-60 hover:opacity-100 transition-opacity duration-150"
              >
                <img src={githubIcon} alt="GitHub" className="w-4 h-4 invert" />
              </a>
              <a
                href="https://linkedin.com/in/juliuspeschard"
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-60 hover:opacity-100 transition-opacity duration-150"
              >
                <img src={linkedinIcon} alt="LinkedIn" className="w-4 h-4 invert" />
              </a>
            </div>

            {/* Resume */}
            <a
              href="/documents/resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary text-sm font-medium opacity-60 hover:opacity-100 transition-opacity duration-150 whitespace-nowrap ml-auto sm:ml-0"
            >
              Resume
              <IconArrowUpRight size={14} className="shrink-0" />
            </a>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
