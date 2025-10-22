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
        <h2 className="text-2xl font-medium">About</h2>

        <p className="text-base sm:text-lg text-gray-600 leading-relaxed mt-3">
          First-year Computer Science student from 🇫🇷, passionate about software
          engineering and AI — driven to join top-tier tech companies and build
          impactful, scalable products.
        </p>

        <ul className="mt-5 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <li
              key={skill}
              className="text-xs px-2.5 py-1 rounded-md bg-black text-white font-medium"
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