import { useRef, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { TYPE_COLORS } from "../lib/pokemonTypes";

/**
 * The hero centrepiece. There is no 3D model here: depth comes from a
 * perspective wrapper plus three layers that move at different rates as the
 * pointer travels, so the artwork reads as a lit figure standing off the page
 * rather than a flat cutout.
 *
 * Swap `public/hero-greninja.png` to change the artwork; nothing else needs to
 * move.
 */
const WATER = TYPE_COLORS.water.base;
const DARK = TYPE_COLORS.dark.base;

export function HeroShowpiece() {
  const reduce = useReducedMotion();
  const frame = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  // Pointer position normalised to -0.5..0.5. Motion values stay off the React
  // render path, so tracking the cursor costs no re-renders.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spring = { stiffness: 140, damping: 18, mass: 0.6 };
  const sx = useSpring(px, spring);
  const sy = useSpring(py, spring);

  const rotateY = useTransform(sx, [-0.5, 0.5], [18, -18]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [-14, 14]);
  const artX = useTransform(sx, [-0.5, 0.5], [-16, 16]);
  const artY = useTransform(sy, [-0.5, 0.5], [-10, 10]);
  const auraX = useTransform(sx, [-0.5, 0.5], [26, -26]);
  const auraY = useTransform(sy, [-0.5, 0.5], [18, -18]);
  const shadowScale = useTransform(sy, [-0.5, 0.5], [0.88, 1.08]);

  // The specular sheen tracks the pointer across the figure.
  const sheenX = useTransform(sx, [-0.5, 0.5], ["18%", "82%"]);
  const sheenY = useTransform(sy, [-0.5, 0.5], ["22%", "78%"]);
  const sheen = useMotionTemplate`radial-gradient(58% 52% at ${sheenX} ${sheenY}, rgba(255,255,255,0.20), transparent 68%)`;

  const track = (e: React.PointerEvent) => {
    if (reduce || e.pointerType === "touch") return;
    const box = frame.current?.getBoundingClientRect();
    if (!box) return;
    px.set((e.clientX - box.left) / box.width - 0.5);
    py.set((e.clientY - box.top) / box.height - 0.5);
  };

  const release = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <div
      ref={frame}
      onPointerMove={track}
      onPointerLeave={release}
      className="relative mx-auto flex h-[360px] w-full max-w-[340px] items-center justify-center sm:h-[420px] lg:h-[440px]"
      style={{ perspective: "1100px" }}
    >
      {/* aura, furthest back, drifts against the tilt to open up the depth */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute h-[280px] w-[280px] rounded-full sm:h-[320px] sm:w-[320px]"
        style={{
          x: reduce ? 0 : auraX,
          y: reduce ? 0 : auraY,
          background: `radial-gradient(circle, color-mix(in srgb, ${WATER} 58%, transparent), color-mix(in srgb, ${DARK} 20%, transparent) 54%, transparent 74%)`,
          filter: "blur(38px)",
        }}
        animate={reduce ? undefined : { opacity: [0.68, 0.92, 0.68] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* thin ring, reads as the lab platform the figure stands on */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-10 h-[168px] w-[240px] rounded-[50%] border sm:w-[280px]"
        style={{
          rotateX: 68,
          borderColor: `color-mix(in srgb, ${WATER} 34%, transparent)`,
          background: `radial-gradient(closest-side, color-mix(in srgb, ${WATER} 16%, transparent), transparent 78%)`,
          scale: reduce ? 1 : shadowScale,
        }}
      />

      {/* the figure */}
      <motion.div
        className="relative h-full w-full"
        style={{
          transformStyle: "preserve-3d",
          rotateX: reduce ? 0 : rotateX,
          rotateY: reduce ? 0 : rotateY,
        }}
        initial={reduce ? false : { opacity: 0, y: 34, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          className="relative h-full w-full"
          style={{ x: reduce ? 0 : artX, y: reduce ? 0 : artY }}
          animate={reduce ? undefined : { translateY: [0, -12, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          {failed ? (
            <div
              className="grid h-full w-full place-items-center rounded-full"
              style={{
                background: `radial-gradient(circle at 42% 34%, color-mix(in srgb, ${WATER} 34%, transparent), transparent 68%)`,
              }}
              role="img"
              aria-label="Greninja artwork unavailable"
            >
              <span
                className="font-mono text-6xl font-bold"
                style={{ color: WATER }}
              >
                G
              </span>
            </div>
          ) : (
            <>
              <img
                src="/hero-greninja.png"
                alt="Greninja, the Ninja Pokémon, poised mid-stance"
                width={475}
                height={475}
                fetchPriority="high"
                decoding="async"
                onError={() => setFailed(true)}
                className="h-full w-full object-contain"
                style={{
                  filter: `drop-shadow(0 22px 34px rgba(0,0,0,0.55)) drop-shadow(0 0 52px color-mix(in srgb, ${WATER} 45%, transparent)) saturate(1.1) brightness(1.06)`,
                  transform: "translateZ(46px)",
                }}
              />
              {/* Sheen is masked to the artwork's own alpha, so the highlight
                  lands on the figure instead of on a floating rectangle. */}
              <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 mix-blend-soft-light"
                style={{
                  background: reduce ? "none" : sheen,
                  transform: "translateZ(60px)",
                  maskImage: "url(/hero-greninja.png)",
                  WebkitMaskImage: "url(/hero-greninja.png)",
                  maskSize: "contain",
                  WebkitMaskSize: "contain",
                  maskRepeat: "no-repeat",
                  WebkitMaskRepeat: "no-repeat",
                  maskPosition: "center",
                  WebkitMaskPosition: "center",
                }}
              />
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
