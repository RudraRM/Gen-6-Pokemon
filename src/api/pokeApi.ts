/**
 * Live PokeAPI client, used by the Mega Evolution tab.
 *
 * The rest of the dex reads from `localPokeApi`, which ships its data with the
 * bundle. Mega forms are pulled from the real service instead: there are 48 of
 * them and every stat line, typing and ability comes straight from
 * https://pokeapi.co so nothing has to be transcribed by hand.
 */

import type { StatName, TypeName } from "./localPokeApi";

export const POKEAPI_ROOT = "https://pokeapi.co/api/v2";

const SPRITE_ROOT =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

export type MegaDebut = "X / Y" | "Omega Ruby / Alpha Sapphire";

interface MegaFormSeed {
  /** PokeAPI resource slug for the mega form, e.g. `charizard-mega-x`. */
  slug: string;
  /** Resource slug of the form it evolves from. */
  base: string;
  debut: MegaDebut;
}

/**
 * Every Mega Evolution introduced in Generation 6: 30 forms in X / Y and a
 * further 18 in Omega Ruby / Alpha Sapphire, 48 in total. Primal Groudon and
 * Primal Kyogre are deliberately absent - Primal Reversion is a separate
 * mechanic, not a Mega Evolution.
 */
const MEGA_FORMS: MegaFormSeed[] = [
  // --- X / Y ---
  { slug: "venusaur-mega", base: "venusaur", debut: "X / Y" },
  { slug: "charizard-mega-x", base: "charizard", debut: "X / Y" },
  { slug: "charizard-mega-y", base: "charizard", debut: "X / Y" },
  { slug: "blastoise-mega", base: "blastoise", debut: "X / Y" },
  { slug: "alakazam-mega", base: "alakazam", debut: "X / Y" },
  { slug: "gengar-mega", base: "gengar", debut: "X / Y" },
  { slug: "kangaskhan-mega", base: "kangaskhan", debut: "X / Y" },
  { slug: "pinsir-mega", base: "pinsir", debut: "X / Y" },
  { slug: "gyarados-mega", base: "gyarados", debut: "X / Y" },
  { slug: "aerodactyl-mega", base: "aerodactyl", debut: "X / Y" },
  { slug: "mewtwo-mega-x", base: "mewtwo", debut: "X / Y" },
  { slug: "mewtwo-mega-y", base: "mewtwo", debut: "X / Y" },
  { slug: "ampharos-mega", base: "ampharos", debut: "X / Y" },
  { slug: "scizor-mega", base: "scizor", debut: "X / Y" },
  { slug: "heracross-mega", base: "heracross", debut: "X / Y" },
  { slug: "houndoom-mega", base: "houndoom", debut: "X / Y" },
  { slug: "tyranitar-mega", base: "tyranitar", debut: "X / Y" },
  { slug: "blaziken-mega", base: "blaziken", debut: "X / Y" },
  { slug: "gardevoir-mega", base: "gardevoir", debut: "X / Y" },
  { slug: "mawile-mega", base: "mawile", debut: "X / Y" },
  { slug: "aggron-mega", base: "aggron", debut: "X / Y" },
  { slug: "medicham-mega", base: "medicham", debut: "X / Y" },
  { slug: "manectric-mega", base: "manectric", debut: "X / Y" },
  { slug: "banette-mega", base: "banette", debut: "X / Y" },
  { slug: "absol-mega", base: "absol", debut: "X / Y" },
  { slug: "latias-mega", base: "latias", debut: "X / Y" },
  { slug: "latios-mega", base: "latios", debut: "X / Y" },
  { slug: "garchomp-mega", base: "garchomp", debut: "X / Y" },
  { slug: "lucario-mega", base: "lucario", debut: "X / Y" },
  { slug: "abomasnow-mega", base: "abomasnow", debut: "X / Y" },

  // --- Omega Ruby / Alpha Sapphire ---
  { slug: "beedrill-mega", base: "beedrill", debut: "Omega Ruby / Alpha Sapphire" },
  { slug: "pidgeot-mega", base: "pidgeot", debut: "Omega Ruby / Alpha Sapphire" },
  { slug: "slowbro-mega", base: "slowbro", debut: "Omega Ruby / Alpha Sapphire" },
  { slug: "steelix-mega", base: "steelix", debut: "Omega Ruby / Alpha Sapphire" },
  { slug: "sceptile-mega", base: "sceptile", debut: "Omega Ruby / Alpha Sapphire" },
  { slug: "swampert-mega", base: "swampert", debut: "Omega Ruby / Alpha Sapphire" },
  { slug: "sableye-mega", base: "sableye", debut: "Omega Ruby / Alpha Sapphire" },
  { slug: "sharpedo-mega", base: "sharpedo", debut: "Omega Ruby / Alpha Sapphire" },
  { slug: "camerupt-mega", base: "camerupt", debut: "Omega Ruby / Alpha Sapphire" },
  { slug: "altaria-mega", base: "altaria", debut: "Omega Ruby / Alpha Sapphire" },
  { slug: "glalie-mega", base: "glalie", debut: "Omega Ruby / Alpha Sapphire" },
  { slug: "salamence-mega", base: "salamence", debut: "Omega Ruby / Alpha Sapphire" },
  { slug: "metagross-mega", base: "metagross", debut: "Omega Ruby / Alpha Sapphire" },
  { slug: "rayquaza-mega", base: "rayquaza", debut: "Omega Ruby / Alpha Sapphire" },
  { slug: "lopunny-mega", base: "lopunny", debut: "Omega Ruby / Alpha Sapphire" },
  { slug: "gallade-mega", base: "gallade", debut: "Omega Ruby / Alpha Sapphire" },
  { slug: "audino-mega", base: "audino", debut: "Omega Ruby / Alpha Sapphire" },
  { slug: "diancie-mega", base: "diancie", debut: "Omega Ruby / Alpha Sapphire" },
];

