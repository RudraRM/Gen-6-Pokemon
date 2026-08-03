#!/usr/bin/env node
/**
 * Generates `src/api/pokedexData.ts` - every Pokemon from Generation 1 through
 * Generation 6 (National Dex 1-721), their Mega Evolutions, and their
 * evolution chains.
 *
 * Source of truth is PokeAPI. The public REST service at
 * https://pokeapi.co/api/v2 serves one document per resource, which would be
 * ~1500 requests and half a gigabyte for this dex, so this reads the same data
 * from PokeAPI's own data distribution instead - the CSV tables in
 * https://github.com/PokeAPI/pokeapi that the REST service is built from. The
 * numbers are identical either way; only the transport differs.
 *
 * Usage:
 *   npm run build:pokedex              # fetch fresh tables and regenerate
 *   POKEDEX_CSV_CACHE=./tmp/csv npm run build:pokedex
 *                                      # reuse (or populate) a local copy
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = join(ROOT, "src", "api", "pokedexData.ts");

const CSV_ROOT =
  "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv";
const CACHE_DIR = process.env.POKEDEX_CSV_CACHE
  ? resolve(process.env.POKEDEX_CSV_CACHE)
  : null;

/** National Dex 1-721: Bulbasaur through Volcanion. */
const MAX_DEX = 721;
const MAX_GENERATION = 6;
const ENGLISH = 9;

const TABLES = [
  "abilities",
  "evolution_triggers",
  "item_names",
  "moves",
  "pokemon",
  "pokemon_abilities",
  "pokemon_evolution",
  "pokemon_forms",
  "pokemon_moves",
  "pokemon_species",
  "pokemon_species_flavor_text",
  "pokemon_species_names",
  "pokemon_stats",
  "pokemon_types",
  "stats",
  "types",
  "version_groups",
  "version_names",
  "versions",
];

/* ----------------------------- csv plumbing ----------------------------- */

/** RFC 4180 reader. Flavor text carries quoted newlines, so this matters. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") {
      field += ch;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  const [header, ...body] = rows;
  return body
    .filter((r) => r.length === header.length)
    .map((r) => Object.fromEntries(header.map((key, i) => [key, r[i]])));
}

const num = (value) => (value === "" || value == null ? null : Number(value));

async function loadTable(name) {
  const cached = CACHE_DIR ? join(CACHE_DIR, `${name}.csv`) : null;
  if (cached && existsSync(cached)) {
    return parseCsv(await readFile(cached, "utf8"));
  }

  const response = await fetch(`${CSV_ROOT}/${name}.csv`);
  if (!response.ok) {
    throw new Error(`${name}.csv: PokeAPI answered ${response.status}`);
  }
  const text = await response.text();
  if (cached) {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(cached, text);
  }
  return parseCsv(text);
}

/** Groups rows by a key, preserving file order within each bucket. */
function groupBy(rows, key) {
  const out = new Map();
  for (const row of rows) {
    const k = row[key];
    const bucket = out.get(k);
    if (bucket) bucket.push(row);
    else out.set(k, [row]);
  }
  return out;
}

const byId = (rows, key = "id") =>
  new Map(rows.map((row) => [row[key], row]));

/* ------------------------------ formatting ------------------------------ */

/**
 * PokeAPI ships flavor text as it appeared in-game: hard-wrapped, sometimes
 * with a form feed between pages, and with the accented, all-caps "POKéMON"
 * used up to Generation 5. The dex renders it as a sentence.
 */
function cleanFlavor(text) {
  return text
    .replace(/[\n\f­]/g, " ")
    .replace(/’/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/POK[eé]MON/g, "Pokemon")
    .replace(/Pok[eé]mon/g, "Pokemon")
    .replace(/[éÉ]/g, "e")
    .replace(/\s+/g, " ")
    .trim();
}

const titleize = (slug) =>
  slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

/** Mega form suffixes, as the games print them. */
const MEGA_SUFFIXES = {
  x: "X",
  y: "Y",
  z: "Z",
  male: "(Male)",
  female: "(Female)",
};

