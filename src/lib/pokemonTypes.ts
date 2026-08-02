import type { TypeName } from "../api/localPokeApi";

/**
 * Type identity colors. These are data encodings (a Pokemon's type is a fact
 * about the Pokemon), not decorative accents, so they sit outside the page's
 * single-accent rule. Values are desaturated slightly from the games' palette
 * so they hold up against a near-black surface.
 */
export const TYPE_COLORS: Record<TypeName, { base: string; soft: string }> = {
  normal: { base: "#9aa0ab", soft: "rgba(154,160,171,0.16)" },
  fire: { base: "#ff7a45", soft: "rgba(255,122,69,0.16)" },
  water: { base: "#3f9dff", soft: "rgba(63,157,255,0.16)" },
  electric: { base: "#f5cf3d", soft: "rgba(245,207,61,0.16)" },
  grass: { base: "#5ecb7a", soft: "rgba(94,203,122,0.16)" },
  ice: { base: "#74dcdc", soft: "rgba(116,220,220,0.16)" },
  fighting: { base: "#e0554b", soft: "rgba(224,85,75,0.16)" },
  poison: { base: "#b464d4", soft: "rgba(180,100,212,0.16)" },
  ground: { base: "#d8ab5c", soft: "rgba(216,171,92,0.16)" },
  flying: { base: "#8fa8e8", soft: "rgba(143,168,232,0.16)" },
  psychic: { base: "#ff6f9c", soft: "rgba(255,111,156,0.16)" },
  bug: { base: "#a2bf3c", soft: "rgba(162,191,60,0.16)" },
  rock: { base: "#c2ab68", soft: "rgba(194,171,104,0.16)" },
  ghost: { base: "#8b7ad4", soft: "rgba(139,122,212,0.16)" },
  dragon: { base: "#7a6bf0", soft: "rgba(122,107,240,0.16)" },
  dark: { base: "#8a7566", soft: "rgba(138,117,102,0.16)" },
  steel: { base: "#9fb6c4", soft: "rgba(159,182,196,0.16)" },
  fairy: { base: "#f793d0", soft: "rgba(247,147,208,0.16)" },
};

export const ALL_TYPES = Object.keys(TYPE_COLORS) as TypeName[];

/**
 * Attacking effectiveness. Only non-1x entries are listed:
 * 2 = super effective, 0.5 = not very effective, 0 = no effect.
 */
const ATTACK_CHART: Record<TypeName, Partial<Record<TypeName, number>>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: {
    fire: 0.5,
    water: 0.5,
    grass: 2,
    ice: 2,
    bug: 2,
    rock: 0.5,
    dragon: 0.5,
    steel: 2,
  },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: {
    water: 2,
    electric: 0.5,
    grass: 0.5,
    ground: 0,
    flying: 2,
    dragon: 0.5,
  },
  grass: {
    fire: 0.5,
    water: 2,
    grass: 0.5,
    poison: 0.5,
    ground: 2,
    flying: 0.5,
    bug: 0.5,
    rock: 2,
    dragon: 0.5,
    steel: 0.5,
  },
  ice: {
    fire: 0.5,
    water: 0.5,
    grass: 2,
    ice: 0.5,
    ground: 2,
    flying: 2,
    dragon: 2,
    steel: 0.5,
  },
  fighting: {
    normal: 2,
    ice: 2,
    poison: 0.5,
    flying: 0.5,
    psychic: 0.5,
    bug: 0.5,
    rock: 2,
    ghost: 0,
    dark: 2,
    steel: 2,
    fairy: 0.5,
  },
  poison: {
    grass: 2,
    poison: 0.5,
    ground: 0.5,
    rock: 0.5,
    ghost: 0.5,
    steel: 0,
    fairy: 2,
  },
  ground: {
    fire: 2,
    electric: 2,
    grass: 0.5,
    poison: 2,
    flying: 0,
    bug: 0.5,
    rock: 2,
    steel: 2,
  },
  flying: {
    electric: 0.5,
    grass: 2,
    fighting: 2,
    bug: 2,
    rock: 0.5,
    steel: 0.5,
  },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: {
    fire: 0.5,
    grass: 2,
    fighting: 0.5,
    poison: 0.5,
    flying: 0.5,
    psychic: 2,
    ghost: 0.5,
    dark: 2,
    steel: 0.5,
    fairy: 0.5,
  },
  rock: {
    fire: 2,
    ice: 2,
    fighting: 0.5,
    ground: 0.5,
    flying: 2,
    bug: 2,
    steel: 0.5,
  },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: {
    fire: 0.5,
    water: 0.5,
    electric: 0.5,
    ice: 2,
    rock: 2,
    steel: 0.5,
    fairy: 2,
  },
  fairy: {
    fire: 0.5,
    fighting: 2,
    poison: 0.5,
    dragon: 2,
    dark: 2,
    steel: 0.5,
  },
};

/** Multiplier for `attacking` used against a defender of `defending`. */
export function effectiveness(attacking: TypeName, defending: TypeName): number {
  return ATTACK_CHART[attacking][defending] ?? 1;
}

export interface DefensiveProfile {
  weaknesses: { type: TypeName; multiplier: number }[];
  resistances: { type: TypeName; multiplier: number }[];
  immunities: TypeName[];
}

/** Combined defensive multipliers for a mono or dual type Pokemon. */
export function defensiveProfile(defTypes: TypeName[]): DefensiveProfile {
  const profile: DefensiveProfile = {
    weaknesses: [],
    resistances: [],
    immunities: [],
  };

  for (const attacking of ALL_TYPES) {
    const multiplier = defTypes.reduce(
      (acc, def) => acc * effectiveness(attacking, def),
      1,
    );
    if (multiplier === 0) profile.immunities.push(attacking);
    else if (multiplier > 1) profile.weaknesses.push({ type: attacking, multiplier });
    else if (multiplier < 1)
      profile.resistances.push({ type: attacking, multiplier });
  }

  profile.weaknesses.sort((a, b) => b.multiplier - a.multiplier);
  profile.resistances.sort((a, b) => a.multiplier - b.multiplier);
  return profile;
}

export const formatMultiplier = (m: number) =>
  m === 0.25 ? "1/4x" : m === 0.5 ? "1/2x" : `${m}x`;

/** "special-attack" -> "Sp. Atk", "hp" -> "HP" */
export const STAT_LABELS: Record<string, string> = {
  hp: "HP",
  attack: "Attack",
  defense: "Defense",
  "special-attack": "Sp. Atk",
  "special-defense": "Sp. Def",
  speed: "Speed",
};

/** "water-shuriken" -> "Water Shuriken" */
export const titleCase = (slug: string) =>
  slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export const dexNumber = (id: number) => `#${String(id).padStart(3, "0")}`;
