/**
 * Local PokeAPI-shaped data layer.
 *
 * Nothing here talks to a live server. The shapes mirror the public PokeAPI
 * response format closely enough that swapping in real `fetch` calls later is a
 * drop-in change, and every exported function resolves through a simulated
 * 300-500ms network delay so loading states are exercised for real.
 */

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

const artwork = (id: number): PokemonSprites => ({
  front_default: `${SPRITE_ROOT}/${id}.png`,
  back_default: `${SPRITE_ROOT}/back/${id}.png`,
  other: {
    "official-artwork": {
      front_default: `${SPRITE_ROOT}/other/official-artwork/${id}.png`,
    },
  },
});

const stats = (
  hp: number,
  atk: number,
  def: number,
  spa: number,
  spd: number,
  spe: number,
): PokemonStat[] =>
  (
    [
      ["hp", hp],
      ["attack", atk],
      ["defense", def],
      ["special-attack", spa],
      ["special-defense", spd],
      ["speed", spe],
    ] as [StatName, number][]
  ).map(([name, value]) => ({
    base_stat: value,
    effort: 0,
    stat: { name, url: `local://stat/${name}` },
  }));

const types = (...names: TypeName[]): PokemonType[] =>
  names.map((name, i) => ({
    slot: i + 1,
    type: { name, url: `local://type/${name}` },
  }));

const move = (
  name: string,
  type: TypeName,
  damage_class: PokemonMove["damage_class"],
  power: number | null,
  accuracy: number | null,
): PokemonMove => ({
  move: { name, url: `local://move/${name}` },
  type,
  power,
  accuracy,
  damage_class,
});

const flavor = (text: string, version: string) => [
  { flavor_text: text, language: { name: "en" }, version: { name: version } },
];

const abilities = (visible: string[], hidden?: string) => [
  ...visible.map((name) => ({ ability: { name }, is_hidden: false })),
  ...(hidden ? [{ ability: { name: hidden }, is_hidden: true }] : []),
];

/* ------------------------------------------------------------------ *
 * Evolution chains (Kalos starters, regional birds, and friends)
 * ------------------------------------------------------------------ */

export const EVOLUTION_CHAINS: EvolutionChain[] = [
  {
    id: 324,
    chain: {
      species_name: "chespin",
      id: 650,
      min_level: null,
      trigger: null,
      evolves_to: [
        {
          species_name: "quilladin",
          id: 651,
          min_level: 16,
          trigger: "Level 16",
          evolves_to: [
            {
              species_name: "chesnaught",
              id: 652,
              min_level: 36,
              trigger: "Level 36",
              evolves_to: [],
            },
          ],
        },
      ],
    },
  },
  {
    id: 325,
    chain: {
      species_name: "fennekin",
      id: 653,
      min_level: null,
      trigger: null,
      evolves_to: [
        {
          species_name: "braixen",
          id: 654,
          min_level: 16,
          trigger: "Level 16",
          evolves_to: [
            {
              species_name: "delphox",
              id: 655,
              min_level: 36,
              trigger: "Level 36",
              evolves_to: [],
            },
          ],
        },
      ],
    },
  },
  {
    id: 326,
    chain: {
      species_name: "froakie",
      id: 656,
      min_level: null,
      trigger: null,
      evolves_to: [
        {
          species_name: "frogadier",
          id: 657,
          min_level: 16,
          trigger: "Level 16",
          evolves_to: [
            {
              species_name: "greninja",
              id: 658,
              min_level: 36,
              trigger: "Level 36",
              evolves_to: [],
            },
          ],
        },
      ],
    },
  },
  {
    id: 329,
    chain: {
      species_name: "fletchling",
      id: 661,
      min_level: null,
      trigger: null,
      evolves_to: [
        {
          species_name: "fletchinder",
          id: 662,
          min_level: 17,
          trigger: "Level 17",
          evolves_to: [
            {
              species_name: "talonflame",
              id: 663,
              min_level: 35,
              trigger: "Level 35",
              evolves_to: [],
            },
          ],
        },
      ],
    },
  },
  {
    id: 344,
    chain: {
      species_name: "honedge",
      id: 679,
      min_level: null,
      trigger: null,
      evolves_to: [
        {
          species_name: "doublade",
          id: 680,
          min_level: 35,
          trigger: "Level 35",
          evolves_to: [
            {
              species_name: "aegislash",
              id: 681,
              min_level: null,
              trigger: "Dusk Stone",
              evolves_to: [],
            },
          ],
        },
      ],
    },
  },
  {
    id: 67,
    chain: {
      species_name: "eevee",
      id: 133,
      min_level: null,
      trigger: null,
      evolves_to: [
        {
          species_name: "sylveon",
          id: 700,
          min_level: null,
          trigger: "Fairy move + 2 affection hearts",
          evolves_to: [],
        },
      ],
    },
  },
  {
    id: 355,
    chain: {
      species_name: "goomy",
      id: 704,
      min_level: null,
      trigger: null,
      evolves_to: [
        {
          species_name: "sliggoo",
          id: 705,
          min_level: 40,
          trigger: "Level 40",
          evolves_to: [
            {
              species_name: "goodra",
              id: 706,
              min_level: 50,
              trigger: "Level 50, raining",
              evolves_to: [],
            },
          ],
        },
      ],
    },
  },
  {
    id: 361,
    chain: {
      species_name: "noibat",
      id: 714,
      min_level: null,
      trigger: null,
      evolves_to: [
        {
          species_name: "noivern",
          id: 715,
          min_level: 48,
          trigger: "Level 48",
          evolves_to: [],
        },
      ],
    },
  },
  {
    id: 338,
    chain: {
      species_name: "inkay",
      id: 686,
      min_level: null,
      trigger: null,
      evolves_to: [
        {
          species_name: "malamar",
          id: 687,
          min_level: 30,
          trigger: "Level 30, console upside down",
          evolves_to: [],
        },
      ],
    },
  },
  {
    id: 336,
    chain: {
      species_name: "pancham",
      id: 674,
      min_level: null,
      trigger: null,
      evolves_to: [
        {
          species_name: "pangoro",
          id: 675,
          min_level: 32,
          trigger: "Level 32 with a Dark type in party",
          evolves_to: [],
        },
      ],
    },
  },
];

