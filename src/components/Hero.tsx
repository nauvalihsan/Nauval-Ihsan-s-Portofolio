import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { profile } from "../data";
import { ease } from "../lib/motion";
import SplitHeading from "./SplitHeading";
import FocusedOn from "./FocusedOn";

const pill = "rounded-full border px-5 py-2 text-sm font-medium transition-colors duration-300 md:text-base";

export default function Hero() {
  const photoRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: photoRef, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <section id="home" className="relative min-h-screen overflow-hidden px-6 pb-24 pt-32 md:px-12">
      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-[1.4fr_1fr]">
        <div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-xs text-white/50">
            {profile.major}
          </motion.p>

          <SplitHeading as="h1" delay={0.2} className="mt-3 text-[clamp(2.5rem,6.5vw,5.5rem)] font-bold leading-[1.02] tracking-tight">
            {profile.name}
          </SplitHeading>

          <motion.div
            className="mt-6 flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8, ease }}
          >
            <a
            href={profile.cv}
            target="_blank"
            rel="noopener noreferrer"
            className={`${pill} border-white bg-white text-black hover:border-accent hover:bg-accent`}>
              View CV
            </a>

            <a href={profile.cv} 
            download="Nauval Ihsan CV.pdf"
            className={`${pill} border-white bg-white text-black hover:border-accent hover:bg-accent`}>
              Download CV
            </a>
          </motion.div>

          <FocusedOn />
        </div>

        <motion.div
          ref={photoRef}
          initial={{ clipPath: "inset(100% 0 0 0)" }}
          animate={{ clipPath: "inset(0% 0 0 0)" }}
          transition={{ delay: 0.5, duration: 1.1, ease }}
          className="aspect-[3/4] w-full max-w-sm justify-self-center overflow-hidden rounded-3xl bg-[#d9d9d9] md:justify-self-end"
        >
          {profile.photo && <motion.img src={profile.photo} alt={profile.name} style={{ y, scale: 1.2 }} className="size-full object-cover" />}
        </motion.div>
      </div>
    </section>
  );
}
