/**
 * PokeAPI-shaped data layer for the whole dex.
 *
 * The records come from PokeAPI, pulled ahead of time by
 * `scripts/build-pokedex.mjs` and hydrated here from the compact tuples in
 * `pokedexData.ts` - National Dex 1-721, every Pokemon from Generation 1
 * through Generation 6. Shipping them with the bundle means 721 entries open
 * instantly and work offline; the shapes still mirror the public PokeAPI
 * response format closely enough that swapping in live `fetch` calls would be
 * a drop-in change.
 *
 * Every exported function resolves through a simulated 300-500ms network delay
 * so loading states are exercised for real.
 */

import {
  CHAINS,
  GENERATION_RANGES,
  MOVES,
  POKEDEX_SOURCE,
  SPECIES,
  STAT_NAMES,
  TYPE_NAMES,
  type ChainNodeData,
  type SpeciesRow,
} from "./pokedexData";

export type TypeName =
  | "normal"
  | "fire"
  | "water"
  | "electric"
  | "grass"
  | "ice"
  | "fighting"
  | "poison"
  | "ground"
  | "flying"
  | "psychic"
  | "bug"
  | "rock"
  | "ghost"
  | "dragon"
  | "dark"
  | "steel"
  | "fairy";

export type StatName =
  | "hp"
  | "attack"
  | "defense"
  | "special-attack"
  | "special-defense"
  | "speed";

export interface PokemonType {
  slot: number;
  type: { name: TypeName; url: string };
}

export interface PokemonStat {
  base_stat: number;
  effort: number;
  stat: { name: StatName; url: string };
}

export interface PokemonSprites {
  front_default: string;
  back_default: string;
  other: {
    "official-artwork": {
      front_default: string;
    };
  };
}

export interface PokemonMove {
  move: { name: string; url: string };
  type: TypeName;
  power: number | null;
  accuracy: number | null;
  damage_class: "physical" | "special" | "status";
}

export interface EvolutionLink {
  species_name: string;
  id: number;
  min_level: number | null;
  /** Human readable trigger, e.g. "Level 36" or "Shiny Stone". */
  trigger: string | null;
  evolves_to: EvolutionLink[];
}

export interface EvolutionChain {
  id: number;
  chain: EvolutionLink;
}

export interface Pokemon {
  id: number;
  name: string;
  /** 1-6. Generation the species was introduced in. */
  generation: number;
  /** "Kanto" through "Kalos", derived from the generation. */
  region: string;
  /** Decimetres, as PokeAPI reports it. */
  height: number;
  /** Hectograms, as PokeAPI reports it. */
  weight: number;
  base_experience: number;
  genus: string;
  types: PokemonType[];
  stats: PokemonStat[];
  sprites: PokemonSprites;
  abilities: { ability: { name: string }; is_hidden: boolean }[];
  moves: PokemonMove[];
  flavor_text_entries: {
    flavor_text: string;
    language: { name: string };
    version: { name: string };
  }[];
  evolution_chain: { id: number; url: string };
}

const SPRITE_ROOT =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

export const artwork = (id: number): PokemonSprites => ({
  front_default: `${SPRITE_ROOT}/${id}.png`,
  back_default: `${SPRITE_ROOT}/back/${id}.png`,
  other: {
    "official-artwork": {
      front_default: `${SPRITE_ROOT}/other/official-artwork/${id}.png`,
    },
  },
});

/* ------------------------------------------------------------------ *
 * Hydration
 * ------------------------------------------------------------------ */

const typeName = (index: number) => TYPE_NAMES[index] as TypeName;

const toTypes = (indexes: number[]): PokemonType[] =>
  indexes.map((index, i) => ({
    slot: i + 1,
    type: { name: typeName(index), url: `${POKEDEX_SOURCE}/type/${index + 1}` },
  }));

const toStats = (values: number[]): PokemonStat[] =>
  values.map((base_stat, i) => {
    const name = STAT_NAMES[i] as StatName;
    return {
      base_stat,
      effort: 0,
      stat: { name, url: `${POKEDEX_SOURCE}/stat/${name}` },
    };
  });

const toMove = (index: number): PokemonMove => {
  const [slug, type, damageClass, power, accuracy] = MOVES[index];
  return {
    move: { name: slug, url: `${POKEDEX_SOURCE}/move/${slug}` },
    type: typeName(type),
    power,
    accuracy,
    damage_class: damageClass as PokemonMove["damage_class"],
  };
};