/* ------------------------------------------------------------------ *
 * Pokedex entries
 * ------------------------------------------------------------------ */

export const GEN6_POKEMON: Pokemon[] = [
  {
    id: 650,
    name: "chespin",
    height: 4,
    weight: 90,
    base_experience: 63,
    genus: "Spiny Nut Pokemon",
    types: types("grass"),
    stats: stats(56, 61, 65, 48, 45, 38),
    sprites: artwork(650),
    abilities: abilities(["overgrow"], "bulletproof"),
    moves: [
      move("vine-whip", "grass", "physical", 45, 100),
      move("rollout", "rock", "physical", 30, 90),
      move("bite", "dark", "physical", 60, 100),
      move("seed-bomb", "grass", "physical", 80, 100),
      move("body-slam", "normal", "physical", 85, 100),
    ],
    flavor_text_entries: flavor(
      "The quills on its head are usually soft. When it flexes them, the points become so hard and sharp that they can pierce rock.",
      "x",
    ),
    evolution_chain: { id: 324, url: "local://evolution-chain/324" },
  },
  {
    id: 651,
    name: "quilladin",
    height: 7,
    weight: 290,
    base_experience: 142,
    genus: "Spiny Armor Pokemon",
    types: types("grass"),
    stats: stats(61, 78, 95, 56, 58, 57),
    sprites: artwork(651),
    abilities: abilities(["overgrow"], "bulletproof"),
    moves: [
      move("needle-arm", "grass", "physical", 60, 100),
      move("pin-missile", "bug", "physical", 25, 95),
      move("mud-shot", "ground", "special", 55, 95),
      move("seed-bomb", "grass", "physical", 80, 100),
    ],
    flavor_text_entries: flavor(
      "They strengthen their lower bodies by running into one another. They are gentle and do not like to fight.",
      "y",
    ),
    evolution_chain: { id: 324, url: "local://evolution-chain/324" },
  },
  {
    id: 652,
    name: "chesnaught",
    height: 16,
    weight: 900,
    base_experience: 239,
    genus: "Spiny Armor Pokemon",
    types: types("grass", "fighting"),
    stats: stats(88, 107, 122, 74, 75, 64),
    sprites: artwork(652),
    abilities: abilities(["overgrow"], "bulletproof"),
    moves: [
      move("spiky-shield", "grass", "status", null, null),
      move("hammer-arm", "fighting", "physical", 100, 90),
      move("wood-hammer", "grass", "physical", 120, 100),
      move("stone-edge", "rock", "physical", 100, 80),
      move("belly-drum", "normal", "status", null, null),
    ],
    flavor_text_entries: flavor(
      "Its Tackle is forceful enough to flip a 50-ton tank. It shields its allies from danger with its own body.",
      "x",
    ),
    evolution_chain: { id: 324, url: "local://evolution-chain/324" },
  },
  {
    id: 653,
    name: "fennekin",
    height: 4,
    weight: 94,
    base_experience: 61,
    genus: "Fox Pokemon",
    types: types("fire"),
    stats: stats(40, 45, 40, 62, 60, 60),
    sprites: artwork(653),
    abilities: abilities(["blaze"], "magician"),
    moves: [
      move("ember", "fire", "special", 40, 100),
      move("psybeam", "psychic", "special", 65, 100),
      move("flame-charge", "fire", "physical", 50, 100),
      move("psyshock", "psychic", "special", 80, 100),
    ],
    flavor_text_entries: flavor(
      "Eating a twig fills it with energy, and its roomy ears give vent to air hotter than 390 degrees Fahrenheit.",
      "x",
    ),
    evolution_chain: { id: 325, url: "local://evolution-chain/325" },
  },
  {
    id: 654,
    name: "braixen",
    height: 10,
    weight: 145,
    base_experience: 143,
    genus: "Fox Pokemon",
    types: types("fire"),
    stats: stats(59, 59, 58, 90, 70, 73),
    sprites: artwork(654),
    abilities: abilities(["blaze"], "magician"),
    moves: [
      move("flame-charge", "fire", "physical", 50, 100),
      move("psybeam", "psychic", "special", 65, 100),
      move("fire-spin", "fire", "special", 35, 85),
      move("lucky-chant", "normal", "status", null, null),
    ],
    flavor_text_entries: flavor(
      "It has a twig stuck in its tail. With friction from its tail fur, it sets the twig on fire and launches into battle.",
      "y",
    ),
    evolution_chain: { id: 325, url: "local://evolution-chain/325" },
  },
  {
    id: 655,
    name: "delphox",
    height: 15,
    weight: 390,
    base_experience: 240,
    genus: "Fox Pokemon",
    types: types("fire", "psychic"),
    stats: stats(75, 69, 72, 114, 100, 104),
    sprites: artwork(655),
    abilities: abilities(["blaze"], "magician"),
    moves: [
      move("mystical-fire", "fire", "special", 75, 100),
      move("psychic", "psychic", "special", 90, 100),
      move("flamethrower", "fire", "special", 90, 100),
      move("light-screen", "psychic", "status", null, null),
      move("future-sight", "psychic", "special", 120, 100),
    ],
    flavor_text_entries: flavor(
      "It gazes into the flame at the tip of its branch to achieve a focused state, which allows it to see into the future.",
      "x",
    ),
    evolution_chain: { id: 325, url: "local://evolution-chain/325" },
  },
  {
    id: 656,
    name: "froakie",
    height: 3,
    weight: 70,
    base_experience: 63,
    genus: "Bubble Frog Pokemon",
    types: types("water"),
    stats: stats(41, 56, 40, 62, 44, 71),
    sprites: artwork(656),
    abilities: abilities(["torrent"], "protean"),
    moves: [
      move("bubble", "water", "special", 40, 100),
      move("quick-attack", "normal", "physical", 40, 100),
      move("water-pulse", "water", "special", 60, 100),
      move("smokescreen", "normal", "status", null, 100),
    ],
    flavor_text_entries: flavor(
      "It secretes flexible bubbles from its chest and back. The bubbles reduce the damage it would otherwise take when attacked.",
      "x",
    ),
    evolution_chain: { id: 326, url: "local://evolution-chain/326" },
  },
  {
    id: 657,
    name: "frogadier",
    height: 6,
    weight: 109,
    base_experience: 142,
    genus: "Bubble Frog Pokemon",
    types: types("water"),
    stats: stats(54, 63, 52, 83, 56, 97),
    sprites: artwork(657),
    abilities: abilities(["torrent"], "protean"),
    moves: [
      move("water-pulse", "water", "special", 60, 100),
      move("bounce", "flying", "physical", 85, 85),
      move("round", "normal", "special", 60, 100),
      move("smack-down", "rock", "physical", 50, 100),
    ],
    flavor_text_entries: flavor(
      "It can throw bubble-covered pebbles with precise control, hitting empty cans up to a hundred feet away.",
      "y",
    ),
    evolution_chain: { id: 326, url: "local://evolution-chain/326" },
  },
  {
    id: 658,
    name: "greninja",
    height: 15,
    weight: 400,
    base_experience: 239,
    genus: "Ninja Pokemon",
    types: types("water", "dark"),
    stats: stats(72, 95, 67, 103, 71, 122),
    sprites: artwork(658),
    abilities: abilities(["torrent"], "protean"),
    moves: [
      move("water-shuriken", "water", "special", 15, 100),
      move("hydro-pump", "water", "special", 110, 80),
      move("dark-pulse", "dark", "special", 80, 100),
      move("ice-beam", "ice", "special", 90, 100),
      move("extrasensory", "psychic", "special", 80, 100),
      move("substitute", "normal", "status", null, null),
    ],
    flavor_text_entries: flavor(
      "It creates throwing stars out of compressed water. When it spins them and throws them at high speed, these stars can split metal in two.",
      "x",
    ),
    evolution_chain: { id: 326, url: "local://evolution-chain/326" },
  },
  {
    id: 661,
    name: "fletchling",
    height: 3,
    weight: 17,
    base_experience: 56,
    genus: "Tiny Robin Pokemon",
    types: types("normal", "flying"),
    stats: stats(45, 50, 43, 40, 38, 62),
    sprites: artwork(661),
    abilities: abilities(["big-pecks"], "gale-wings"),
    moves: [
      move("peck", "flying", "physical", 35, 100),
      move("quick-attack", "normal", "physical", 40, 100),
      move("razor-wind", "normal", "special", 80, 100),
      move("aerial-ace", "flying", "physical", 60, null),
    ],
    flavor_text_entries: flavor(
      "These friendly Pokemon send signals to one another with beautiful chirps and tail-feather movements.",
      "x",
    ),
    evolution_chain: { id: 329, url: "local://evolution-chain/329" },
  },
  {
    id: 662,
    name: "fletchinder",
    height: 7,
    weight: 160,
    base_experience: 134,
    genus: "Ember Pokemon",
    types: types("fire", "flying"),
    stats: stats(62, 73, 55, 56, 52, 84),
    sprites: artwork(662),
    abilities: abilities(["flame-body"], "gale-wings"),
    moves: [
      move("flame-charge", "fire", "physical", 50, 100),
      move("acrobatics", "flying", "physical", 55, 100),
      move("ember", "fire", "special", 40, 100),
      move("steel-wing", "steel", "physical", 70, 90),
    ],
    flavor_text_entries: flavor(
      "It shoots off embers to drive prey out of thickets, then finishes them off with a swift dive from above.",
      "y",
    ),
    evolution_chain: { id: 329, url: "local://evolution-chain/329" },
  },
  {
    id: 663,
    name: "talonflame",
    height: 12,
    weight: 245,
    base_experience: 175,
    genus: "Scorching Pokemon",
    types: types("fire", "flying"),
    stats: stats(78, 81, 71, 74, 69, 126),
    sprites: artwork(663),
    abilities: abilities(["flame-body"], "gale-wings"),
    moves: [
      move("brave-bird", "flying", "physical", 120, 100),
      move("flare-blitz", "fire", "physical", 120, 100),
      move("roost", "flying", "status", null, null),
      move("swords-dance", "normal", "status", null, null),
      move("tailwind", "flying", "status", null, null),
    ],
    flavor_text_entries: flavor(
      "In the fever of an intense battle, it showers embers from the gaps between its feathers and takes to the air.",
      "x",
    ),
    evolution_chain: { id: 329, url: "local://evolution-chain/329" },
  },
  {
    id: 668,
    name: "pyroar",
    height: 15,
    weight: 815,
    base_experience: 177,
    genus: "Royal Pokemon",
    types: types("fire", "normal"),
    stats: stats(86, 68, 72, 109, 66, 106),
    sprites: artwork(668),
    abilities: abilities(["rivalry", "unnerve"], "moxie"),
    moves: [
      move("hyper-voice", "normal", "special", 90, 100),
      move("flamethrower", "fire", "special", 90, 100),
      move("dark-pulse", "dark", "special", 80, 100),
      move("will-o-wisp", "fire", "status", null, 85),
    ],
    flavor_text_entries: flavor(
      "The hotter its fire blazes, the stronger the male's mane grows. It scorches anyone that approaches its cubs.",
      "y",
    ),
    evolution_chain: { id: 332, url: "local://evolution-chain/332" },
  },
  {
    id: 675,
    name: "pangoro",
    height: 21,
    weight: 1360,
    base_experience: 173,
    genus: "Daunting Pokemon",
    types: types("fighting", "dark"),
    stats: stats(95, 124, 78, 69, 71, 58),
    sprites: artwork(675),
    abilities: abilities(["iron-fist", "mold-breaker"], "scrappy"),
    moves: [
      move("hammer-arm", "fighting", "physical", 100, 90),
      move("crunch", "dark", "physical", 80, 100),
      move("parting-shot", "dark", "status", null, 100),
      move("bullet-punch", "steel", "physical", 40, 100),
      move("stone-edge", "rock", "physical", 100, 80),
    ],
    flavor_text_entries: flavor(
      "Its bamboo sprig lets it read air currents and predict its opponent's next move before it happens.",
      "x",
    ),
    evolution_chain: { id: 336, url: "local://evolution-chain/336" },
  },
  {
    id: 681,
    name: "aegislash",
    height: 17,
    weight: 530,
    base_experience: 234,
    genus: "Royal Sword Pokemon",
    types: types("steel", "ghost"),
    stats: stats(60, 50, 140, 50, 140, 60),
    sprites: artwork(681),
    abilities: abilities(["stance-change"]),
    moves: [
      move("kings-shield", "steel", "status", null, null),
      move("sacred-sword", "fighting", "physical", 90, 100),
      move("shadow-ball", "ghost", "special", 80, 100),
      move("iron-head", "steel", "physical", 80, 100),
      move("shadow-sneak", "ghost", "physical", 40, 100),
      move("swords-dance", "normal", "status", null, null),
    ],
    flavor_text_entries: flavor(
      "Generations of kings were attended by these Pokemon, which used their spectral power to manipulate and control people and Pokemon.",
      "x",
    ),
    evolution_chain: { id: 344, url: "local://evolution-chain/344" },
  },
  {
    id: 687,
    name: "malamar",
    height: 15,
    weight: 470,
    base_experience: 169,
    genus: "Overturning Pokemon",
    types: types("dark", "psychic"),
    stats: stats(86, 92, 88, 68, 75, 73),
    sprites: artwork(687),
    abilities: abilities(["contrary", "suction-cups"], "infiltrator"),
    moves: [
      move("superpower", "fighting", "physical", 120, 100),
      move("psycho-cut", "psychic", "physical", 70, 100),
      move("knock-off", "dark", "physical", 65, 100),
      move("hypnosis", "psychic", "status", null, 60),
    ],
    flavor_text_entries: flavor(
      "It emits hypnotic waves from the light-emitting spots on its body. It has the most compelling hypnotic powers of any Pokemon.",
      "y",
    ),
    evolution_chain: { id: 338, url: "local://evolution-chain/338" },
  },
  {
    id: 700,
    name: "sylveon",
    height: 10,
    weight: 235,
    base_experience: 184,
    genus: "Intertwining Pokemon",
    types: types("fairy"),
    stats: stats(95, 65, 65, 110, 130, 60),
    sprites: artwork(700),
    abilities: abilities(["cute-charm"], "pixilate"),
    moves: [
      move("moonblast", "fairy", "special", 95, 100),
      move("hyper-voice", "normal", "special", 90, 100),
      move("wish", "normal", "status", null, null),
      move("calm-mind", "psychic", "status", null, null),
      move("shadow-ball", "ghost", "special", 80, 100),
    ],
    flavor_text_entries: flavor(
      "It wraps its ribbonlike feelers around the arm of its beloved Trainer and walks with them.",
      "x",
    ),
    evolution_chain: { id: 67, url: "local://evolution-chain/67" },
  },
  {
    id: 701,
    name: "hawlucha",
    height: 8,
    weight: 215,
    base_experience: 175,
    genus: "Wrestling Pokemon",
    types: types("fighting", "flying"),
    stats: stats(78, 92, 75, 74, 63, 118),
    sprites: artwork(701),
    abilities: abilities(["limber", "unburden"], "mold-breaker"),
    moves: [
      move("flying-press", "fighting", "physical", 100, 95),
      move("high-jump-kick", "fighting", "physical", 130, 90),
      move("acrobatics", "flying", "physical", 55, 100),
      move("swords-dance", "normal", "status", null, null),
      move("roost", "flying", "status", null, null),
    ],
    flavor_text_entries: flavor(
      "Although its body is small, its proficient fighting skills enable it to keep up with big bruisers like Machamp.",
      "y",
    ),
    evolution_chain: { id: 350, url: "local://evolution-chain/350" },
  },
  {
    id: 706,
    name: "goodra",
    height: 20,
    weight: 1505,
    base_experience: 270,
    genus: "Dragon Pokemon",
    types: types("dragon"),
    stats: stats(90, 100, 70, 110, 150, 80),
    sprites: artwork(706),
    abilities: abilities(["sap-sipper", "hydration"], "gooey"),
    moves: [
      move("dragon-pulse", "dragon", "special", 85, 100),
      move("muddy-water", "water", "special", 90, 85),
      move("thunderbolt", "electric", "special", 90, 100),
      move("power-whip", "grass", "physical", 120, 85),
      move("acid-armor", "poison", "status", null, null),
    ],
    flavor_text_entries: flavor(
      "It is said to be one of the most affectionate Pokemon. It attacks anyone who threatens its Trainer with a full-power headbutt.",
      "x",
    ),
    evolution_chain: { id: 355, url: "local://evolution-chain/355" },
  },
  {
    id: 715,
    name: "noivern",
    height: 15,
    weight: 850,
    base_experience: 187,
    genus: "Sound Wave Pokemon",
    types: types("flying", "dragon"),
    stats: stats(85, 70, 80, 97, 80, 123),
    sprites: artwork(715),
    abilities: abilities(["frisk", "infiltrator"], "telepathy"),
    moves: [
      move("boomburst", "normal", "special", 140, 100),
      move("hurricane", "flying", "special", 110, 70),
      move("draco-meteor", "dragon", "special", 130, 90),
      move("u-turn", "bug", "physical", 70, 100),
      move("tailwind", "flying", "status", null, null),
    ],
    flavor_text_entries: flavor(
      "The ultrasonic waves it emits from its ears can reduce a large boulder to pebbles. It flies about on moonless nights.",
      "y",
    ),
    evolution_chain: { id: 361, url: "local://evolution-chain/361" },
  },
  {
    id: 716,
    name: "xerneas",
    height: 30,
    weight: 2150,
    base_experience: 306,
    genus: "Life Pokemon",
    types: types("fairy"),
    stats: stats(126, 131, 95, 131, 98, 99),
    sprites: artwork(716),
    abilities: abilities(["fairy-aura"]),
    moves: [
      move("geomancy", "fairy", "status", null, null),
      move("moonblast", "fairy", "special", 95, 100),
      move("megahorn", "bug", "physical", 120, 85),
      move("aromatherapy", "grass", "status", null, null),
      move("close-combat", "fighting", "physical", 120, 100),
    ],
    flavor_text_entries: flavor(
      "Legends say it can share eternal life. It slept for a thousand years in the form of a tree before its revival.",
      "x",
    ),
    evolution_chain: { id: 362, url: "local://evolution-chain/362" },
  },
  {
    id: 717,
    name: "yveltal",
    height: 58,
    weight: 2030,
    base_experience: 306,
    genus: "Destruction Pokemon",
    types: types("dark", "flying"),
    stats: stats(126, 131, 95, 131, 98, 99),
    sprites: artwork(717),
    abilities: abilities(["dark-aura"]),
    moves: [
      move("oblivion-wing", "flying", "special", 80, 100),
      move("dark-pulse", "dark", "special", 80, 100),
      move("sucker-punch", "dark", "physical", 70, 100),
      move("hurricane", "flying", "special", 110, 70),
      move("foul-play", "dark", "physical", 95, 100),
    ],
    flavor_text_entries: flavor(
      "When this legendary Pokemon's wings and tail feathers spread wide and glow red, it absorbs the life force of living creatures.",
      "y",
    ),
    evolution_chain: { id: 363, url: "local://evolution-chain/363" },
  },
  {
    id: 718,
    name: "zygarde",
    height: 50,
    weight: 3050,
    base_experience: 270,
    genus: "Order Pokemon",
    types: types("dragon", "ground"),
    stats: stats(108, 100, 121, 81, 95, 95),
    sprites: artwork(718),
    abilities: abilities(["aura-break"], "power-construct"),
    moves: [
      move("land-s-wrath", "ground", "physical", 90, 100),
      move("dragon-dance", "dragon", "status", null, null),
      move("earthquake", "ground", "physical", 100, 100),
      move("outrage", "dragon", "physical", 120, 100),
      move("coil", "poison", "status", null, null),
    ],
    flavor_text_entries: flavor(
      "It is said to live in caves and monitor the ecosystem. It reveals its true power when the balance of Kalos is disturbed.",
      "x",
    ),
    evolution_chain: { id: 364, url: "local://evolution-chain/364" },
  },
  {
    id: 719,
    name: "diancie",
    height: 7,
    weight: 88,
    base_experience: 270,
    genus: "Jewel Pokemon",
    types: types("rock", "fairy"),
    stats: stats(50, 100, 150, 100, 150, 50),
    sprites: artwork(719),
    abilities: abilities(["clear-body"]),
    moves: [
      move("diamond-storm", "rock", "physical", 100, 95),
      move("moonblast", "fairy", "special", 95, 100),
      move("power-gem", "rock", "special", 80, 100),
      move("reflect", "psychic", "status", null, null),
      move("light-screen", "psychic", "status", null, null),
    ],
    flavor_text_entries: flavor(
      "A sudden transformation of Carbink, its pink glimmer is said to be the most beautiful sight in the world.",
      "y",
    ),
    evolution_chain: { id: 365, url: "local://evolution-chain/365" },
  },
];

