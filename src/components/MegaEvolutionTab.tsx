import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Radio, Sparkles, X } from "lucide-react";
import {
  MEGA_FORM_COUNT,
  fetchMegaEvolutions,
  type MegaDebut,
  type MegaEvolution,
} from "../api/pokeApi";
import { useAsync } from "../hooks/useAsync";
import { STAT_LABELS, TYPE_COLORS, dexNumber, titleCase } from "../lib/pokemonTypes";
import { ErrorState, GridSkeleton, PokemonArt, TypePill } from "./primitives";

/** Mega Mewtwo Y's 194 Special Attack is the Gen 6 peak; round up for headroom. */
const STAT_CEILING = 200;

const FILTERS = [
  { id: "all", label: "All 48" },
  { id: "X / Y", label: "X / Y" },
  { id: "Omega Ruby / Alpha Sapphire", label: "Omega Ruby / Alpha Sapphire" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

const EASE = [0.16, 1, 0.3, 1] as const;

export function MegaEvolutionTab() {
  const [filter, setFilter] = useState<FilterId>("all");
  const [selected, setSelected] = useState<MegaEvolution | null>(null);
  const reduce = useReducedMotion();

  const { data, loading, error, reload } = useAsync<MegaEvolution[]>(
    () => fetchMegaEvolutions(),
    [],
  );

  const megas = useMemo(
    () =>
      (data ?? []).filter(
        (m) => filter === "all" || m.debut === (filter as MegaDebut),
      ),
    [data, filter],
  );

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-ink">
            Mega Evolution
          </h2>
          <p className="mt-1 max-w-[62ch] text-sm text-ink-dim">
            Every one of the {MEGA_FORM_COUNT} Mega Evolutions introduced in
            Generation 6, pulled live from PokeAPI. Open one to see what the
            stone does to its typing and its stat spread.
          </p>
        </div>

        <motion.span
          initial={reduce ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-accent/35 bg-accent/10 px-3.5 py-1.5 text-xs font-semibold text-accent"
        >
          <motion.span
            aria-hidden="true"
            animate={reduce ? undefined : { opacity: [1, 0.35, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="flex"
          >
            <Radio size={14} strokeWidth={2} />
          </motion.span>
          Live from PokeAPI
        </motion.span>
      </div>

      {/* debut filter */}
      <div
        role="radiogroup"
        aria-label="Mega Evolution debut"
        className="mt-6 flex flex-wrap gap-2"
      >
        {FILTERS.map(({ id, label }) => {
          const active = id === filter;
          return (
            <button
              key={id}
              role="radio"
              aria-checked={active}
              onClick={() => setFilter(id)}
              className={`relative rounded-full px-4 py-2 text-sm transition-colors ${
                active ? "text-ink" : "text-ink-dim hover:text-ink"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="mega-filter-pill"
                  className="absolute inset-0 rounded-full border border-accent/35 bg-accent/12"
                  transition={
                    reduce
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 420, damping: 34 }
                  }
                />
              )}
              <span className="relative z-10">{label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-7">
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading ? (
          <GridSkeleton count={8} />
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            <AnimatePresence mode="popLayout">
              {megas.map((mega, i) => (
                <MegaCard
                  key={mega.slug}
                  mega={mega}
                  index={i}
                  onSelect={setSelected}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <MegaDetail mega={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

/* --------------------------------- card ---------------------------------- */

function MegaCard({
  mega,
  index,
  onSelect,
}: {
  mega: MegaEvolution;
  index: number;
  onSelect: (mega: MegaEvolution) => void;
}) {
  const reduce = useReducedMotion();
  const primary = TYPE_COLORS[mega.types[0]].base;
  const secondary = TYPE_COLORS[mega.types[1] ?? mega.types[0]].base;
  const gain = mega.total - mega.baseTotal;

  return (
    <motion.button
      type="button"
      layout
      onClick={() => onSelect(mega)}
      initial={reduce ? false : { opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, scale: 0.96 }}
      transition={{
        duration: 0.42,
        delay: reduce ? 0 : Math.min(index * 0.03, 0.36),
        ease: EASE,
      }}
      whileHover={reduce ? undefined : { y: -6 }}
      whileTap={{ scale: 0.985 }}
      aria-label={`Open the ${mega.displayName} breakdown`}
      className="group relative overflow-hidden rounded-[16px] border border-line bg-surface p-5 text-left transition-colors duration-300"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, ${primary} 22%, transparent), transparent 62%)`,
        }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[16px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${primary} 55%, transparent)`,
        }}
      />

      <div className="relative">
        <motion.div
          className="mx-auto grid h-32 w-32 place-items-center rounded-full"
          style={{
            background: `radial-gradient(circle at 50% 60%, color-mix(in srgb, ${secondary} 20%, transparent), transparent 70%)`,
          }}
          whileHover={reduce ? undefined : { scale: 1.06, rotate: -1.5 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
        >
          <PokemonArt
            src={mega.artwork}
            name={mega.displayName}
            types={mega.types}
            className="h-28 w-28"
          />
        </motion.div>

        <div className="mt-5 flex items-baseline justify-between gap-3">
          <span className="font-mono text-xs tracking-[0.14em] text-ink-faint">
            {dexNumber(mega.speciesId)}
          </span>
          <span className="font-mono text-xs text-ink-faint">
            BST {mega.total}
            {gain > 0 && <span className="text-accent"> +{gain}</span>}
          </span>
        </div>

        <h3 className="mt-1 text-lg font-semibold tracking-tight text-ink">
          {mega.displayName}
        </h3>
        <p className="mt-0.5 text-xs text-ink-dim">{mega.ability}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {mega.types.map((t) => (
            <TypePill key={t} type={t} size="sm" />
          ))}
        </div>
      </div>
    </motion.button>
  );
}

/* -------------------------------- detail --------------------------------- */

function MegaDetail({
  mega,
  onClose,
}: {
  mega: MegaEvolution | null;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mega) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [mega, onClose]);

  return (
    <AnimatePresence>
      {mega && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.button
            aria-label="Close detail view"
            tabIndex={-1}
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-void/80 backdrop-blur-sm"
          />
          <MegaDetailBody
            mega={mega}
            onClose={onClose}
            closeRef={closeRef}
            reduce={!!reduce}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MegaDetailBody({
  mega,
  onClose,
  closeRef,
  reduce,
}: {
  mega: MegaEvolution;
  onClose: () => void;
  closeRef: React.RefObject<HTMLButtonElement>;
  reduce: boolean;
}) {
  const primary = TYPE_COLORS[mega.types[0]].base;
  const gainedTypes = mega.types.filter((t) => !mega.baseTypes.includes(t));

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mega-detail-title"
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className="glass relative max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-t-[16px] sm:rounded-[16px]"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-56"
        style={{
          background: `radial-gradient(80% 100% at 28% 0%, color-mix(in srgb, ${primary} 26%, transparent), transparent 70%)`,
        }}
      />

      <button
        ref={closeRef}
        onClick={onClose}
        className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-ink-dim transition hover:text-ink active:scale-95"
        aria-label="Close"
      >
        <X size={17} strokeWidth={2} />
      </button>

      <header className="relative px-6 pt-7 sm:px-9 sm:pt-9">
        <span className="font-mono text-xs tracking-[0.16em] text-ink-faint">
          {dexNumber(mega.speciesId)} · {mega.debut}
        </span>
        <h2
          id="mega-detail-title"
          className="mt-1 text-3xl font-semibold tracking-tight text-ink"
        >
          {mega.displayName}
        </h2>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-dim">
          <Sparkles size={14} strokeWidth={1.75} className="text-accent" />
          {mega.ability}
        </p>
      </header>

      {/* base form -> mega form */}
      <div className="relative mt-6 flex items-center justify-center gap-4 px-6 sm:gap-8 sm:px-9">
        <motion.div
          className="text-center"
          initial={reduce ? false : { opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
        >
          <PokemonArt
            src={mega.baseArtwork}
            name={mega.speciesName}
            types={mega.baseTypes}
            className="h-24 w-24 sm:h-32 sm:w-32"
            eager
          />
          <p className="mt-2 text-xs font-medium text-ink-dim">
            {titleCase(mega.speciesName)}
          </p>
        </motion.div>

        <motion.span
          aria-hidden="true"
          initial={reduce ? false : { opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 20 }}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-accent/40 bg-accent/10 text-accent"
        >
          <ArrowRight size={16} strokeWidth={2} />
        </motion.span>

        <motion.div
          className="text-center"
          initial={reduce ? false : { opacity: 0, x: 20, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5, ease: EASE }}
        >
          <PokemonArt
            src={mega.artwork}
            name={mega.displayName}
            types={mega.types}
            className="h-28 w-28 sm:h-40 sm:w-40"
            eager
          />
          <p className="mt-2 text-xs font-medium text-ink">
            {mega.displayName}
          </p>
        </motion.div>
      </div>

      <div className="relative grid gap-8 px-6 py-8 sm:grid-cols-[1fr_240px] sm:px-9 sm:py-9">
        {/* stats */}
        <section>
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-faint">
              Base stats
            </h3>
            <span className="font-mono text-xs text-ink-dim">
              {mega.total}
              {mega.total > mega.baseTotal && (
                <span className="text-accent">
                  {" "}
                  +{mega.total - mega.baseTotal}
                </span>
              )}
            </span>
          </div>

          <div className="mt-4 grid gap-3">
            {mega.stats.map((stat, i) => (
              <StatBar
                key={stat.name}
                label={STAT_LABELS[stat.name] ?? stat.name}
                value={stat.value}
                baseValue={stat.baseValue}
                color={primary}
                delay={reduce ? 0 : 0.12 + i * 0.06}
              />
            ))}
          </div>
        </section>

        {/* typing and physique */}
        <aside className="grid h-fit gap-6">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-faint">
              Typing
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {mega.types.map((t) => (
                <TypePill key={t} type={t} />
              ))}
            </div>
            {gainedTypes.length > 0 && (
              <p className="mt-2.5 text-xs text-ink-dim">
                Gains {gainedTypes.map((t) => titleCase(t)).join(" and ")} on
                Mega Evolving.
              </p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-faint">
              Physique
            </h3>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-ink-faint">Height</dt>
                <dd className="font-mono text-ink">
                  {(mega.height / 10).toFixed(1)} m
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-faint">Weight</dt>
                <dd className="font-mono text-ink">
                  {(mega.weight / 10).toFixed(1)} kg
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </motion.div>
  );
}

function StatBar({
  label,
  value,
  baseValue,
  color,
  delay,
}: {
  label: string;
  value: number;
  baseValue: number;
  color: string;
  delay: number;
}) {
  const reduce = useReducedMotion();
  const delta = value - baseValue;

  return (
    <div className="grid grid-cols-[74px_1fr_74px] items-center gap-3">
      <span className="text-xs font-medium text-ink-dim">{label}</span>
      <span className="relative h-2 overflow-hidden rounded-full bg-surface-2">
        {/* the pre-mega value sits underneath, so the gain reads as growth */}
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 rounded-full bg-white/12"
          style={{
            width: `${Math.min(100, (baseValue / STAT_CEILING) * 100)}%`,
          }}
        />
        <motion.span
          className="relative block h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, color-mix(in srgb, ${color} 55%, transparent), ${color})`,
          }}
          initial={
            reduce
              ? false
              : { width: `${Math.min(100, (baseValue / STAT_CEILING) * 100)}%` }
          }
          animate={{ width: `${Math.min(100, (value / STAT_CEILING) * 100)}%` }}
          transition={{ duration: 0.7, delay, ease: EASE }}
        />
      </span>
      <span className="text-right font-mono text-xs text-ink">
        {value}
        {delta !== 0 && (
          <span className={delta > 0 ? "text-accent" : "text-ink-faint"}>
            {" "}
            {delta > 0 ? "+" : ""}
            {delta}
          </span>
        )}
      </span>
    </div>
  );
}
