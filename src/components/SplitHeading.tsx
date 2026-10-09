import { motion } from "framer-motion";
import { ease } from "../lib/motion";

type Props = {
  children: string;
  as?: "h1" | "h2" | "h3" | "div";
  className?: string;
  delay?: number;
  once?: boolean;
};

/** Heading yang "spawn" kata per kata dari balik mask saat masuk viewport. */
export default function SplitHeading({ children, as: Tag = "h2", className = "", delay = 0, once = true }: Props) {
  return (
    <Tag className={className} aria-label={children}>
      {children.split(" ").map((word, i) => (
        <motion.span
          key={i}
          aria-hidden
          initial="hidden"
          whileInView="show"
          viewport={{ once, amount: 0.6, margin: "0px 0px -10% 0px" }}
          className="-mb-[0.12em] mr-[0.25em] inline-block overflow-hidden pb-[0.12em] align-bottom"
        >
          <motion.span
            className="inline-block origin-left"
            variants={{
              hidden: { y: "115%", rotate: 4 },
              show: { y: 0, rotate: 0, transition: { duration: 0.85, delay: delay + i * 0.07, ease } },
            }}
          >
            {word}
          </motion.span>
        </motion.span>
      ))}
    </Tag>
  );
}