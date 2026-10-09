import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ease } from "../lib/motion";
import Pills from "./Pills";

type WorkItem = {
  title: string;
  image: string;
  description?: string;
  overview?: string;
  github?: string;
  figma?: string;
  demo?: string;
  tools?: string[];
};

const btn = "inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-medium transition-colors duration-300 md:text-base";

const GithubIcon = () => (
  <svg viewBox="0 0 16 16" className="size-5" fill="currentColor" aria-hidden="true">
    <path
      fillRule="evenodd"
      d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
    />
  </svg>
);

const FigmaIcon = () => (
  <svg viewBox="0 0 38 57" className="h-5 w-auto" fill="currentColor" aria-hidden="true">
    <path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" />
    <path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z" />
    <path d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z" />
    <path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" />
    <path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" />
  </svg>
);

export default function WorkModal({ item, onClose }: { item: WorkItem | null; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const openedAt = useRef(0);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!item) return;
    openedAt.current = Date.now();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseRef.current();
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden"; // kunci scroll halaman
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [item]);

  // Abaikan klik sisa dari gesture yang baru saja membuka popup
  const closeFromBackdrop = () => {
    if (Date.now() - openedAt.current < 300) return;
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {item && (
        <motion.div
          data-lenis-prevent
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeFromBackdrop}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={item.title}
            className="max-h-full w-full max-w-lg overflow-y-auto rounded-3xl bg-muted text-white shadow-2xl"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.4, ease }}
            onClick={(e) => e.stopPropagation()}
          >
            <img src={item.image} alt={item.title} className="aspect-video w-full object-cover" />

            <div className="p-6 md:p-8">
              <h3 className="text-2xl font-bold tracking-tight md:text-3xl">{item.title}</h3>
              <p className="mt-3 leading-relaxed text-white/70">{item.overview ?? item.description}</p>

              {item.tools?.length ? (
                <>
                  <h4 className="mt-6 text-lg font-bold">Tools</h4>
                  <Pills items={item.tools} />
                </>
              ) : null}

              <div className="mt-8 flex flex-wrap gap-3">
                {item.github && (
                  <a
                    href={item.github}
                    target="_blank"
                    rel="noreferrer"
                    className={`${btn} border-white bg-white text-black hover:border-accent hover:bg-accent`}
                  >
                    <GithubIcon />
                    GitHub
                  </a>
                )}
                {item.figma && (
                  <a
                    href={item.figma}
                    target="_blank"
                    rel="noreferrer"
                    className={`${btn} border-white bg-white text-black hover:border-accent hover:bg-accent`}
                  >
                    <FigmaIcon />
                    Figma
                  </a>
                )}
                {item.demo && (
                  <a
                    href={item.demo}
                    target="_blank"
                    rel="noreferrer"
                    className={`${btn} border-white bg-white text-black hover:border-accent hover:bg-accent`}
                  >
                    Demo
                  </a>
                )}
                
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}