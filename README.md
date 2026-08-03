# Kalos Pokédex

An interactive Pokédex covering **National Dex 1-721** - every Pokémon from
Generation 1 through Generation 6 - with a dark-mode landing page and a
dashboard of animated tabs: an alphabetical dex grid, evolution flow charts, an
interactive type matchup matrix, and every Mega Evolution those Pokémon have.

Built with React 18, TypeScript, Tailwind CSS v4, Framer Motion, and Lucide.

## Running it

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # typecheck + production bundle
npm run preview        # serve the production build
npm run build:pokedex  # regenerate the dataset from PokéAPI
```

No API keys, no backend, no configuration. It works out of the box.

## Data

Everything comes from [PokéAPI](https://pokeapi.co). `scripts/build-pokedex.mjs`
pulls it ahead of time and writes `src/api/pokedexData.ts`, so the dex ships
with the bundle: 721 entries open instantly and keep working offline.

The public REST service hands out one document per resource, which for this dex
would be roughly 1500 requests and half a gigabyte, so the script reads the same
numbers from PokéAPI's own data distribution - the CSV tables in
[PokeAPI/pokeapi](https://github.com/PokeAPI/pokeapi) that the REST service is
built from. Re-run it any time; the output is deterministic.

| Generated | Rows |
| --- | --- |
| `SPECIES` | 721 Pokémon, Generations 1-6 |
| `MEGAS` | 84 Mega Evolution forms |
| `CHAINS` | 366 evolution chains |
| `MOVES` | interned move table the species rows point into |

`src/api/localPokeApi.ts` hydrates those tuples into PokéAPI-shaped records and
exposes them behind an async surface with a simulated 300-500ms delay, so
loading and error states are exercised for real:

| Function | Returns |
| --- | --- |
| `fetchAllPokemon()` | `{ count, results }` for the full dex, sorted A-Z |
| `searchLocalPokemon(query)` | Same shape, filtered by name, dex number, genus or type, and narrowed by generation |
| `fetchPokemonDetails(idOrName)` | One full `Pokemon` record, rejects on a miss |
| `fetchEvolutionChains()` | Every family that evolves |
| `fetchEvolutionChain(id)` | One chain, rejects on a miss |

Each record carries `id`, `name`, `generation`, `region`, `types`, `stats`,
`sprites` (official artwork plus front and back battle sprites), `abilities`,
`moves`, `flavor_text_entries`, and an `evolution_chain` reference.

`src/api/pokeApi.ts` derives the Mega Evolution roster from that same dataset:
every mega form whose base Pokémon is one of the 721 entries. Adding a
generation to the dex therefore adds its megas automatically. That comes to 84
forms across 77 Pokémon - 30 from X / Y, 18 from Omega Ruby / Alpha Sapphire,
and 36 from Legends: Z-A. Primal Groudon and Primal Kyogre are deliberately
absent: Primal Reversion is a separate mechanic, not a Mega Evolution.

Official artwork is loaded from the PokéAPI sprite repository on GitHub. If
those images cannot be reached, every artwork slot degrades to a type-tinted
monogram rather than a broken image, so the app stays usable offline.

## Layout

```
scripts/build-pokedex.mjs    PokéAPI -> src/api/pokedexData.ts
src/
  api/pokedexData.ts         generated dataset (do not edit by hand)
  api/localPokeApi.ts        hydration + async fetch layer
  api/pokeApi.ts             Mega Evolution roster, derived from the dex
  lib/pokemonTypes.ts        type colors, full 18x18 matchup chart, formatters
  hooks/useAsync.ts          loading/error state, stale-response guarding, debounce
  components/
    Landing.tsx              hero, floating showcase, capability grid
    Dashboard.tsx            shell + animated tab bar (layoutId)
    AllPokemonTab.tsx        alphabetical grid, search + generation filter
    EvolutionTab.tsx         evolution flow charts with drawn connectors
    TypeMatchupTab.tsx       interactive type matrix
    MegaEvolutionTab.tsx     mega roster, base -> mega stat comparison
    PokemonCard.tsx          dex card with type-derived glow
    PokemonDetailModal.tsx   glass detail modal, animated stat bars
    primitives.tsx           type pills, artwork, skeleton/empty/error states
```

## Notes

- The dex grid is sorted alphabetically and renders in pages of 48, so 721
  cards never mount at once. Evolution trees and type rosters page the same way.
- Every animation honours `prefers-reduced-motion`.
- The type matchup chart is computed from a complete attack table, so dual-type
  multipliers (1/4x, 4x, 0x) come out correct rather than being hardcoded.
- A fan project. Pokémon and all related names are trademarks of Nintendo,
  Creatures Inc. and GAME FREAK Inc.
