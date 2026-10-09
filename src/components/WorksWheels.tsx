// A portfolio index built as a wheel you turn.
//
// At rest the work sits in a ring around a title, each card tangent to the
// circle. The first notch of scroll blows the ring open into a vertical drum:
// the card at the front lies flat and full size, the ones above and below
// rotate away into hard perspective and run off the top and bottom of the
// frame. Keep turning and the drum carries the next piece round to the front.
//
// The whole thing is one number - `turn` - read by a single rAF pass that writes
// transforms straight to the DOM. 0 is the ring, 1 is the drum with item 0 at
// the front, and every whole number after that is one more item turned past.
import * as React from "react";

import { cn } from "../lib/utils";
import WorkModal from "./WorkModal";

export interface WorksWheelItem {
  /** Project name. Shown beside the front card and in the index. */
  title: string;
  /** Cover art. Any src an <img> takes. */
  image: string;
  /** Where the card links to. Omit for a wheel that only browses. */
  github?: string;

  description?: string;

  overview ?: string;

  tools ?: string[];
}

export interface WorksWheelProps extends Omit<
  React.ComponentPropsWithoutRef<"section">,
  "children"
> {
  items: WorksWheelItem[];
  /** Sits in the middle of the ring. @default undefined */
  label?: string;
  /** Label on the card's hover affordance. Omit to drop it. @default undefined */
  action?: string;
}

/* Geometry. The card is measured against the stage; everything else is measured
   against the card, so a narrow stage - where the card is capped by width, not
   height - scales the whole wheel down with it instead of leaving a small card
   swinging on a huge drum. The three that matter are tuned together: STEP
   against DRUM sets how hard the neighbours rotate away, and DRUM against LENS
   decides whether they land inside the frame or run off it. */
const CARD_H = 0.38; // front card height, of the stage
const CARD_MAX_W = 0.34; // ... but never wider than this much of the stage
const CARD_RATIO = 1.45; // card width / height
const STEP = 40; // degrees between cards on the drum
const DRUM = 2.22; // drum radius, in card heights - and everything below likewise
const LENS = 2.7; // perspective distance
const RING_R = 1.14; // ring radius
/* The drum alone hangs the work on a plumb line. It isn't one: the strip curves
   away round an arc whose centre sits off to the LEFT, so the piece at the front
   is at the arc's near point - dead centre - and its neighbours have already
   swung back left as well as up and down. BOW is that arc's radius; nothing else
   makes the difference between a stack of cards and a wheel seen side on. */
const BOW = 1.82;
const TITLE = 0.124; // ring label and front-card title
const INDEX = 0.04; // the index down the right-hand side
/** Items either side of the front still worth drawing. Past this a card is
    edge-on, and further round it would stack up on the vanishing point. */
const CULL = 1.6;

/** How much of a wheel-notch or a dragged pixel counts as one item. */
const WHEEL_UNITS = 900;
const DRAG_UNITS = 420;
/** Quiet time after the last wheel event before the wheel settles on an item. */
const SETTLE = 140;
/** Events within this window are considered part of the same wheel gesture. */
const END_GESTURE_GAP = 220;
/** Fraction of the remaining distance closed each frame. 1 = no smoothing. */
const EASE = 0.12;
const START_EPS = 0.001;
const SWIPE_MIN = 30;


const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Normalise wheel deltas to pixels (Firefox reports lines/pages). */
const wheelPixels = (event: WheelEvent) =>
  event.deltaMode === 1
    ? event.deltaY * 16
    : event.deltaMode === 2
      ? event.deltaY * window.innerHeight
      : event.deltaY;

type Stage = { w: number; h: number };

const rad = (deg: number) => (deg * Math.PI) / 180;

/** How far left the arc has carried something that has turned `drumDeg` off the
    front. Zero at the front, so the piece being read stays centred. */
const bowAt = (drumDeg: number, bow: number) =>
  -bow * (1 - Math.cos(rad(drumDeg)));

/** Both states in one chain: the ring terms fall away as `m` reaches the drum,
    and the drum terms are still zero while the ring is up. The bow is applied
    first, in the wheel's own plane, so it slides the card sideways rather than
    turning with it - and perspective still shrinks it with distance. */
function place(
  ringDeg: number,
  drumDeg: number,
  ringR: number,
  drumR: number,
  bow: number,
  m: number,
) {
  return (
    `translateX(${m * bowAt(drumDeg, bow)}px)` +
    ` rotateZ(${(1 - m) * ringDeg}deg) translateY(${-(1 - m) * ringR}px)` +
    ` rotateX(${m * drumDeg}deg) translateZ(${m * drumR}px)`
  );
}

