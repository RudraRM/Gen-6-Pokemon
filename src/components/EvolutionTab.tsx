import { Fragment, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  GENERATIONS,
  fetchEvolutionChains,
  pokemonById,
  type EvolutionChain,
  type EvolutionLink,
  type Pokemon,
  type TypeName,
} from "../api/localPokeApi";
import { useAsync } from "../hooks/useAsync";
import { TYPE_COLORS, dexNumber, titleCase } from "../lib/pokemonTypes";
import { PokemonArt, TypePill } from "./primitives";

/** Flattens a chain into stages so branching families still line up in columns. */
function toStages(root: EvolutionLink): EvolutionLink[][] {
  const stages: EvolutionLink[][] = [];
  let level = [root];
  while (level.length) {
    stages.push(level);
    level = level.flatMap((node) => node.evolves_to);
  }
  return stages;
}

interface Species {
  id: number;
  name: string;
  types: TypeName[];
  artwork: string;
  full: Pokemon;
}

/** Every node in a chain is a dex entry now, so every node opens. */
function resolveSpecies(id: number): Species | null {
  const full = pokemonById(id);
  if (!full) return null;
  return {
    id,
    name: full.name,
    types: full.types.map((t) => t.type.name),
    artwork: full.sprites.other["official-artwork"].front_default,
    full,
  };
}

function ChainNode({
  link,
  onSelect,
  delay,
}: {
  link: EvolutionLink;
  onSelect: (p: Pokemon) => void;
  delay: number;
}) {
  const reduce = useReducedMotion();
  const species = resolveSpecies(link.id);
  if (!species) return null;

  const primary = TYPE_COLORS[species.types[0]].base;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.86 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center"
    >
      <button
        type="button"
        onClick={() => onSelect(species.full)}
        aria-label={`Open the Pokedex entry for ${titleCase(species.name)}`}
        className="group relative grid h-[124px] w-[124px] place-items-center rounded-full border border-line bg-surface transition duration-300 hover:-translate-y-1 active:scale-[0.97]"
        style={{
          background: `radial-gradient(circle at 50% 58%, color-mix(in srgb, ${primary} 16%, transparent), var(--color-surface) 72%)`,
        }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            boxShadow: `0 0 0 1px color-mix(in srgb, ${primary} 60%, transparent), 0 16px 40px color-mix(in srgb, ${primary} 22%, transparent)`,
          }}
        />
        <PokemonArt
          src={species.artwork}
          name={species.name}
          types={species.types}
          className="h-[86px] w-[86px]"
        />
      </button>

      <p className="mt-3 font-mono text-[11px] tracking-[0.14em] text-ink-faint">
        {dexNumber(species.id)}
      </p>
      <p className="text-sm font-semibold text-ink">{titleCase(species.name)}</p>
      <div className="mt-2 flex gap-1.5">
        {species.types.map((t) => (
          <TypePill key={t} type={t} size="sm" />
        ))}
      </div>
    </motion.div>
  );
}

/** The drawn link between two stages: horizontal at lg, vertical below it. */
function Connector({ trigger, delay }: { trigger: string | null; delay: number }) {
  const reduce = useReducedMotion();
  const draw = {
    initial: reduce ? undefined : { pathLength: 0, opacity: 0 },
    whileInView: { pathLength: 1, opacity: 1 },
    viewport: { once: true, amount: 0.6 },
    transition: { duration: 0.6, delay, ease: "easeInOut" as const },
  };

  return (
    // The 44px top margin lines the arrow up with the centre of a 124px node.
    <div className="flex flex-col items-center gap-2 py-2 lg:mt-11 lg:py-0">
      <svg
        className="hidden h-6 w-full min-w-[52px] lg:block"
        viewBox="0 0 100 24"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <motion.path
          d="M2 12 H 86"
          stroke="var(--color-accent)"
          strokeWidth={1.5}
          strokeOpacity={0.55}
          fill="none"
          {...draw}
        />
        <motion.path
          d="M80 6 L 92 12 L 80 18"
          stroke="var(--color-accent)"
          strokeWidth={1.5}
          strokeOpacity={0.8}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          {...draw}
        />
      </svg>
      <svg
        className="h-10 w-6 lg:hidden"
        viewBox="0 0 24 40"
        aria-hidden="true"
      >
        <motion.path
          d="M12 2 V 30"
          stroke="var(--color-accent)"
          strokeWidth={1.5}
          strokeOpacity={0.55}
          fill="none"
          {...draw}
        />
        <motion.path
          d="M6 26 L 12 36 L 18 26"
          stroke="var(--color-accent)"
          strokeWidth={1.5}
          strokeOpacity={0.8}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          {...draw}
        />
      </svg>
      {trigger && (
        <span className="max-w-[150px] text-center text-[11px] leading-tight text-ink-faint lg:max-w-[120px]">
          {trigger}
        </span>
      )}
    </div>
  );
}

