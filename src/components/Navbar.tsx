import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { menu } from "../data";
import { ease } from "../lib/motion";

const panel: Variants = {
  closed: { width: 96, height: 40, backgroundColor: "rgba(190,190,190,0.9)", transition: { duration: 0.45, ease } },
  open: {
    width: 208,
    height: "auto",
    backgroundColor: "rgba(51,51,51,0.96)",
    transition: { duration: 0.5, ease, staggerChildren: 0.06, delayChildren: 0.15 },
  },
};
const item: Variants = {
  closed: { opacity: 0, y: -8, transition: { duration: 0.2 } },
  open: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Navbar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}

      <motion.nav
        variants={panel}
        initial="closed"
        animate={open ? "open" : "closed"}
        className="fixed left-4 top-4 z-50 overflow-hidden rounded-[28px] text-white backdrop-blur-md md:left-6 md:top-6"
      >
        <button onClick={() => setOpen(!open)} aria-expanded={open} className="h-10 w-full text-sm font-medium tracking-wide">
          {open ? "CLOSE" : "MENU"}
        </button>

        <ul className="pb-4 text-center">
          {menu.map((m) => (
            <motion.li key={m.href} variants={item}>
              <a
                href={m.href}
                tabIndex={open ? 0 : -1}
                onClick={() => setOpen(false)}
                className="mx-2 block rounded-full py-2.5 text-lg tracking-wide text-white/90 transition-colors duration-300 hover:bg-white/10 hover:text-accent"
              >
                {m.label.toUpperCase()}
              </a>
            </motion.li>
          ))}
        </ul>
      </motion.nav>
    </>
  );
}
