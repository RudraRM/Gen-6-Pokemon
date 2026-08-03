import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, ShieldCheck, ShieldOff, Sparkles } from "lucide-react";
import {
  fetchAllPokemon,
  type Pokemon,
  type PokemonListResponse,
  type TypeName,
} from "../api/localPokeApi";
import { useAsync } from "../hooks/useAsync";
import {
  ALL_TYPES,
  TYPE_COLORS,
  defensiveProfile,
  dexNumber,
  effectiveness,
  formatMultiplier,
  titleCase,
} from "../lib/pokemonTypes";
import { PokemonArt, TypePill } from "./primitives";

/** Water alone runs to well over a hundred entries, so the roster is capped. */
const ROSTER_PAGE = 24;

export function TypeMatchupTab({
  onSelect,
}: {
  onSelect: (p: Pokemon) => void;
}) {
  const [selected, setSelected] = useState<TypeName>("fairy");
  const [visible, setVisible] = useState(ROSTER_PAGE);
  const reduce = useReducedMotion();
  const { data, loading, error, reload } = useAsync<PokemonListResponse>(
    () => fetchAllPokemon(),
    [],
  );

  const roster = useMemo(
    () =>
      (data?.results ?? []).filter((p) =>
        p.types.some((t) => t.type.name === selected),
      ),
    [data, selected],
  );

  useEffect(() => setVisible(ROSTER_PAGE), [selected]);

  const profile = useMemo(() => defensiveProfile([selected]), [selected]);
  const offense = useMemo(() => {
    const strong: TypeName[] = [];
    const weak: TypeName[] = [];
    const nil: TypeName[] = [];
    for (const def of ALL_TYPES) {
      const m = effectiveness(selected, def);
      if (m === 0) nil.push(def);
      else if (m > 1) strong.push(def);
      else if (m < 1) weak.push(def);
    }
    return { strong, weak, nil };
  }, [selected]);

  const accent = TYPE_COLORS[selected].base;

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight text-ink">
        Type matchups
      </h2>
      <p className="mt-1 max-w-[62ch] text-sm text-ink-dim">
        Pick a type to see which Pokemon carry it, what it beats, and what beats
        it.
      </p>

      {/* the matrix */}
      <div
        role="radiogroup"
        aria-label="Pokemon type"
        className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-9"
      >
        {ALL_TYPES.map((type) => {
          const isActive = type === selected;
          const { base, soft } = TYPE_COLORS[type];
          return (
            <button
              key={type}
              role="radio"
              aria-checked={isActive}
              onClick={() => setSelected(type)}
              className="relative rounded-[16px] border px-2 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] transition duration-200 hover:-translate-y-0.5 active:scale-[0.97]"
              style={{
                color: isActive ? "#07090d" : base,
                backgroundColor: isActive ? base : soft,
                borderColor: `color-mix(in srgb, ${base} ${isActive ? 90 : 32}%, transparent)`,
              }}
            >
              {isActive && !reduce && (
                <motion.span
                  layoutId="type-selection"
                  className="pointer-events-none absolute -inset-px rounded-[16px]"
                  style={{ boxShadow: `0 10px 30px color-mix(in srgb, ${base} 40%, transparent)` }}
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative">{type}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_340px]">
        {/* roster */}
        <section>
          <div className="flex items-baseline gap-3">
            <h3 className="text-lg font-semibold tracking-tight text-ink">
              {titleCase(selected)} types in the dex
            </h3>
            {!loading && (
              <span className="font-mono text-xs text-ink-faint">
                {roster.length} found
              </span>
            )}
          </div>

          <div className="mt-4">
            {error ? (
              <div className="rounded-[16px] border border-line bg-surface px-6 py-12 text-center">
                <p className="text-sm text-ink-dim">{error}</p>
                <button
                  onClick={reload}
                  className="mt-4 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-sm font-semibold text-accent transition hover:bg-accent/20"
                >
                  Try again
                </button>
              </div>
            ) : loading ? (
              <div className="grid gap-2.5">
                {Array.from({ length: 4 }, (_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 rounded-[16px] border border-line bg-surface p-3"
                  >
                    <div className="skeleton h-14 w-14 rounded-full" />
                    <div className="flex-1">
                      <div className="skeleton h-3 w-14 rounded-full" />
                      <div className="skeleton mt-2 h-4 w-28 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : roster.length === 0 ? (
              <div className="rounded-[16px] border border-dashed border-line bg-surface/60 px-6 py-12 text-center">
                <Sparkles
                  className="mx-auto text-ink-faint"
                  size={26}
                  strokeWidth={1.5}
                />
                <p className="mt-3 text-sm font-semibold text-ink">
                  No {selected} type in this dex
                </p>
                <p className="mt-1 text-xs text-ink-dim">
                  No Pokemon in Generations 1-6 carries it.
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                <motion.ul layout className="grid gap-2.5">
                  {roster.slice(0, visible).map((p, i) => (
                    <motion.li
                      key={p.id}
                      layout
                      initial={reduce ? false : { opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={reduce ? undefined : { opacity: 0, x: 14 }}
                      transition={{
                        duration: 0.34,
                        delay: reduce ? 0 : Math.min(i * 0.04, 0.3),
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      <button
                        onClick={() => onSelect(p)}
                        className="group flex w-full items-center gap-4 rounded-[16px] border border-line bg-surface p-3 text-left transition hover:border-white/15 active:scale-[0.99]"
                      >
                        <PokemonArt
                          src={p.sprites.other["official-artwork"].front_default}
                          name={p.name}
                          types={p.types.map((t) => t.type.name)}
                          className="h-14 w-14 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="font-mono text-[11px] tracking-[0.14em] text-ink-faint">
                            {dexNumber(p.id)}
                          </span>
                          <p className="truncate text-sm font-semibold text-ink">
                            {titleCase(p.name)}
                          </p>
                        </div>
                        <div className="hidden gap-1.5 sm:flex">
                          {p.types.map((t) => (
                            <TypePill key={t.type.name} type={t.type.name} size="sm" />
                          ))}
                        </div>
                        <ArrowUpRight
                          size={16}
                          strokeWidth={1.75}
                          className="shrink-0 text-ink-faint transition group-hover:text-ink"
                        />
                      </button>
                    </motion.li>
                  ))}
                </motion.ul>
              </AnimatePresence>
            )}

            {!loading && !error && visible < roster.length && (
              <button
                onClick={() =>
                  setVisible((n) => Math.min(n + ROSTER_PAGE, roster.length))
                }
                className="mt-4 w-full rounded-full border border-line bg-surface py-2 text-sm text-ink-dim transition hover:text-ink"
              >
                Show more ({roster.length - visible} left)
              </button>
            )}
          </div>
        </section>

        {/* structural breakdown */}
        <motion.aside
          key={selected}
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="h-fit rounded-[16px] border border-line bg-surface/60 p-6"
          style={{
            background: `radial-gradient(120% 60% at 50% 0%, color-mix(in srgb, ${accent} 12%, transparent), transparent 62%), rgb(13 17 23 / 0.6)`,
          }}
        >
          <h3 className="text-sm font-semibold text-ink">
            {titleCase(selected)} structure
          </h3>

          <Block
            icon={<ArrowUpRight size={14} strokeWidth={2} className="text-accent" />}
            title="Deals 2x to"
            types={offense.strong}
          />
          <Block
            icon={<ArrowUpRight size={14} strokeWidth={2} className="text-ink-faint" />}
            title="Deals half to"
            types={offense.weak}
            muted
          />
          {offense.nil.length > 0 && (
            <Block
              icon={<ShieldOff size={14} strokeWidth={2} className="text-ink-faint" />}
              title="Cannot touch"
              types={offense.nil}
              muted
            />
          )}

          <div className="my-5 h-px bg-line" />

          <Block
            icon={<ShieldOff size={14} strokeWidth={2} className="text-[#ff7a45]" />}
            title="Takes double from"
            types={profile.weaknesses.map((w) => w.type)}
            labels={profile.weaknesses.map((w) => formatMultiplier(w.multiplier))}
          />
          <Block
            icon={<ShieldCheck size={14} strokeWidth={2} className="text-accent" />}
            title="Shrugs off"
            types={[
              ...profile.resistances.map((r) => r.type),
              ...profile.immunities,
            ]}
            labels={[
              ...profile.resistances.map((r) => formatMultiplier(r.multiplier)),
              ...profile.immunities.map(() => "0x"),
            ]}
          />
        </motion.aside>
      </div>
    </div>
  );
}

function Block({
  icon,
  title,
  types,
  labels,
  muted,
}: {
  icon: React.ReactNode;
  title: string;
  types: TypeName[];
  labels?: string[];
  muted?: boolean;
}) {
  return (
    <div className="mt-5">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
        {icon}
        {title}
      </p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {types.length === 0 && (
          <span className="text-xs text-ink-faint">Nothing</span>
        )}
        {types.map((t, i) => {
          const { base, soft } = TYPE_COLORS[t];
          return (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize"
              style={{
                color: base,
                backgroundColor: soft,
                borderColor: `color-mix(in srgb, ${base} 34%, transparent)`,
                opacity: muted ? 0.75 : 1,
              }}
            >
              {t}
              {labels?.[i] && (
                <span className="font-mono text-ink-dim">{labels[i]}</span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