function ChainRow({
  chain,
  onSelect,
}: {
  chain: EvolutionChain;
  onSelect: (p: Pokemon) => void;
}) {
  const stages = toStages(chain.chain);
  const familyName = titleCase(chain.chain.species_name);

  return (
    <section className="rounded-[16px] border border-line bg-surface/60 p-6 sm:p-8">
      <header className="mb-6 flex items-baseline gap-3">
        <h3 className="text-lg font-semibold tracking-tight text-ink">
          {familyName} line
        </h3>
        <span className="font-mono text-xs text-ink-faint">
          {stages.length} {stages.length === 1 ? "stage" : "stages"}
        </span>
      </header>

      <div className="flex flex-col items-center lg:flex-row lg:items-start lg:justify-start lg:gap-2">
        {stages.map((stage, stageIndex) => (
          <Fragment key={stageIndex}>
            {stageIndex > 0 && (
              <Connector
                trigger={stage[0]?.trigger ?? null}
                delay={stageIndex * 0.18}
              />
            )}
            <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
              {stage.map((link, i) => (
                <ChainNode
                  key={link.id}
                  link={link}
                  onSelect={onSelect}
                  delay={stageIndex * 0.18 + i * 0.08}
                />
              ))}
            </div>
          </Fragment>
        ))}
      </div>
    </section>
  );
}

function ChainSkeleton() {
  return (
    <div className="rounded-[16px] border border-line bg-surface/60 p-8">
      <div className="skeleton h-5 w-40 rounded-full" />
      <div className="mt-8 flex flex-wrap items-center gap-8">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex flex-col items-center gap-3">
            <div className="skeleton h-[124px] w-[124px] rounded-full" />
            <div className="skeleton h-3 w-16 rounded-full" />
            <div className="skeleton h-5 w-24 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Charts are heavy to mount, so the list grows a page at a time. */
const PAGE_SIZE = 12;

export function EvolutionTab({ onSelect }: { onSelect: (p: Pokemon) => void }) {
  const [generation, setGeneration] = useState(0);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const { data, loading, error, reload } = useAsync<EvolutionChain[]>(
    () => fetchEvolutionChains(),
    [],
  );

  // A family belongs to the generation that introduced the Pokemon it starts
  // from, so Pichu's line reads as Generation 2 even though Pikachu is older.
  const chains = useMemo(() => {
    const all = data ?? [];
    if (generation === 0) return all;
    return all.filter(
      (c) => pokemonById(c.chain.id)?.generation === generation,
    );
  }, [data, generation]);

  useEffect(() => setVisible(PAGE_SIZE), [generation]);

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight text-ink">
        Evolution trees
      </h2>
      <p className="mt-1 max-w-[62ch] text-sm text-ink-dim">
        Every family in the dex that evolves, with the condition that triggers
        each step. Tap any stage to open its full record.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {[0, ...GENERATIONS.map((g) => g.generation)].map((gen) => {
          const active = gen === generation;
          return (
            <button
              key={gen}
              onClick={() => setGeneration(gen)}
              aria-pressed={active}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                active
                  ? "border-accent/45 bg-accent/12 text-accent"
                  : "border-line bg-surface text-ink-dim hover:text-ink"
              }`}
            >
              {gen === 0 ? "All" : `Gen ${gen}`}
            </button>
          );
        })}
        {!loading && (
          <span className="text-xs text-ink-faint">
            {chains.length} {chains.length === 1 ? "family" : "families"}
          </span>
        )}
      </div>

      <div className="mt-7 grid gap-5">
        {error ? (
          <ErrorPanel message={error} onRetry={reload} />
        ) : loading ? (
          <>
            <ChainSkeleton />
            <ChainSkeleton />
          </>
        ) : (
          chains
            .slice(0, visible)
            .map((chain) => (
              <ChainRow key={chain.id} chain={chain} onSelect={onSelect} />
            ))
        )}
      </div>

      {!loading && !error && visible < chains.length && (
        <div className="mt-8 text-center">
          <button
            onClick={() =>
              setVisible((n) => Math.min(n + PAGE_SIZE, chains.length))
            }
            className="rounded-full border border-line bg-surface px-5 py-2 text-sm text-ink-dim transition hover:text-ink"
          >
            Show more ({chains.length - visible} left)
          </button>
        </div>
      )}
    </div>
  );
}

function ErrorPanel({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-[16px] border border-line bg-surface px-6 py-14 text-center">
      <p className="text-base font-semibold text-ink">
        Evolution data did not load
      </p>
      <p className="mt-2 text-sm text-ink-dim">{message}</p>
      <button
        onClick={onRetry}
        className="mt-6 rounded-full border border-accent/40 bg-accent/10 px-5 py-2 text-sm font-semibold text-accent transition hover:bg-accent/20 active:scale-[0.98]"
      >
        Try again
      </button>
    </div>
  );
}