/**
 * Species that appear inside evolution chains but are not Kalos natives
 * (Eevee) or are covered by the dex list. Used by the evolution view so every
 * node in a chain can render artwork and a type badge.
 */
export const CHAIN_SPECIES_EXTRAS: Record<
  number,
  { name: string; types: TypeName[]; sprites: PokemonSprites }
> = {
  133: { name: "eevee", types: ["normal"], sprites: artwork(133) },
  674: { name: "pancham", types: ["fighting"], sprites: artwork(674) },
  679: { name: "honedge", types: ["steel", "ghost"], sprites: artwork(679) },
  680: { name: "doublade", types: ["steel", "ghost"], sprites: artwork(680) },
  686: { name: "inkay", types: ["dark", "psychic"], sprites: artwork(686) },
  704: { name: "goomy", types: ["dragon"], sprites: artwork(704) },
  705: { name: "sliggoo", types: ["dragon"], sprites: artwork(705) },
  714: { name: "noibat", types: ["flying", "dragon"], sprites: artwork(714) },
};

/* ------------------------------------------------------------------ *
 * Async surface
 * ------------------------------------------------------------------ */

/** PokeAPI never responds instantly. Neither do we. */
const latency = () => 300 + Math.round(Math.random() * 200);

function respond<T>(payload: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(structuredClone(payload)), latency());
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