export const MEGA_FORM_COUNT = MEGA_FORMS.length;

/* ------------------------------ wire shapes ------------------------------ */

interface RawPokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: { slot: number; type: { name: TypeName } }[];
  stats: { base_stat: number; stat: { name: StatName } }[];
  abilities: { ability: { name: string }; is_hidden: boolean }[];
  sprites: {
    front_default: string | null;
    other?: {
      "official-artwork"?: { front_default: string | null };
      home?: { front_default: string | null };
    };
  };
  species: { name: string; url: string };
}

/* ------------------------------ domain model ----------------------------- */

export interface MegaStat {
  name: StatName;
  value: number;
  /** Same stat on the pre-mega form, so the delta can be shown. */
  baseValue: number;
}

export interface MegaEvolution {
  /** PokeAPI form id (mega forms live above 10000). */
  id: number;
  slug: string;
  /** National Dex number of the species, e.g. 6 for both Charizard megas. */
  speciesId: number;
  speciesName: string;
  /** "Mega Charizard X" - built for display, not a PokeAPI field. */
  displayName: string;
  debut: MegaDebut;
  types: TypeName[];
  /** Types the pre-mega form has, used to flag a typing change. */
  baseTypes: TypeName[];
  stats: MegaStat[];
  total: number;
  baseTotal: number;
  ability: string;
  /** Decimetres / hectograms, as PokeAPI reports them. */
  height: number;
  weight: number;
  artwork: string;
  baseArtwork: string;
}

/* -------------------------------- fetching ------------------------------- */

/** Charizard and Mewtwo each back two megas, so responses are shared by URL. */
const inFlight = new Map<string, Promise<unknown>>();

function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const existing = inFlight.get(url);
  if (existing) return existing as Promise<T>;

  const request = (async () => {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(`PokeAPI answered ${response.status} for ${url}`);
    }
    return (await response.json()) as T;
  })().catch((err: unknown) => {
    inFlight.delete(url);
    throw err;
  });

  inFlight.set(url, request);
  return request as Promise<T>;
}

