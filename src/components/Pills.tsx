import { motion } from "framer-motion";

export default function Pills({ items }: { items: string[] }) {
  return (
    <motion.ul
      className="mt-4 flex flex-wrap gap-2"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.5 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
    >
      {items.map((t) => (
        <motion.li
          key={t}
          variants={{ hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1 } }}
          className="cursor-default rounded-full border border-white/90 px-3 py-1 text-xs font-semibold transition-colors duration-300 hover:border-accent hover:bg-accent hover:text-black"
        >
          {t}
        </motion.li>
      ))}
    </motion.ul>
  );
}
