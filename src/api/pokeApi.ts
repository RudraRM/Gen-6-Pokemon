/**
 * Mega Evolution data layer.
 *
 * The roster is derived from the dex itself: `scripts/build-pokedex.mjs` walks
 * PokeAPI's forms and keeps every mega form whose base Pokemon is one of the
 * 721 entries in `pokedexData.ts`. Adding Generations 1-5 to the dex therefore
 * adds their megas here automatically - nothing is transcribed by hand, and a
 * form can never appear for a Pokemon the dex does not hold.
 */

import {
  MEGAS,
  MEGA_DEBUTS,
  STAT_NAMES,
  TYPE_NAMES,
  type MegaRow,
} from "./pokedexData";
import { artwork, pokemonById, type StatName, type TypeName } from "./localPokeApi";

/** Games a Mega Evolution debuted in, e.g. "X / Y". */
export type MegaDebut = string;

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
  /** Generation the debut games belong to. */
  debutGeneration: number;
  types: TypeName[];
  /** Types the pre-mega form has, used to flag a typing change. */
  baseTypes: TypeName[];
  stats: MegaStat[];
  total: number;
  baseTotal: number;
  /** Empty for the newest forms, whose ability PokeAPI has not recorded yet. */
  ability: string;
  /** Decimetres / hectograms, as PokeAPI reports them. */
  height: number;
  weight: number;
  artwork: string;
  baseArtwork: string;
}

const typeName = (index: number) => TYPE_NAMES[index] as TypeName;

const titleizeAbility = (slug: string) =>
  slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

function toMega(row: MegaRow): MegaEvolution {
  const [
    id,
    slug,
    speciesId,
    displayName,
    debutIndex,
    types,
    stats,
    ability,
    height,
    weight,
    baseTypes,
    baseStats,
  ] = row;

  const [, debut, debutGeneration] = MEGA_DEBUTS[debutIndex];
  const species = pokemonById(speciesId);

  return {
    id,
    slug,
    speciesId,
    speciesName: species?.name ?? slug.split("-")[0],
    displayName,
    debut,
    debutGeneration,
    types: types.map(typeName),
    baseTypes: baseTypes.map(typeName),
    stats: stats.map((value, i) => ({
      name: STAT_NAMES[i] as StatName,
      value,
      baseValue: baseStats[i],
    })),
    total: stats.reduce((sum, value) => sum + value, 0),
    baseTotal: baseStats.reduce((sum, value) => sum + value, 0),
    ability: ability ? titleizeAbility(ability) : "",
    height,
    weight,
    // Mega artwork is filed under the form id; PokemonArt falls back to a
    // type-tinted monogram for the newest forms that have no sprite yet.
    artwork: artwork(id).other["official-artwork"].front_default,
    baseArtwork: artwork(speciesId).other["official-artwork"].front_default,
  };
}

/** Every mega form of a Pokemon in the dex, in National Dex order. */
export const MEGA_EVOLUTIONS: MegaEvolution[] = MEGAS.map(toMega).sort(
  (a, b) => a.speciesId - b.speciesId || a.slug.localeCompare(b.slug),
);

export const MEGA_FORM_COUNT = MEGA_EVOLUTIONS.length;

/** Debut games in release order, with how many megas each one introduced. */
export const MEGA_DEBUT_GROUPS = MEGA_DEBUTS.map(([, label, generation]) => ({
  label,
  generation,
  count: MEGA_EVOLUTIONS.filter((m) => m.debut === label).length,
})).filter((group) => group.count > 0);

/** Dex numbers that have at least one mega form. */
export const MEGA_CAPABLE_IDS = new Set(
  MEGA_EVOLUTIONS.map((m) => m.speciesId),
);

/** Kept async so the tab exercises its loading state, as the dex list does. */
export function fetchMegaEvolutions(): Promise<MegaEvolution[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MEGA_EVOLUTIONS), 300 + Math.round(Math.random() * 200));
  });
}
