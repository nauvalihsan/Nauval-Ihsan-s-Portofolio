import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { profile } from "../data";
import { ease } from "../lib/motion";

const opacities = [1, 0.6, 0.4, 0.25];

/** Daftar yang berputar otomatis: baris atas keluar, baris baru masuk dari bawah. */
export default function FocusedOn() {
  const list = profile.focusedOn;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2200);
    return () => clearInterval(id);
  }, []);

  const visible = Array.from({ length: Math.min(4, list.length) }, (_, i) => ({
    id: tick + i,
    label: list[(tick + i) % list.length],
  }));

  return (
    <div className="mt-10 flex gap-3 text-base md:text-lg">
      <span className="shrink-0">Focused on</span>
      <ul className="relative">
        <AnimatePresence mode="popLayout" initial={false}>
          {visible.map((v, rank) => (
            <motion.li
              key={v.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: opacities[rank], y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.7, ease }}
            >
              {v.label}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
