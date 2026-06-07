import { IconArrowUpRight, IconArrowRight } from '@tabler/icons-react';
import githubIcon from '../assets/icons/github.svg';
import linkedinIcon from '../assets/icons/linkedin.svg';

export default function SocialsBar() {
  return (
    <div className="dark fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">

      {/* CTA — naturally sized to content, top corners only, flush with bar below */}
      <a
        href="mailto:peschardjulius03@gmail.com"
        className="bg-accent rounded-tl-lg rounded-tr-lg px-4 py-2 flex items-center gap-2 w-fit"
      >
        <span className="text-primary text-sm font-medium whitespace-nowrap leading-none">
          Let's work together
        </span>
        <IconArrowRight size={14} className="text-primary shrink-0" />
      </a>

      {/* Main bar */}
      <div className="bg-base border border-white/[0.08] rounded-lg px-5 py-3 flex items-center gap-8">

        {/* Email */}
        <a
          href="mailto:peschardjulius03@gmail.com"
          className="text-primary text-sm font-medium opacity-60 hover:opacity-100 transition-opacity duration-150 whitespace-nowrap"
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
          className="flex items-center gap-1 text-primary text-sm font-medium opacity-60 hover:opacity-100 transition-opacity duration-150 whitespace-nowrap"
        >
          Resume
          <IconArrowUpRight size={14} className="shrink-0" />
        </a>

      </div>
    </div>
  );
}