/**
 * "charizard" + "mega-x" -> "Mega Charizard X". PokeAPI names forms
 * species-first so slugs sort together; the games say it the other way round.
 */
function megaDisplayName(speciesName, formIdentifier) {
  const species = titleize(speciesName);
  const suffix = formIdentifier.replace(/^mega-?/, "");
  if (!suffix) return `Mega ${species}`;
  return `Mega ${species} ${MEGA_SUFFIXES[suffix] ?? titleize(suffix)}`;
}

/* ------------------------------- the build ------------------------------- */

async function main() {
  console.log("Reading PokeAPI tables...");
  const tables = Object.fromEntries(
    await Promise.all(
      TABLES.map(async (name) => [name, await loadTable(name)]),
    ),
  );
  console.log("  done\n");

  /* --- lookups ---------------------------------------------------------- */

  const typeNames = tables.types
    .filter((t) => Number(t.id) < 10000)
    .sort((a, b) => Number(a.id) - Number(b.id))
    .map((t) => t.identifier);
  const typeIndex = new Map(
    tables.types.map((t) => [t.id, typeNames.indexOf(t.identifier)]),
  );

  // PokeAPI orders stats hp, attack, defense, special-attack, special-defense,
  // speed as ids 1-6. Above that sit accuracy, evasion and the combined
  // Generation 1 "special", none of which belong on a stat spread.
  const statOrder = tables.stats
    .filter((s) => s.is_battle_only === "0" && Number(s.id) <= 6)
    .sort((a, b) => Number(a.id) - Number(b.id));
  const statNames = statOrder.map((s) => s.identifier);
  const statSlot = new Map(statOrder.map((s, i) => [s.id, i]));

  const abilitySlug = byId(tables.abilities);

  const versionGroup = byId(tables.version_groups);
  const version = byId(tables.versions);
  const versionName = new Map(
    tables.version_names
      .filter((v) => v.local_language_id === String(ENGLISH))
      .map((v) => [v.version_id, v.name]),
  );
  const versionGeneration = (versionId) =>
    Number(versionGroup.get(version.get(versionId)?.version_group_id)
      ?.generation_id ?? 99);

  const itemName = new Map(
    tables.item_names
      .filter((i) => i.local_language_id === String(ENGLISH))
      .map((i) => [i.item_id, i.name.replace(/\u2019/g, "'")]),
  );
  const triggerName = byId(tables.evolution_triggers);

  /* --- move table ------------------------------------------------------- */

  const damageClass = { 1: "status", 2: "physical", 3: "special" };
  const moveById = byId(tables.moves);

  /** Move id -> index into the emitted MOVES table, filled on demand. */
  const moveTable = [];
  const moveSlot = new Map();
  const internMove = (moveId) => {
    const known = moveSlot.get(moveId);
    if (known !== undefined) return known;
    const move = moveById.get(moveId);
    const slot = moveTable.length;
    moveTable.push([
      move.identifier,
      typeIndex.get(move.type_id) ?? 0,
      damageClass[move.damage_class_id] ?? "status",
      num(move.power),
      num(move.accuracy),
    ]);
    moveSlot.set(moveId, slot);
    return slot;
  };

  /* --- species ---------------------------------------------------------- */

  const speciesRows = tables.pokemon_species
    .filter(
      (s) =>
        Number(s.id) <= MAX_DEX &&
        Number(s.generation_id) <= MAX_GENERATION,
    )
    .sort((a, b) => Number(a.id) - Number(b.id));

  const speciesById = byId(speciesRows);

  const genusByspecies = new Map(
    tables.pokemon_species_names
      .filter((n) => n.local_language_id === String(ENGLISH))
      .map((n) => [n.pokemon_species_id, n.genus]),
  );

  // The default battle form is the dex entry; alternate forms (megas, Rotom
  // appliances, Deoxys spreads) hang off the same species id.
  const defaultPokemonBySpecies = new Map();
  for (const p of tables.pokemon) {
    if (p.is_default === "1") defaultPokemonBySpecies.set(p.species_id, p);
  }

  const typesByPokemon = groupBy(tables.pokemon_types, "pokemon_id");
  const statsByPokemon = groupBy(tables.pokemon_stats, "pokemon_id");
  const abilitiesByPokemon = groupBy(tables.pokemon_abilities, "pokemon_id");
  const flavorBySpecies = groupBy(tables.pokemon_species_flavor_text, "species_id");
  const movesByPokemon = groupBy(tables.pokemon_moves, "pokemon_id");

  const typesOf = (pokemonId) =>
    (typesByPokemon.get(pokemonId) ?? [])
      .sort((a, b) => Number(a.slot) - Number(b.slot))
      .map((t) => typeIndex.get(t.type_id));

  const statsOf = (pokemonId) => {
    const line = new Array(statNames.length).fill(0);
    for (const row of statsByPokemon.get(pokemonId) ?? []) {
      const slot = statSlot.get(row.stat_id);
      if (slot !== undefined) line[slot] = Number(row.base_stat);
    }
    return line;
  };

  // Slugs, not display names: the app title-cases every PokeAPI slug itself.
  const abilitiesOf = (pokemonId) =>
    (abilitiesByPokemon.get(pokemonId) ?? [])
      .sort((a, b) => Number(a.slot) - Number(b.slot))
      .map((a) => [
        abilitySlug.get(a.ability_id)?.identifier ?? "unknown",
        a.is_hidden === "1" ? 1 : 0,
      ]);

  /** Newest Generation 1-6 English Pokedex entry available for a species. */
  const flavorOf = (speciesId) => {
    const entries = (flavorBySpecies.get(speciesId) ?? []).filter(
      (f) =>
        f.language_id === String(ENGLISH) &&
        versionGeneration(f.version_id) <= MAX_GENERATION,
    );
    if (!entries.length) return ["", ""];
    const best = entries.reduce((a, b) =>
      Number(b.version_id) > Number(a.version_id) ? b : a,
    );
    return [
      cleanFlavor(best.flavor_text),
      versionName.get(best.version_id) ??
        titleize(version.get(best.version_id)?.identifier ?? ""),
    ];
  };

  const LEVEL_UP = "1";

  /**
   * Five moves worth showing: three same-type attacks, one coverage attack,
   * and the status move the Pokemon earns latest by level.
   *
   * Ranking purely on power would give nearly every Pokemon the same four
   * universal TMs, so same-type moves are drawn first and being on the
   * level-up list breaks ties. That surfaces Charizard's Flare Blitz and
   * Gengar's Shadow Ball ahead of the Hyper Beam everybody shares.
   */
  const movesOf = (pokemonId, memberTypes) => {
    const learnable = (movesByPokemon.get(pokemonId) ?? []).filter(
      (m) =>
        Number(versionGroup.get(m.version_group_id)?.generation_id ?? 99) <=
        MAX_GENERATION,
    );

    const attacks = new Map();
    const status = new Map();
    for (const entry of learnable) {
      const move = moveById.get(entry.move_id);
      if (!move) continue;
      const natural = entry.pokemon_move_method_id === LEVEL_UP;

      if (damageClass[move.damage_class_id] === "status") {
        if (!natural) continue;
        const level = Number(entry.level || 0);
        status.set(entry.move_id, Math.max(status.get(entry.move_id) ?? 0, level));
        continue;
      }

      const score = (num(move.power) ?? 0) + (natural ? 30 : 0);
      attacks.set(entry.move_id, Math.max(attacks.get(entry.move_id) ?? 0, score));
    }

    const stab = (id) =>
      memberTypes.includes(typeIndex.get(moveById.get(id).type_id));
    const power = (id) => num(moveById.get(id).power) ?? 0;
    const ranked = [...attacks.entries()]
      .sort((a, b) => b[1] - a[1] || Number(a[0]) - Number(b[0]))
      .map(([id]) => id);

    const picks = ranked.filter(stab).slice(0, 3);
    const coverage = ranked.find((id) => !picks.includes(id));
    if (coverage) picks.push(coverage);
    // Narrow movepools (Magikarp, Metapod) can come up short either way.
    for (const id of ranked) {
      if (picks.length >= 4) break;
      if (!picks.includes(id)) picks.push(id);
    }
    picks.sort((a, b) => power(b) - power(a));

    const bestStatus = [...status.entries()].sort(
      (a, b) => b[1] - a[1] || Number(a[0]) - Number(b[0]),
    )[0];

    return (bestStatus ? [...picks, bestStatus[0]] : picks).map(internMove);
  };

  const SPECIES = speciesRows.map((species) => {
    const pokemon = defaultPokemonBySpecies.get(species.id);
    if (!pokemon) throw new Error(`No default form for species ${species.id}`);
    const types = typesOf(pokemon.id);
    const [flavorText, flavorVersion] = flavorOf(species.id);
    return [
      Number(species.id),
      species.identifier,
      Number(species.generation_id),
      Number(pokemon.height),
      Number(pokemon.weight),
      num(pokemon.base_experience) ?? 0,
      cleanFlavor(genusByspecies.get(species.id) ?? "Pokemon"),
      types,
      statsOf(pokemon.id),
      abilitiesOf(pokemon.id),
      movesOf(pokemon.id, types),
      flavorText,
      flavorVersion,
      Number(species.evolution_chain_id),
    ];
  });

  /* --- mega evolutions -------------------------------------------------- */

  const pokemonById = byId(tables.pokemon);
  const debutOrder = ["x-y", "omega-ruby-alpha-sapphire"];
  const debutLabels = {
    "x-y": "X / Y",
    "omega-ruby-alpha-sapphire": "Omega Ruby / Alpha Sapphire",
    "legends-za": "Legends: Z-A",
    "mega-dimension": "Legends: Z-A",
  };

  const megaForms = tables.pokemon_forms
    .filter((f) => f.is_mega === "1")
    .map((f) => ({ form: f, pokemon: pokemonById.get(f.pokemon_id) }))
    // Only megas belonging to a Pokemon that is now in the dex.
    .filter(({ pokemon }) => pokemon && speciesById.has(pokemon.species_id))
    .sort(
      (a, b) =>
        Number(a.pokemon.species_id) - Number(b.pokemon.species_id) ||
        Number(a.form.form_order) - Number(b.form.form_order),
    );

  const debuts = [];
  const debutSlot = (versionGroupId) => {
    const slug = versionGroup.get(versionGroupId)?.identifier ?? "unknown";
    const label = debutLabels[slug] ?? titleize(slug);
    const existing = debuts.findIndex((d) => d[0] === slug);
    if (existing >= 0) return existing;
    debuts.push([slug, label, Number(versionGroup.get(versionGroupId)?.generation_id ?? 0)]);
    return debuts.length - 1;
  };

  const MEGAS = megaForms.map(({ form, pokemon }) => {
    const species = speciesById.get(pokemon.species_id);
    const base = defaultPokemonBySpecies.get(pokemon.species_id);
    const ability = abilitiesOf(pokemon.id)[0];
    return [
      Number(pokemon.id),
      pokemon.identifier,
      Number(species.id),
      megaDisplayName(species.identifier, form.form_identifier),
      debutSlot(form.introduced_in_version_group_id),
      typesOf(pokemon.id),
      statsOf(pokemon.id),
      // A handful of the newest mega forms have no ability on record yet.
      ability ? ability[0] : "",
      Number(pokemon.height),
      Number(pokemon.weight),
      typesOf(base.id),
      statsOf(base.id),
    ];
  });

  /* --- evolution chains ------------------------------------------------- */

  const evolutionDetail = new Map();
  for (const row of tables.pokemon_evolution) {
    // A species can list one row per version group, and later generations add
    // paths for regional forms - Slowking evolves with a King's Rock here, not
    // with the Galarica Wreath that only Galarian Slowpoke ever uses. Keep the
    // first Generation 1-6 route that applies to the ordinary form.
    if (row.base_form_id) continue;
    if (
      Number(versionGroup.get(row.version_group_id)?.generation_id ?? 99) >
      MAX_GENERATION
    ) {
      continue;
    }
    if (!evolutionDetail.has(row.evolved_species_id)) {
      evolutionDetail.set(row.evolved_species_id, row);
    }
  }

  /** Human-readable version of an evolution's requirements. */
  function triggerText(detail) {
    if (!detail) return null;
    const trigger = triggerName.get(detail.evolution_trigger_id)?.identifier;
    const clauses = [];
    const level = num(detail.minimum_level);

    if (trigger === "use-item" || detail.trigger_item_id) {
      clauses.push(itemName.get(detail.trigger_item_id) ?? "Evolution item");
    } else if (trigger === "trade") {
      clauses.push("Trade");
      if (detail.held_item_id) {
        clauses.push(`holding ${itemName.get(detail.held_item_id)}`);
      }
      if (detail.trade_species_id) {
        const partner = speciesById.get(detail.trade_species_id);
        if (partner) clauses.push(`for ${titleize(partner.identifier)}`);
      }
    } else if (trigger === "shed") {
      clauses.push("Level 20 with a free party slot and a spare Poke Ball");
    } else if (level) {
      clauses.push(`Level ${level}`);
    } else if (trigger && trigger !== "level-up") {
      clauses.push(titleize(trigger));
    } else {
      clauses.push("Level up");
    }

    if (trigger !== "trade" && detail.held_item_id) {
      clauses.push(`holding ${itemName.get(detail.held_item_id)}`);
    }
    if (num(detail.minimum_happiness)) clauses.push("with high friendship");
    if (num(detail.minimum_affection)) clauses.push("with high affection");
    if (num(detail.minimum_beauty)) clauses.push("with high beauty");
    if (detail.known_move_id) {
      const move = moveById.get(detail.known_move_id);
      if (move) clauses.push(`knowing ${titleize(move.identifier)}`);
    }
    if (detail.known_move_type_id) {
      clauses.push(`knowing a ${typeNames[typeIndex.get(detail.known_move_type_id)]} move`);
    }
    if (detail.party_species_id) {
      const mate = speciesById.get(detail.party_species_id);
      if (mate) clauses.push(`with ${titleize(mate.identifier)} in the party`);
    }
    if (detail.party_type_id) {
      clauses.push(`with a ${typeNames[typeIndex.get(detail.party_type_id)]} type in the party`);
    }
    if (detail.time_of_day) clauses.push(`during the ${detail.time_of_day}`);
    if (detail.gender_id) {
      clauses.push(detail.gender_id === "1" ? "female only" : "male only");
    }
    if (detail.relative_physical_stats === "1") clauses.push("Attack > Defense");
    if (detail.relative_physical_stats === "-1") clauses.push("Defense > Attack");
    if (detail.relative_physical_stats === "0") clauses.push("Attack = Defense");
    if (detail.needs_overworld_rain === "1") clauses.push("while it is raining");
    if (detail.turn_upside_down === "1") clauses.push("holding the console upside down");
    if (detail.near_special_rock === "1") clauses.push("near a special rock");
    if (detail.location_id) clauses.push("at a specific location");

    const [head, ...rest] = clauses;
    return rest.length ? `${head}, ${rest.join(", ")}` : head;
  }

  const childrenOf = new Map();
  for (const species of speciesRows) {
    const parent = species.evolves_from_species_id;
    if (!parent) continue;
    if (!childrenOf.has(parent)) childrenOf.set(parent, []);
    childrenOf.get(parent).push(species);
  }

  const buildNode = (species) => {
    const detail = evolutionDetail.get(species.id);
    return {
      id: Number(species.id),
      name: species.identifier,
      minLevel: species.evolves_from_species_id
        ? num(detail?.minimum_level)
        : null,
      trigger: species.evolves_from_species_id ? triggerText(detail) : null,
      // Gen 7+ additions to old families (Sirfetch'd, Kingambit, ...) are not
      // in this dex, so they are pruned rather than rendered as dead ends.
      children: (childrenOf.get(species.id) ?? [])
        .sort((a, b) => Number(a.id) - Number(b.id))
        .map(buildNode),
    };
  };

  const CHAINS = speciesRows
    .filter((s) => !s.evolves_from_species_id)
    .map((root) => ({
      id: Number(root.evolution_chain_id),
      chain: buildNode(root),
    }))
    .sort((a, b) => a.id - b.id);

  /* --- emit ------------------------------------------------------------- */

  const json = (value) => JSON.stringify(value);
  const rows = (list) => list.map((row) => `  ${json(row)},`).join("\n");

  const source = `/**
 * GENERATED FILE - do not edit by hand.
 *
 * Run \`npm run build:pokedex\` to rebuild it from PokeAPI.
 * Covers National Dex ${1}-${MAX_DEX}: every Pokemon from Generation 1 through
 * Generation ${MAX_GENERATION}, their Mega Evolutions, and their evolution chains.
 *
 * Rows are tuples rather than objects because this file ships in the bundle;
 * \`localPokeApi.ts\` hydrates them into the PokeAPI-shaped records the app uses.
 */

/* eslint-disable */

export const POKEDEX_SOURCE = "https://pokeapi.co/api/v2";
export const POKEDEX_GENERATED_AT = ${json(new Date().toISOString().slice(0, 10))};
export const POKEDEX_MAX_DEX = ${MAX_DEX};

export const TYPE_NAMES = ${json(typeNames)} as const;
export const STAT_NAMES = ${json(statNames)} as const;

/** Generation boundaries, keyed by generation number. */
export const GENERATION_RANGES: Record<number, { first: number; last: number; region: string }> = {
${[1, 2, 3, 4, 5, 6]
  .map((gen) => {
    const ids = speciesRows
      .filter((s) => Number(s.generation_id) === gen)
      .map((s) => Number(s.id));
    const region = {
      1: "Kanto",
      2: "Johto",
      3: "Hoenn",
      4: "Sinnoh",
      5: "Unova",
      6: "Kalos",
    }[gen];
    return `  ${gen}: { first: ${Math.min(...ids)}, last: ${Math.max(...ids)}, region: ${json(region)} },`;
  })
  .join("\n")}
};

/** [slug, typeIndex, damageClass, power, accuracy] */
export type MoveRow = [string, number, string, number | null, number | null];
export const MOVES: MoveRow[] = [
${rows(moveTable)}
];

/** [slug, isHidden] */
export type AbilityRow = [string, 0 | 1];

/**
 * [dexId, slug, generation, height, weight, baseExperience, genus, typeIndexes,
 *  baseStats, abilities, moveIndexes, flavorText, flavorVersion, chainId]
 */
export type SpeciesRow = [
  number,
  string,
  number,
  number,
  number,
  number,
  string,
  number[],
  number[],
  AbilityRow[],
  number[],
  string,
  string,
  number,
];

export const SPECIES: SpeciesRow[] = [
${rows(SPECIES)}
];

/** [slug, label, generation] for the games a Mega Evolution debuted in. */
export const MEGA_DEBUTS: [string, string, number][] = ${json(debuts)};

/**
 * [formId, slug, dexId, displayName, debutIndex, typeIndexes, baseStats,
 *  ability, height, weight, preMegaTypeIndexes, preMegaStats]
 */
export type MegaRow = [
  number,
  string,
  number,
  string,
  number,
  number[],
  number[],
  string,
  number,
  number,
  number[],
  number[],
];

export const MEGAS: MegaRow[] = [
${rows(MEGAS)}
];

export interface ChainNodeData {
  id: number;
  name: string;
  minLevel: number | null;
  trigger: string | null;
  children: ChainNodeData[];
}

export const CHAINS: { id: number; chain: ChainNodeData }[] = [
${CHAINS.map((c) => `  ${json(c)},`).join("\n")}
];
`;

  await writeFile(OUT_FILE, source);

  const megasByDebut = debuts.map(
    ([, label], i) => `${label}: ${MEGAS.filter((m) => m[4] === i).length}`,
  );
  console.log(`Wrote ${OUT_FILE}`);
  console.log(`  species        ${SPECIES.length}`);
  console.log(`  moves          ${moveTable.length}`);
  console.log(`  mega forms     ${MEGAS.length} (${megasByDebut.join(", ")})`);
  console.log(`  chains         ${CHAINS.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