function hydrate(row: SpeciesRow): Pokemon {
  const [
    id,
    name,
    generation,
    height,
    weight,
    baseExperience,
    genus,
    types,
    stats,
    abilities,
    moves,
    flavorText,
    flavorVersion,
    chainId,
  ] = row;

  return {
    id,
    name,
    generation,
    region: GENERATION_RANGES[generation].region,
    height,
    weight,
    base_experience: baseExperience,
    genus,
    types: toTypes(types),
    stats: toStats(stats),
    sprites: artwork(id),
    abilities: abilities.map(([ability, hidden]) => ({
      ability: { name: ability },
      is_hidden: hidden === 1,
    })),
    moves: moves.map(toMove),
    flavor_text_entries: [
      {
        flavor_text: flavorText,
        language: { name: "en" },
        version: { name: flavorVersion },
      },
    ],
    evolution_chain: {
      id: chainId,
      url: `${POKEDEX_SOURCE}/evolution-chain/${chainId}`,
    },
  };
}

/** Every Pokemon from Generation 1 to Generation 6, in National Dex order. */
export const ALL_POKEMON: Pokemon[] = SPECIES.map(hydrate);

const BY_ID = new Map(ALL_POKEMON.map((p) => [p.id, p]));
const BY_NAME = new Map(ALL_POKEMON.map((p) => [p.name, p]));

export const GENERATIONS = Object.entries(GENERATION_RANGES)
  .map(([generation, range]) => ({ generation: Number(generation), ...range }))
  .sort((a, b) => a.generation - b.generation);

const toLink = (node: ChainNodeData): EvolutionLink => ({
  species_name: node.name,
  id: node.id,
  min_level: node.minLevel,
  trigger: node.trigger,
  evolves_to: node.children.map(toLink),
});

/** Every evolution chain whose family sits inside the dex. */
export const EVOLUTION_CHAINS: EvolutionChain[] = CHAINS.map((chain) => ({
  id: chain.id,
  chain: toLink(chain.chain),
}));

/** Families of two or more, i.e. the ones worth drawing a flow chart for. */
export const BRANCHING_CHAINS = EVOLUTION_CHAINS.filter(
  (c) => c.chain.evolves_to.length > 0,
);

/* ------------------------------------------------------------------ *
 * Async surface
 * ------------------------------------------------------------------ */

/** PokeAPI never responds instantly. Neither do we. */
const latency = () => 300 + Math.round(Math.random() * 200);

function respond<T>(payload: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(payload), latency());
  });
}

function reject(message: string, ms = 320): Promise<never> {
  return new Promise((_, rejectPromise) => {
    setTimeout(() => rejectPromise(new Error(message)), ms);
  });
}

export interface PokemonListResponse {
  count: number;
  results: Pokemon[];
}

/** Alphabetical by name - the order the dex grid renders in. */
const byName = (a: Pokemon, b: Pokemon) => a.name.localeCompare(b.name);

export interface DexQuery {
  /** Name, dex number, or type. Empty matches everything. */
  search?: string;
  /** Generation 1-6, or 0 for every generation. */
  generation?: number;
}

function matches(pokemon: Pokemon, query: string): boolean {
  return (
    pokemon.name.includes(query) ||
    String(pokemon.id) === query ||
    pokemon.genus.toLowerCase().includes(query) ||
    pokemon.types.some((t) => t.type.name.includes(query))
  );
}

/** Every entry held locally, A to Z. */
export async function fetchAllPokemon(): Promise<PokemonListResponse> {
  const results = [...ALL_POKEMON].sort(byName);
  return respond({ count: results.length, results });
}

/** Name, dex-number or type search, narrowed by generation. Sorted A to Z. */
export async function searchLocalPokemon(
  query: DexQuery | string,
): Promise<PokemonListResponse> {
  const { search = "", generation = 0 } =
    typeof query === "string" ? { search: query } : query;
  const q = search.trim().toLowerCase();

  const results = ALL_POKEMON.filter(
    (p) =>
      (generation === 0 || p.generation === generation) &&
      (!q || matches(p, q)),
  ).sort(byName);

  return respond({ count: results.length, results });
}

/** Full detail record for one Pokemon, by dex number or name. */
export async function fetchPokemonDetails(
  idOrName: number | string,
): Promise<Pokemon> {
  const key = String(idOrName).toLowerCase();
  const found = BY_ID.get(Number(key)) ?? BY_NAME.get(key);
  if (!found) return reject(`No dex entry found for "${idOrName}".`);
  return respond(found);
}

/** Evolution chains for every family in the dex. */
export async function fetchEvolutionChains(): Promise<EvolutionChain[]> {
  return respond(BRANCHING_CHAINS);
}

export async function fetchEvolutionChain(id: number): Promise<EvolutionChain> {
  const found = EVOLUTION_CHAINS.find((c) => c.id === id);
  if (!found) return reject(`No evolution chain with id ${id}.`);
  return respond(found);
}

/** Synchronous lookup for views that already hold the full list. */
export const pokemonById = (id: number): Pokemon | undefined => BY_ID.get(id);
