
import { useEffect } from "react";
import Lenis from "lenis";

export function useLenis() {
  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let lenis: Lenis | null = null;
    let rafId = 0;

    let programmaticScroll = false;
    let ignoreSnapUntil = 0;
    let navigationTimer: number | null = null;
    let snapTimer: number | null = null;
    let snapping = false;

    const clearSnapTimer = () => {
      if (snapTimer !== null) {
        window.clearTimeout(snapTimer);
        snapTimer = null;
      }
      snapping = false;
    };

    const finishNavigation = () => {
      programmaticScroll = false;

      if (navigationTimer !== null) {
        window.clearTimeout(navigationTimer);
        navigationTimer = null;
      }
    };

    const startNavigation = () => {
      programmaticScroll = true;

      // Jangan biarkan snap menginterupsi perpindahan ke Contact.
      ignoreSnapUntil = performance.now() + 1800;
      clearSnapTimer();

      if (navigationTimer !== null) {
        window.clearTimeout(navigationTimer);
      }

      // Fallback jika animasi tidak memanggil onComplete.
      navigationTimer = window.setTimeout(() => {
        programmaticScroll = false;
        navigationTimer = null;
      }, 4000);
    };

    const scrollToTarget = (target: HTMLElement | number) => {
      if (lenis) {
        startNavigation();

        lenis.scrollTo(target, {
          duration: 1.2,
          lock: true,
          force: true,
          onComplete: finishNavigation,
        });
      } else if (typeof target === "number") {
        window.scrollTo({
          top: target,
          behavior: "auto",
        });
      } else {
        target.scrollIntoView({
          behavior: "auto",
          block: "start",
        });
      }
    };

    const scrollToContact = () => {
      const contactElement =
        document.getElementById("contact");

      if (!contactElement) {
        console.warn(
          'Element with id="contact" was not found.'
        );
        return;
      }

      scrollToTarget(contactElement);
    };

    const scrollBack = () => {
      const top = Math.max(
        0,
        window.scrollY - window.innerHeight
      );

      scrollToTarget(top);
    };

    const removeWheelListeners = () => {
      window.removeEventListener(
        "portfolio:scroll-to-contact",
        scrollToContact
      );

      window.removeEventListener(
        "portfolio:scroll-back",
        scrollBack
      );
    };

    window.addEventListener(
      "portfolio:scroll-to-contact",
      scrollToContact
    );

    window.addEventListener(
      "portfolio:scroll-back",
      scrollBack
    );

    if (reduceMotion) {
      return () => {
        removeWheelListeners();
        clearSnapTimer();
        finishNavigation();
      };
    }

    const instance = new Lenis({
      duration: 1.2,
      anchors: true,
    });

    lenis = instance;

    const raf = (time: number) => {
      instance.raf(time);
      rafId = requestAnimationFrame(raf);
    };

    rafId = requestAnimationFrame(raf);

    let previousScroll = instance.scroll;

    instance.on("scroll", () => {
      const direction =
        instance.scroll > previousScroll
          ? 1
          : instance.scroll < previousScroll
            ? -1
            : 0;

      previousScroll = instance.scroll;

      // Penting: jangan snap ketika sedang menuju Contact
      // atau ketika animasi perpindahan baru saja selesai.
      if (
        programmaticScroll ||
        performance.now() < ignoreSnapUntil ||
        snapping ||
        direction === 0
      ) {
        return;
      }

      const viewportHeight = window.innerHeight;
      const snapElements =
        document.querySelectorAll<HTMLElement>(
          "[data-snap]"
        );

      for (const element of snapElements) {
        if (snapping || programmaticScroll) break;

        const top = element.getBoundingClientRect().top;

        const approaching =
          (top > 4 && direction > 0) ||
          (top < -4 && direction < 0);

        if (
          !approaching ||
          Math.abs(top) > viewportHeight * 0.5
        ) {
          continue;
        }

        snapping = true;

        if (snapTimer !== null) {
          window.clearTimeout(snapTimer);
        }

        instance.scrollTo(element, {
          duration: 0.9,
          lock: true,
          onComplete: clearSnapTimer,
        });

        snapTimer = window.setTimeout(
          clearSnapTimer,
          1500
        );

        break;
      }
    });

    return () => {
      removeWheelListeners();
      cancelAnimationFrame(rafId);
      clearSnapTimer();
      finishNavigation();

      instance.destroy();
      lenis = null;
    };
  }, []);
}