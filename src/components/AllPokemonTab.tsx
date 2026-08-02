import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import {
  searchLocalPokemon,
  type Pokemon,
  type PokemonListResponse,
} from "../api/localPokeApi";
import { useAsync, useDebounced } from "../hooks/useAsync";
import { PokemonCard } from "./PokemonCard";
import { EmptyState, ErrorState, GridSkeleton } from "./primitives";

export function AllPokemonTab({
  onSelect,
}: {
  onSelect: (p: Pokemon) => void;
}) {
  const [query, setQuery] = useState("");
  const debounced = useDebounced(query);

  const { data, loading, error, reload } = useAsync<PokemonListResponse>(
    () => searchLocalPokemon(debounced),
    [debounced],
  );

  const results = useMemo(() => data?.results ?? [], [data]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-ink">
            Kalos records
          </h2>
          <p className="mt-1 text-sm text-ink-dim">
            {loading
              ? "Reading the local dex index."
              : `${results.length} ${results.length === 1 ? "entry" : "entries"} on file.`}
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <label htmlFor="dex-search" className="sr-only">
            Search the Kalos dex
          </label>
          <Search
            size={16}
            strokeWidth={1.75}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint"
            aria-hidden="true"
          />
          <input
            id="dex-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, dex number, or type"
            className="w-full rounded-full border border-line bg-surface py-2.5 pl-11 pr-10 text-sm text-ink placeholder:text-ink-faint focus:border-accent/60 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-ink-faint transition hover:text-ink"
            >
              <X size={14} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      <div className="mt-7">
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading ? (
          <GridSkeleton />
        ) : results.length === 0 ? (
          <EmptyState query={debounced} />
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            <AnimatePresence mode="popLayout">
              {results.map((p, i) => (
                <PokemonCard
                  key={p.id}
                  pokemon={p}
                  index={i}
                  onSelect={onSelect}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