/** PokeAPI is rate limited politely, so requests go out in small waves. */
async function inBatches<In, Out>(
  items: In[],
  size: number,
  task: (item: In) => Promise<Out>,
): Promise<Out[]> {
  const results: Out[] = [];
  for (let i = 0; i < items.length; i += size) {
    const wave = await Promise.all(items.slice(i, i + size).map(task));
    results.push(...wave);
  }
  return results;
}

const speciesIdFromUrl = (url: string): number => {
  const match = /\/pokemon-species\/(\d+)\/?$/.exec(url);
  return match ? Number(match[1]) : 0;
};

const artworkFor = (raw: RawPokemon, fallbackId: number): string =>
  raw.sprites.other?.["official-artwork"]?.front_default ??
  raw.sprites.other?.home?.front_default ??
  raw.sprites.front_default ??
  `${SPRITE_ROOT}/other/official-artwork/${fallbackId}.png`;

/**
 * "charizard-mega-x" -> "Mega Charizard X". PokeAPI names the form suffix-first
 * because the slug sorts by species; the games say it the other way round.
 */
function displayNameFor(slug: string): string {
  const [species, , suffix] = slug.split("-");
  const name = species.charAt(0).toUpperCase() + species.slice(1);
  return suffix ? `Mega ${name} ${suffix.toUpperCase()}` : `Mega ${name}`;
}

const titleizeAbility = (slug: string) =>
  slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

function toMega(
  seed: MegaFormSeed,
  form: RawPokemon,
  base: RawPokemon,
): MegaEvolution {
  const baseStats = new Map(base.stats.map((s) => [s.stat.name, s.base_stat]));
  const stats: MegaStat[] = form.stats.map((s) => ({
    name: s.stat.name,
    value: s.base_stat,
    baseValue: baseStats.get(s.stat.name) ?? s.base_stat,
  }));

  const speciesId = speciesIdFromUrl(form.species.url) || base.id;

  return {
    id: form.id,
    slug: seed.slug,
    speciesId,
    speciesName: base.name,
    displayName: displayNameFor(seed.slug),
    debut: seed.debut,
    types: form.types
      .slice()
      .sort((a, b) => a.slot - b.slot)
      .map((t) => t.type.name),
    baseTypes: base.types
      .slice()
      .sort((a, b) => a.slot - b.slot)
      .map((t) => t.type.name),
    stats,
    total: stats.reduce((sum, s) => sum + s.value, 0),
    baseTotal: stats.reduce((sum, s) => sum + s.baseValue, 0),
    // Every mega form has exactly one ability, and PokeAPI lists it first.
    ability: titleizeAbility(form.abilities[0]?.ability.name ?? "unknown"),
    height: form.height,
    weight: form.weight,
    artwork: artworkFor(form, form.id),
    baseArtwork: artworkFor(base, base.id),
  };
}

let cached: Promise<MegaEvolution[]> | null = null;

async function loadMegaEvolutions(
  signal?: AbortSignal,
): Promise<MegaEvolution[]> {
  const megas = await inBatches(MEGA_FORMS, 8, async (seed) => {
    const [form, base] = await Promise.all([
      getJson<RawPokemon>(`${POKEAPI_ROOT}/pokemon/${seed.slug}`, signal),
      getJson<RawPokemon>(`${POKEAPI_ROOT}/pokemon/${seed.base}`, signal),
    ]);
    return toMega(seed, form, base);
  });

  // National Dex order, with Charizard X before Y and Mewtwo X before Y.
  return megas.sort(
    (a, b) => a.speciesId - b.speciesId || a.slug.localeCompare(b.slug),
  );
}

/**
 * All 48 Generation 6 Mega Evolutions, resolved once per page load. A failed
 * run clears the cache so the tab's retry button can genuinely try again.
 */
export function fetchMegaEvolutions(): Promise<MegaEvolution[]> {
  if (!cached) {
    cached = loadMegaEvolutions().catch((err: unknown) => {
      cached = null;
      throw new Error(
        err instanceof DOMException && err.name === "AbortError"
          ? "The request to PokeAPI was cancelled."
          : "Could not reach PokeAPI for the Mega Evolution data. Check the connection and try again.",
      );
    });
  }
  return cached;
}