/** Every Generation 6 entry held locally, in National Dex order. */
export async function fetchGen6Pokemon(): Promise<PokemonListResponse> {
  const results = [...GEN6_POKEMON].sort((a, b) => a.id - b.id);
  return respond({ count: results.length, results });
}

/** Name or dex-number search. An empty query returns the full list. */
export async function searchLocalPokemon(
  query: string,
): Promise<PokemonListResponse> {
  const q = query.trim().toLowerCase();
  if (!q) return fetchGen6Pokemon();
  const results = GEN6_POKEMON.filter(
    (p) =>
      p.name.includes(q) ||
      String(p.id) === q ||
      p.types.some((t) => t.type.name.includes(q)),
  ).sort((a, b) => a.id - b.id);
  return respond({ count: results.length, results });
}

/** Full detail record for one Pokemon, by dex number or name. */
export async function fetchPokemonDetails(
  idOrName: number | string,
): Promise<Pokemon> {
  const key = String(idOrName).toLowerCase();
  const found = GEN6_POKEMON.find(
    (p) => String(p.id) === key || p.name === key,
  );
  if (!found) return reject(`No Kalos entry found for "${idOrName}".`);
  return respond(found);
}

/** Evolution chains for the Kalos families held locally. */
export async function fetchEvolutionChains(): Promise<EvolutionChain[]> {
  return respond(EVOLUTION_CHAINS);
}

export async function fetchEvolutionChain(id: number): Promise<EvolutionChain> {
  const found = EVOLUTION_CHAINS.find((c) => c.id === id);
  if (!found) return reject(`No evolution chain with id ${id}.`);
  return respond(found);
}
