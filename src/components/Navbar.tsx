import { Mail, ArrowUpRight } from "lucide-react";
import GithubIcon from "@/assets/icons/github.svg";
import LinkedinIcon from "@/assets/icons/linkedin.svg";

const Navbar = () => {
  return (
    <nav className="w-full flex items-center justify-between px-8 py-4 text-sm font-light tracking-wide">
      {/* Left - Email */}
      <a
        href="mailto:peschardjulius03@gmail.com"
        className="flex items-center gap-2 hover:underline underline-offset-4"
      >
        <Mail size={16} />
        peschardjulius03@gmail.com
      </a>

      {/* Right - Socials + Resume */}
      <div className="flex items-center gap-5">
        {/* Socials */}
        <a href="#" aria-label="GitHub" className="hover:opacity-60 transition-opacity">
          <img src={GithubIcon} alt="GitHub" className="w-5 h-5" />
        </a>
        <a href="#" aria-label="LinkedIn" className="hover:opacity-60 transition-opacity">
          <img src={LinkedinIcon} alt="LinkedIn" className="w-5 h-5" />
        </a>

        {/* Resume link */}
        <a
          href="/resume.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 border-b border-transparent hover:border-black transition-all"
        >
          <span>Resume</span>
          <ArrowUpRight size={15} strokeWidth={1.5} />
        </a>
      </div>
    </nav>
  );
};

export default Navbar;