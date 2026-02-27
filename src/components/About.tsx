"use client";

const About = () => {
  const skills = [
    "TypeScript",
    "JavaScript",
    "React",
    "Next.js",
    "Node.js",
    "Express",
    "MongoDB",
    "PostgreSQL",
    "Tailwind CSS",
    "Git",
    "REST APIs",
    "SQL",
    "Python",
    "Figma",
    "AWS (S3)",
  ];


  return (
    <section className="relative flex items-center min-h-[20vh] px-6">
      <div className="w-full max-w-2xl mx-auto text-left">
        <h2 className="text-2xl font-medium dark:text-zinc-100">About</h2>

        <p className="text-base sm:text-lg text-gray-600 dark:text-zinc-400 leading-relaxed mt-3">
          First-year Computer Science student from 🇫🇷, passionate about software
          engineering and AI — driven to join top-tier tech companies and build
          impactful, scalable products.
        </p>

        <ul className="mt-5 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <li
              key={skill}
              className="text-xs px-2.5 py-1 rounded-md bg-zinc-900 text-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 font-medium border border-transparent dark:border-zinc-700"
            >
              {skill}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default About;