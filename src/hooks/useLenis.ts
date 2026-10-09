import { useEffect } from "react";
import Lenis from "lenis";

export function useLenis() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ duration: 1.2, anchors: true });
    let id = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      id = requestAnimationFrame(raf);
    };
    id = requestAnimationFrame(raf);

    // Snap hanya saat scroll MENDEKATI section [data-snap].
    // Saat scroll menjauh (meninggalkan section), halaman tidak ditarik balik.
    let prev = 0;
    let snapping = false;

    lenis.on("scroll", () => {
      const dir = lenis.scroll > prev ? 1 : lenis.scroll < prev ? -1 : 0;
      prev = lenis.scroll;
      if (snapping || dir === 0) return;

      const vh = window.innerHeight;
      document.querySelectorAll<HTMLElement>("[data-snap]").forEach((el) => {
        if (snapping) return;
        const top = el.getBoundingClientRect().top;
        const approaching = (top > 4 && dir > 0) || (top < -4 && dir < 0);
        if (!approaching || Math.abs(top) > vh * 0.5) return;

        snapping = true;
        lenis.scrollTo(el, { duration: 0.9, lock: true, onComplete: () => (snapping = false) });
        window.setTimeout(() => (snapping = false), 1500); // pengaman
      });
    });

    return () => {
      cancelAnimationFrame(id);
      lenis.destroy();
    };
  }, []);
}