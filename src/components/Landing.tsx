import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, GitBranch, ScanLine, Shield } from "lucide-react";
import { ALL_POKEMON } from "../api/localPokeApi";
import {
  ALL_TYPES,
  STAT_LABELS,
  TYPE_COLORS,
  dexNumber,
  titleCase,
} from "../lib/pokemonTypes";
import { HeroShowpiece } from "./HeroShowpiece";
import { PokemonArt, TypePill } from "./primitives";

const byId = (id: number) => ALL_POKEMON.find((p) => p.id === id)!;

/** The cluster that floats beside the headline. */
const SHOWCASE = [658, 700, 716, 663, 681].map(byId);

/** Cards are ~92px tall, so stack them on a 98px rhythm with a slight drift. */
const FLOAT_OFFSETS = [
  { x: 0, y: 0, rotate: -3 },
  { x: 18, y: 98, rotate: 2.5 },
  { x: -12, y: 196, rotate: -2 },
  { x: 20, y: 294, rotate: 3.5 },
  { x: -6, y: 392, rotate: -4 },
];

export function Landing({ onLaunch }: { onLaunch: () => void }) {
  const reduce = useReducedMotion();

  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      <div
        aria-hidden="true"
        className="lab-grid pointer-events-none absolute inset-0 opacity-50"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(circle, rgba(56,232,200,0.16), transparent 66%)",
          filter: "blur(30px)",
        }}
      />

      <header className="relative z-20 mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="grid h-8 w-8 place-items-center rounded-full border border-accent/40 bg-accent/10"
          >
            <ScanLine size={15} strokeWidth={1.75} className="text-accent" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-ink">
            Kalos Pokédex
          </span>
        </div>
        <button
          onClick={onLaunch}
          className="rounded-full border border-line px-4 py-2 text-sm text-ink-dim transition hover:border-accent/40 hover:text-ink active:translate-y-px"
        >
          Launch Pokédex
        </button>
      </header>

      {/* ---------------------------- hero ---------------------------- */}
      {/*
        Three zones, explicitly placed: copy, the 3D showpiece, then the card
        column. One column stacked on mobile; at lg the showpiece tucks under
        the copy; at xl each zone gets its own column.
      */}
      <section className="relative mx-auto grid max-w-[1400px] items-center gap-10 px-4 pb-20 pt-14 sm:px-8 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-8 lg:pt-20 xl:grid-cols-[minmax(0,1fr)_320px_440px]">
        <motion.div
          className="lg:col-start-1 lg:row-start-1"
          initial={reduce ? false : { opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="max-w-[15ch] text-4xl font-semibold leading-[1.05] tracking-tighter text-ink sm:text-5xl lg:text-6xl">
            The Ultimate{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(96deg, var(--color-accent), #7fd4ff)",
              }}
            >
              Kalos Pokédex.
            </span>
          </h1>

          <p className="mt-6 max-w-[46ch] text-base leading-relaxed text-ink-dim sm:text-lg">
            Every record from Generation 1 to Generation 6, cross-referenced by
            type, evolution line, and base stat spread.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <motion.button
              onClick={onLaunch}
              whileHover={reduce ? undefined : { y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
              className="glass group inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 text-base font-semibold text-ink"
              style={{
                boxShadow:
                  "inset 0 1px 0 rgb(255 255 255 / 0.14), 0 18px 46px rgba(56,232,200,0.22)",
              }}
            >
              <span
                aria-hidden="true"
                className="grid h-6 w-6 place-items-center rounded-full bg-accent/20"
              >
                <ScanLine size={13} strokeWidth={2} className="text-accent" />
              </span>
              Launch Pokédex
              <ArrowRight
                size={17}
                strokeWidth={2}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </motion.button>

            <a
              href="#capabilities"
              className="rounded-full border border-line px-6 py-3.5 text-base text-ink-dim transition hover:border-white/20 hover:text-ink"
            >
              What is inside
            </a>
          </div>
        </motion.div>

        <div className="lg:col-start-1 lg:row-start-2 xl:col-start-2 xl:row-start-1">
          <HeroShowpiece />
          <p className="mt-4 text-center text-sm font-semibold text-ink">
            Ash Greninja
          </p>
        </div>

        {/* floating showcase */}
        <div className="relative h-[500px] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-[520px] xl:col-start-3 xl:row-span-1">
          {SHOWCASE.map((p, i) => {
            const typeNames = p.types.map((t) => t.type.name);
            const color = TYPE_COLORS[typeNames[0]].base;
            const offset = FLOAT_OFFSETS[i];
            return (
              <motion.div
                key={p.id}
                initial={
                  reduce
                    ? false
                    : { opacity: 0, y: offset.y + 40, x: offset.x, scale: 0.9 }
                }
                animate={{
                  opacity: 1,
                  x: offset.x,
                  y: reduce ? offset.y : [offset.y, offset.y - 9, offset.y],
                  scale: 1,
                }}
                transition={{
                  opacity: { duration: 0.6, delay: 0.15 + i * 0.11 },
                  scale: { duration: 0.6, delay: 0.15 + i * 0.11 },
                  x: { duration: 0.6, delay: 0.15 + i * 0.11 },
                  y: reduce
                    ? { duration: 0.6, delay: 0.15 + i * 0.11 }
                    : {
                        duration: 5.5 + i * 0.6,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.15 + i * 0.11,
                      },
                }}
                whileHover={reduce ? undefined : { scale: 1.04, zIndex: 10 }}
                className="glass absolute left-0 right-0 mx-auto flex w-[min(92%,340px)] items-center gap-4 rounded-[16px] p-3.5 lg:left-auto lg:right-0 lg:mx-0"
                style={{
                  rotate: `${offset.rotate}deg`,
                  borderColor: `color-mix(in srgb, ${color} 45%, transparent)`,
                  boxShadow: `0 0 0 1px color-mix(in srgb, ${color} 22%, transparent), 0 22px 55px color-mix(in srgb, ${color} 20%, transparent)`,
                }}
              >
                <div
                  className="grid h-16 w-16 shrink-0 place-items-center rounded-full"
                  style={{
                    background: `radial-gradient(circle, color-mix(in srgb, ${color} 26%, transparent), transparent 70%)`,
                  }}
                >
                  <PokemonArt
                    src={p.sprites.other["official-artwork"].front_default}
                    name={p.name}
                    types={typeNames}
                    className="h-14 w-14"
                    eager
                  />
                </div>
                <div className="min-w-0">
                  <span className="font-mono text-[11px] tracking-[0.14em] text-ink-faint">
                    {dexNumber(p.id)}
                  </span>
                  <p className="text-sm font-semibold text-ink">
                    {titleCase(p.name)}
                  </p>
                  <div className="mt-1.5 flex gap-1.5">
                    {typeNames.map((t) => (
                      <TypePill key={t} type={t} size="sm" />
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ------------------------ capabilities ------------------------ */}
      <section
        id="capabilities"
        className="relative mx-auto max-w-[1400px] px-4 pb-20 sm:px-8"
      >
        <h2 className="max-w-[20ch] text-3xl font-semibold tracking-tighter text-ink sm:text-4xl">
          Three ways to read a Pokémon.
        </h2>

        <div className="mt-9 grid gap-4 lg:grid-cols-[1.15fr_1fr] lg:grid-rows-2">
          <FeatureCell
            className="lg:row-span-2"
            icon={<Shield size={17} strokeWidth={1.75} />}
            title="Type analysis"
            body="Pick any of the eighteen types and pull every Pokemon that carries it, alongside its full offensive and defensive multipliers."
            visual={<TypeGridVisual />}
          />
          <FeatureCell
            icon={<GitBranch size={17} strokeWidth={1.75} />}
            title="Evolution tracking"
            body="Every family drawn as a flow chart, with the level or item that triggers each step."
            visual={<EvolutionVisual />}
          />
          <FeatureCell
            icon={<ScanLine size={17} strokeWidth={1.75} />}
            title="Base stat visualisation"
            body="Six-stat spreads rendered as animated bars so a glass cannon reads differently from a wall."
            visual={<StatVisual />}
          />
        </div>
      </section>

      {/* --------------------------- closing --------------------------- */}
      <section className="relative border-t border-line px-4 py-20 text-center sm:px-8">
        <h2 className="mx-auto max-w-[18ch] text-3xl font-semibold tracking-tighter text-ink sm:text-4xl">
          {ALL_POKEMON.length} records. Six generations.
        </h2>
        <p className="mx-auto mt-4 max-w-[48ch] text-base text-ink-dim">
          The dex runs entirely on local data, so it opens instantly and works
          offline.
        </p>
        <motion.button
          onClick={onLaunch}
          whileHover={reduce ? undefined : { y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="glass mt-8 inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 text-base font-semibold text-ink"
        >
          Launch Pokédex
          <ArrowRight size={17} strokeWidth={2} />
        </motion.button>
      </section>

      <footer className="relative border-t border-line px-4 py-8 sm:px-8">
        <p className="mx-auto max-w-[1400px] text-xs text-ink-faint">
          A fan-built Pokédex running on a local dataset. Pokémon and all related
          names are trademarks of Nintendo, Creatures Inc. and GAME FREAK Inc.
        </p>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function FeatureCell({
  icon,
  title,
  body,
  visual,
  className = "",
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  visual: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col overflow-hidden rounded-[16px] border border-line bg-surface/70 p-6 sm:p-7 ${className}`}
    >
      <span className="grid h-9 w-9 place-items-center rounded-full border border-accent/30 bg-accent/10 text-accent">
        {icon}
      </span>
      <h3 className="mt-4 text-lg font-semibold tracking-tight text-ink">
        {title}
      </h3>
      <p className="mt-2 max-w-[48ch] text-sm leading-relaxed text-ink-dim">
        {body}
      </p>
      {/* the child stretches to the cell height so tall cells stay filled */}
      <div className="mt-6 flex flex-1 [&>*]:w-full">{visual}</div>
    </motion.article>
  );
}

function TypeGridVisual() {
  return (
    <div className="grid h-full auto-rows-fr grid-cols-3 gap-1.5 sm:grid-cols-6 lg:grid-cols-5">
      {ALL_TYPES.map((t) => {
        const { base, soft } = TYPE_COLORS[t];
        return (
          <span
            key={t}
            className="grid place-items-center rounded-[16px] border px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.08em]"
            style={{
              color: base,
              backgroundColor: soft,
              borderColor: `color-mix(in srgb, ${base} 30%, transparent)`,
            }}
          >
            {t}
          </span>
        );
      })}
    </div>
  );
}

function EvolutionVisual() {
  const line = [byId(656), byId(657), byId(658)];
  return (
    <div className="flex items-center justify-between gap-2">
      {line.map((p, i) => {
        const typeNames = p.types.map((t) => t.type.name);
        const color = TYPE_COLORS[typeNames[0]].base;
        return (
          <div key={p.id} className="flex flex-1 items-center gap-2">
            <div
              className="grid h-16 w-16 shrink-0 place-items-center rounded-full border border-line"
              style={{
                background: `radial-gradient(circle, color-mix(in srgb, ${color} 20%, transparent), transparent 72%)`,
              }}
            >
              <PokemonArt
                src={p.sprites.other["official-artwork"].front_default}
                name={p.name}
                types={typeNames}
                className="h-12 w-12"
              />
            </div>
            {i < line.length - 1 && (
              <span
                aria-hidden="true"
                className="h-px flex-1 bg-gradient-to-r from-accent/50 to-accent/10"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatVisual() {
  const greninja = byId(658);
  const color = TYPE_COLORS.water.base;
  return (
    <div className="grid content-center gap-2">
      {greninja.stats.map((s) => (
        <div
          key={s.stat.name}
          className="grid grid-cols-[62px_1fr_28px] items-center gap-2.5"
        >
          <span className="text-[11px] text-ink-faint">
            {STAT_LABELS[s.stat.name]}
          </span>
          <span className="h-1.5 overflow-hidden rounded-full bg-surface-2">
            <motion.span
              className="block h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, color-mix(in srgb, ${color} 45%, transparent), ${color})`,
              }}
              initial={{ width: 0 }}
              whileInView={{ width: `${(s.base_stat / 180) * 100}%` }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
          </span>
          <span className="text-right font-mono text-[11px] text-ink-dim">
            {s.base_stat}
          </span>
        </div>
      ))}
    </div>
  );
}
