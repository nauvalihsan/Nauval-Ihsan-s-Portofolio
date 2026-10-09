import { useRef } from "react";
import { motion, useScroll } from "framer-motion";
import { experience } from "../data";
import SplitHeading from "./SplitHeading";
import Reveal from "./Reveal";

export default function Experience() {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.7", "end 0.7"] });

  return (
    <section id="experience" className="flex min-h-screen items-center px-6 py-24 md:px-12">
      <div className="mx-auto w-full max-w-6xl">
        <SplitHeading className="text-5xl font-bold tracking-tight md:text-6xl">Experience</SplitHeading>

        <ol ref={ref} className="relative mt-16 flex flex-col gap-14 pl-10">
          <span className="absolute bottom-2 left-[5px] top-2 w-px bg-white/15" />
          <motion.span style={{ scaleY: scrollYProgress }} className="absolute bottom-2 left-[5px] top-2 w-px origin-top bg-white" />

          {experience.map((e, i) => (
            <li key={i} className="relative grid gap-2 md:grid-cols-[14rem_1fr] md:gap-8">
              <motion.span
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="absolute -left-10 top-1 size-3 rounded-full bg-white"
              />
              <Reveal><p className="text-sm">{e.period}</p></Reveal>
              <Reveal delay={0.1}>
                <p className="text-sm font-medium">{e.org}</p>
                <ul className="mt-2 list-disc pl-4 text-sm text-white/80">
                  {e.points.map((p, j) => <li key={j}>{p}</li>)}
                </ul>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
