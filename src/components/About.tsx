import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { about } from "../data";
import SplitHeading from "./SplitHeading";
import Reveal from "./Reveal";
import Pills from "./Pills";

function Word({ word, range, progress }: { word: string; range: [number, number]; progress: MotionValue<number> }) {
  const opacity = useTransform(progress, range, [0.15, 1]);
  return (
    <motion.span style={{ opacity }} className="mr-[0.25em] inline-block">
      {word}
    </motion.span>
  );
}

export default function About() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.5", "end 0.9"] });
  const words = about.quote.split(" ");

  return (
    <section id="about" ref={ref} className="flex min-h-screen items-center px-6 py-24 md:px-12">
      <div className="mx-auto grid w-full max-w-6xl gap-16 md:grid-cols-2">
        <div>
          <SplitHeading className="text-5xl font-bold tracking-tight md:text-6xl">About</SplitHeading>
          <Reveal delay={0.1} className="mt-6 max-w-md leading-relaxed">
            <p>{about.text}</p>
          </Reveal>

          <SplitHeading as="h3" className="mt-12 text-xl font-bold">Skill</SplitHeading>
          <Pills items={about.skills} />

          <SplitHeading as="h3" className="mt-10 text-xl font-bold">Focus</SplitHeading>
          <Pills items={about.focus} />
        </div>

        <p className="self-start text-[clamp(2rem,4.5vw,4rem)] font-light leading-[1.1] md:sticky md:top-32">
          {words.map((w, i) => (
            <Word key={i} word={w} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} />
          ))}
        </p>
      </div>
    </section>
  );
}