export function WorksWheel({
  items,
  label = "Works '26",
  action = "View",
  className,
  ...props
}: WorksWheelProps) {
  const stageRef = React.useRef<HTMLDivElement>(null);
  const wheelRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<(HTMLElement | null)[]>([]);
  const labelRef = React.useRef<HTMLDivElement>(null);
  const titleRef = React.useRef<HTMLDivElement>(null);

  // The wheel's position, and where it is heading. Only `active` is state -
  // everything else is written to the DOM, so turning the wheel is not a render.
  const turn = React.useRef(0);
  const target = React.useRef(0);
  const [active, setActive] = React.useState(0);
  const [stage, setStage] = React.useState<Stage>({ w: 0, h: 0 });
  const [selected, setSelected] = React.useState<WorksWheelItem | null>(null);
  const pressed = React.useRef<{ x: number; y: number; index: number } | null>(null);
  const endUnlocked = React.useRef(false);

  const count = items.length;
  const last = Math.max(count - 1, 0);

  // Read after mount, not during render: the server has no matchMedia, and
  // branching on it inline is a hydration mismatch. Reduced motion drops the
  // easing, so the wheel lands where it is put instead of gliding there.
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const read = () => setReduced(query.matches);
    read();
    query.addEventListener("change", read);
    return () => query.removeEventListener("change", read);
  }, []);

  React.useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const read = () => setStage({ w: el.clientWidth, h: el.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const metrics = React.useMemo(() => {
    const { w, h } = stage;
    const cardW = Math.min(h * CARD_H * CARD_RATIO, w * CARD_MAX_W);
    const cardH = cardW / CARD_RATIO;
    const drumR = cardH * DRUM;
    const ringR = cardH * RING_R;
    // Shrink the ring's cards until the circle reads as a closed loop rather
    // than beads on a wire, however many pieces the wheel is given.
    const ringScale = count
      ? clamp((((2 * Math.PI * ringR) / count) * 0.82) / (cardW || 1), 0.16, 1)
      : 1;
    return {
      cardW,
      cardH,
      ringR,
      ringScale,
      drumR,
      bow: cardH * BOW,
      depth: cardH * LENS,
      title: cardH * TITLE,
      index: cardH * INDEX,
    };
  }, [stage, count]);

  // One pass per frame: ease toward the target, then write every transform.
  React.useEffect(() => {
    if (!stage.h) return;
    let frame = 0;
    const { ringR, ringScale, drumR, bow } = metrics;

    const draw = () => {
      frame = requestAnimationFrame(draw);
      const gap = target.current - turn.current;
      if (Math.abs(gap) < 0.0005) turn.current = target.current;
      else turn.current += gap * (reduced ? 1 : EASE);

      const t = turn.current;
      const m = clamp(t, 0, 1);
      const pos = Math.max(0, t - 1);

      // The drum is pulled back so its front face lands on the picture plane.
      // That set-back has to arrive with the drum, or the ring would sit at the
      // far side of the perspective and render at half its size.
      if (wheelRef.current) {
        wheelRef.current.style.transform = `translateZ(${-m * drumR}px)`;
      }

      for (let i = 0; i < count; i++) {
        const d = i - pos;
        const drumDeg = -d * STEP;
        const card = cardRefs.current[i];
        if (card) {
          card.style.transform = place(
            d * (360 / count),
            drumDeg,
            ringR,
            drumR,
            bow,
            m,
          );
          // Culled by distance, not by angle: at a full turn the far side comes
          // back round to face us, and everything past the neighbours lands on
          // the vanishing point in a heap.
          card.style.opacity = m > 0.5 && Math.abs(d) > CULL ? "0" : "1";
          card.style.zIndex = String(Math.round(100 - Math.abs(d) * 2));
        }
        const face = card?.firstElementChild as HTMLElement | null;
        if (face) face.style.transform = `scale(${lerp(ringScale, 1, m)})`;
      }

      if (labelRef.current) labelRef.current.style.opacity = String(1 - m);
      if (titleRef.current) titleRef.current.style.opacity = String(m);
      const near = clamp(Math.round(pos), 0, last);
      setActive((prev) => (prev === near ? prev : near));
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [metrics, stage.h, count, last, reduced]);

  const to = React.useCallback(
    (next: number) => {
      const clamped = clamp(next, 0, last + 1);
      target.current = clamped;

      // Returning from the last project to an earlier item resets the exit gate.
      if (clamped < last + 0.999) {
        endUnlocked.current = false;
      }
    },
    [last],
  );

  const drag = React.useRef<number | null>(null);
  const settling = React.useRef(0);
  const pointerStartY = React.useRef<number | null>(null);
  const pointerStartedAtStart = React.useRef(false);
  const pointerStartedAtEnd = React.useRef(false);
  const lastWheelAt = React.useRef(Number.NEGATIVE_INFINITY);
  const burstStartedAtStart = React.useRef(false);

  // Native listener, because the wheel needs to be cancellable. Inside the
  // wheel it owns the scroll; at the final item we deliberately require a few
  // distinct downward wheel gestures before handing control back to the page.
  React.useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      // Only take over while the wheel section is close to filling the viewport.
      if (Math.abs(el.getBoundingClientRect().top) > window.innerHeight * 0.15) return;

      // Positive = scrolling down = forward, same as the page.
      const pixels = wheelPixels(event);
      const direction = Math.sign(pixels);
      const atStart = target.current <= START_EPS;
      const atEnd = target.current >= last + 0.999;

      // Remember whether this physical gesture began at the ring, so a flick that
      // merely arrives there doesn't carry on out of the wheel.
      const now = performance.now();
      if (now - lastWheelAt.current > END_GESTURE_GAP) {
        burstStartedAtStart.current = atStart;
      }
      lastWheelAt.current = now;

      // Sideways-only swipe: nothing to turn, just block browser back/forward.
      if (direction === 0) {
        event.preventDefault();
        return;
      }

      
    if (direction < 0) {
        endUnlocked.current = false;

        // Kalau sudah di awal ring, biarkan halaman scroll ke atas.
        if (atStart && burstStartedAtStart.current) return;
        }

    // Di project terakhir, satu scroll maju langsung menuju Contact.
    if (direction > 0 && atEnd) {
    // Event berikutnya dibiarkan diteruskan ke Lenis.
        if (endUnlocked.current) return;

        event.preventDefault();
        event.stopPropagation();

        endUnlocked.current = true;

        window.dispatchEvent(
            new Event("portfolio:scroll-to-contact")
        );

        return;
    }

      // Scroll down (+) advances, scroll up (-) goes back.
      event.preventDefault();
      event.stopPropagation();
      to(target.current + pixels / WHEEL_UNITS);

      window.clearTimeout(settling.current);
      settling.current = window.setTimeout(
        () => to(Math.round(target.current)),
        SETTLE,
      );
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      window.clearTimeout(settling.current);
    };
  }, [to, last]);

  return (
    <section
      aria-label={label}
      className={cn(
        "bg-background text-foreground relative h-full min-h-[24rem] w-full overflow-hidden select-none",
        className,
      )}
      {...props}
    >
      <div
        ref={stageRef}
        tabIndex={0}
        role="listbox"
        aria-label={label}
        aria-activedescendant={`works-wheel-${active}`}
        className="focus-visible:outline-foreground absolute inset-0 cursor-grab touch-pan-x outline-none focus-visible:outline-2 focus-visible:-outline-offset-4 active:cursor-grabbing"
        style={{ perspective: `${metrics.depth}px` }}
        
        onPointerDown={(event) => {
          drag.current = event.clientY;
          pointerStartY.current = event.clientY;
          pointerStartedAtStart.current = target.current <= START_EPS;
          pointerStartedAtEnd.current = target.current >= last + 0.999;

          const card = (event.target as HTMLElement).closest<HTMLElement>(
            "[data-index]",
          );

          pressed.current = card
            ? {
                x: event.clientX,
                y: event.clientY,
                index: Number(card.dataset.index),
              }
            : null;

          event.currentTarget.setPointerCapture(event.pointerId);
        }}

        onPointerMove={(event) => {
          if (drag.current === null) return;

          // Finger/pointer moving UP = scrolling down = next project.
          const step = (drag.current - event.clientY) / DRAG_UNITS;
          drag.current = event.clientY;

          // On the last project a forward touch swipe is counted on release.
          if (
            event.pointerType === "touch" &&
            step > 0 &&
            target.current >= last + 0.999
          ) {
            return;
          }

          to(target.current + step);
        }}

        onPointerUp={(event) => {
          const startY = pointerStartY.current;
          const startedAtStart = pointerStartedAtStart.current;
          const startedAtEnd = pointerStartedAtEnd.current;

          // Negative = finger moved up; positive = finger moved down.
          const deltaY = startY === null ? 0 : event.clientY - startY;
          const swiped =
            event.pointerType === "touch" && Math.abs(deltaY) > SWIPE_MIN;

          drag.current = null;
          pointerStartY.current = null;
          pointerStartedAtStart.current = false;
          pointerStartedAtEnd.current = false;

          const p = pressed.current;
          pressed.current = null;

          // Swipe up on the last project = scroll down: counts towards Contact.
          
        if (
            swiped &&
            deltaY < 0 &&
            startedAtEnd &&
            target.current >= last + 0.999
        ) {
            event.preventDefault();
            event.stopPropagation();

        if (!endUnlocked.current) {
            endUnlocked.current = true;

            window.dispatchEvent(
            new Event("portfolio:scroll-to-contact")
            );
        }

        return;
    }

          // Swipe down on the ring = scroll up: ask the page to move back up.
          if (
            swiped &&
            deltaY > 0 &&
            startedAtStart &&
            target.current <= START_EPS
          ) {
            window.dispatchEvent(new Event("portfolio:scroll-back"));
            return;
          }

          // Tapping a card still opens it.
          if (
            p &&
            Math.hypot(event.clientX - p.x, event.clientY - p.y) < 6
          ) {
            setSelected(items[p.index]);
            to(p.index + 1);
            return;
          }

          // Land on the nearest project (or the ring), like the wheel does.
          to(Math.round(target.current));
        }}

        onPointerCancel={() => {
          drag.current = null;
          pointerStartY.current = null;
          pointerStartedAtStart.current = false;
          pointerStartedAtEnd.current = false;
          pressed.current = null;
          to(Math.round(target.current));
        }}
      >
        <div
          ref={wheelRef}
          className="absolute top-1/2 left-1/2 [transform-style:preserve-3d]"
        >
          {items.map((item, i) => (
            <div
                key={item.title}
                id={`works-wheel-${i}`}
                data-index={i}
                role="option"
                aria-selected={i === active}
                ref={(node) => {
                cardRefs.current[i] = node;
                }}
                className="group absolute cursor-pointer [backface-visibility:hidden]"
                style={{
                width: metrics.cardW,
                height: metrics.cardH,
                marginLeft: -metrics.cardW / 2,
                marginTop: -metrics.cardH / 2,
                }}
            >
                <span className="bg-muted shadow-foreground/12 relative block size-full overflow-hidden rounded-lg shadow-[0_18px_40px_-18px_var(--tw-shadow-color)]">
                <img
                    src={item.image}
                    alt={item.title}
                    draggable={false}
                    className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {action ? (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="translate-y-2 text-sm font-medium tracking-wide text-white transition-transform duration-300 group-hover:translate-y-0">
                        {action}
                    </span>
                    </span>
                ) : null}
                </span>
            </div>
            ))}
        </div>
    </div>

      {/* Ring title and front-card title trade places across the transition.
          Type is sized off the measured stage, not vh, so the wheel keeps its
          proportions inside a card as well as at full bleed. */}
      <div
        ref={labelRef}
        className="pointer-events-none absolute inset-0 grid place-items-center tracking-tight"
        style={{ fontSize: metrics.title }}
      >
        {label}
      </div>
     <div
        ref={titleRef}
        className="pointer-events-none absolute top-1/2 left-[8%] -translate-y-1/2 tracking-tight opacity-0"
        style={{ fontSize: metrics.title }}
        >
        {items[active]?.title}
        {items[active]?.description ? (
            <p
            className="text-muted-foreground absolute top-full left-0 mt-4 w-[26em] max-w-[28vw] leading-relaxed tracking-normal"
            style={{ fontSize: metrics.index }}
            >
            {items[active]?.description}
            </p>
        ) : null}
    </div>

      <ol
        className="text-muted-foreground absolute top-[7.5%] right-[2.5%] text-right leading-[1.75]"
        style={{ fontSize: metrics.index }}
      >
        {items.map((item, i) => (
          <li key={item.title}>
            <button
              type="button"
              onClick={() => to(i + 1)}
              className={cn(
                "focus-visible:outline-foreground cursor-pointer transition-colors outline-none focus-visible:outline-1",
                i === active && "text-foreground font-medium",
              )}
            >
              {item.title}
            </button>
          </li>
        ))}
      </ol>
      <WorkModal item={selected} onClose={() => setSelected(null)} />
    </section>
  );
}

export default WorksWheel;
