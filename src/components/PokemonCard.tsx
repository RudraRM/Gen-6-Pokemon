import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Pokemon } from "../api/localPokeApi";
import { TYPE_COLORS, dexNumber, titleCase } from "../lib/pokemonTypes";
import { PokemonArt, TypePill } from "./primitives";

interface Props {
  pokemon: Pokemon;
  index: number;
  onSelect: (pokemon: Pokemon) => void;
}

/**
 * Dex card. The glow border is derived from the Pokemon's primary type, so
 * Greninja reads blue and Sylveon reads pink without any per-entry styling.
 */
export const PokemonCard = memo(function PokemonCard({
  pokemon,
  index,
  onSelect,
}: Props) {
  const reduce = useReducedMotion();
  const typeNames = pokemon.types.map((t) => t.type.name);
  const primary = TYPE_COLORS[typeNames[0]].base;
  const secondary = TYPE_COLORS[typeNames[1] ?? typeNames[0]].base;
  const total = pokemon.stats.reduce((sum, s) => sum + s.base_stat, 0);

  return (
    <motion.button
      type="button"
      layout
      layoutId={`card-${pokemon.id}`}
      onClick={() => onSelect(pokemon)}
      initial={reduce ? false : { opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, scale: 0.96 }}
      transition={{
        duration: 0.42,
        delay: reduce ? 0 : Math.min(index * 0.035, 0.35),
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={reduce ? undefined : { y: -6 }}
      whileTap={{ scale: 0.985 }}
      aria-label={`Open the Pokedex entry for ${titleCase(pokemon.name)}`}
      className="group relative overflow-hidden rounded-[16px] border border-line bg-surface p-5 text-left transition-colors duration-300"
      style={{ ["--glow" as string]: primary }}
    >
      {/* type aura, revealed on hover */}
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
        <div
          className="mx-auto grid h-32 w-32 place-items-center rounded-full"
          style={{
            background: `radial-gradient(circle at 50% 60%, color-mix(in srgb, ${secondary} 18%, transparent), transparent 70%)`,
          }}
        >
          <PokemonArt
            src={pokemon.sprites.other["official-artwork"].front_default}
            name={pokemon.name}
            types={typeNames}
            className="h-28 w-28"
          />
        </div>

        <div className="mt-5 flex items-baseline justify-between gap-3">
          <span className="font-mono text-xs tracking-[0.14em] text-ink-faint">
            {dexNumber(pokemon.id)}
          </span>
          <span className="font-mono text-xs text-ink-faint">
            BST {total}
          </span>
        </div>

        <h3 className="mt-1 text-lg font-semibold tracking-tight text-ink">
          {titleCase(pokemon.name)}
        </h3>
        <p className="mt-0.5 text-xs text-ink-dim">{pokemon.genus}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {typeNames.map((t) => (
            <TypePill key={t} type={t} size="sm" />
          ))}
        </div>
      </div>
    </motion.button>
  );
});
