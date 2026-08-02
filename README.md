# Kalos Pokédex

An interactive Generation 6 Pokédex: a dark-mode landing page plus a dashboard
with animated tab navigation, evolution flow charts, and an interactive type
matchup matrix.

Built with React 18, TypeScript, Tailwind CSS v4, Framer Motion, and Lucide.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production bundle
npm run preview  # serve the production build
```

No API keys, no backend, no configuration. It works out of the box.

## Data

All Pokémon data lives in `src/api/localPokeApi.ts`. Nothing calls a live API
server. The exported functions mirror the shape of the public PokéAPI response
format and resolve through a simulated 300-500ms delay so loading and error
states are exercised for real:

| Function | Returns |
| --- | --- |
| `fetchGen6Pokemon()` | `{ count, results }` for the full Kalos list |
| `searchLocalPokemon(query)` | Same shape, filtered by name, dex number, or type |
| `fetchPokemonDetails(idOrName)` | One full `Pokemon` record, rejects on a miss |
| `fetchEvolutionChains()` | Every locally held evolution chain |
| `fetchEvolutionChain(id)` | One chain, rejects on a miss |

Each record carries `id`, `name`, `types`, `stats`, `sprites` (official artwork
plus front and back battle sprites), `abilities`, `moves`,
`flavor_text_entries`, and an `evolution_chain` reference.

Official artwork is loaded from the PokéAPI sprite repository on GitHub. If
those images cannot be reached, every artwork slot degrades to a type-tinted
monogram rather than a broken image, so the app stays usable offline.

## Layout

```
src/
  api/localPokeApi.ts        dataset + async fetch layer
  lib/pokemonTypes.ts        type colors, full 18x18 matchup chart, formatters
  hooks/useAsync.ts          loading/error state, stale-response guarding, debounce
  components/
    Landing.tsx              hero, floating showcase, capability grid
    Dashboard.tsx            shell + animated tab bar (layoutId)
    AllPokemonTab.tsx        searchable responsive grid
    EvolutionTab.tsx         evolution flow charts with drawn connectors
    TypeMatchupTab.tsx       interactive type matrix
    PokemonCard.tsx          dex card with type-derived glow
    PokemonDetailModal.tsx   glass detail modal, animated stat bars
    primitives.tsx           type pills, artwork, skeleton/empty/error states
```

## Notes

- Every animation honours `prefers-reduced-motion`.
- The type matchup chart is computed from a complete attack table, so dual-type
  multipliers (1/4x, 4x, 0x) come out correct rather than being hardcoded.
- A fan project. Pokémon and all related names are trademarks of Nintendo,
  Creatures Inc. and GAME FREAK Inc.
