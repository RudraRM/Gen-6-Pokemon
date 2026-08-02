# Kalos Pokédex

An interactive Generation 6 Pokédex: a dark-mode landing page plus a dashboard
with animated tab navigation, evolution flow charts, an interactive type
matchup matrix, and every Generation 6 Mega Evolution pulled live from PokéAPI.

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

The Kalos dex lives in `src/api/localPokeApi.ts`. Nothing there calls a live API
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

The Mega Evolution tab is the one exception: `src/api/pokeApi.ts` calls the
public PokéAPI at `https://pokeapi.co/api/v2` for all 48 Generation 6 mega
forms (30 from X / Y, 18 from Omega Ruby / Alpha Sapphire) and their pre-mega
forms, so typings, abilities and stat spreads are never transcribed by hand.
Requests go out in waves of eight, responses are deduplicated per URL and
cached for the page's lifetime, and a failed run surfaces a retry.

Official artwork is loaded from the PokéAPI sprite repository on GitHub. If
those images cannot be reached, every artwork slot degrades to a type-tinted
monogram rather than a broken image, so the app stays usable offline.

## Layout

```
src/
  api/localPokeApi.ts        dataset + async fetch layer
  api/pokeApi.ts             live PokéAPI client for the 48 mega forms
  lib/pokemonTypes.ts        type colors, full 18x18 matchup chart, formatters
  hooks/useAsync.ts          loading/error state, stale-response guarding, debounce
  components/
    Landing.tsx              hero, floating showcase, capability grid
    Dashboard.tsx            shell + animated tab bar (layoutId)
    AllPokemonTab.tsx        searchable responsive grid
    EvolutionTab.tsx         evolution flow charts with drawn connectors
    TypeMatchupTab.tsx       interactive type matrix
    MegaEvolutionTab.tsx     live mega roster, base -> mega stat comparison
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
