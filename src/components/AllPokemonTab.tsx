import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownAZ, Search, X } from "lucide-react";
import {
  GENERATIONS,
  searchLocalPokemon,
  type Pokemon,
  type PokemonListResponse,
} from "../api/localPokeApi";
import { useAsync, useDebounced } from "../hooks/useAsync";
import { PokemonCard } from "./PokemonCard";
import { EmptyState, ErrorState, GridSkeleton } from "./primitives";

/**
 * Cards render in pages rather than all at once: the dex holds 721 entries and
 * mounting every one of them stalls the tab transition on a mid-range laptop.
 */
const PAGE_SIZE = 48;

const FILTERS = [
  { generation: 0, label: "All", region: "Generations 1-6" },
  ...GENERATIONS.map((g) => ({
    generation: g.generation,
    label: `Gen ${g.generation}`,
    region: g.region,
  })),
];

export function AllPokemonTab({
  onSelect,
}: {
  onSelect: (p: Pokemon) => void;
}) {
  const [query, setQuery] = useState("");
  const [generation, setGeneration] = useState(0);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const debounced = useDebounced(query);

  const { data, loading, error, reload } = useAsync<PokemonListResponse>(
    () => searchLocalPokemon({ search: debounced, generation }),
    [debounced, generation],
  );

  const results = useMemo(() => data?.results ?? [], [data]);

  // A new result set always starts at the top of the list.
  useEffect(() => setVisible(PAGE_SIZE), [debounced, generation]);

  const sentinel = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = sentinel.current;
    if (!node || visible >= results.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible((n) => Math.min(n + PAGE_SIZE, results.length));
        }
      },
      { rootMargin: "600px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible, results.length]);

  const shown = results.slice(0, visible);
  const region = FILTERS.find((f) => f.generation === generation)?.region ?? "";

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-ink">
            National dex records
          </h2>
          <p className="mt-1 text-sm text-ink-dim">
            {loading
              ? "Reading the dex index."
              : `${results.length} ${results.length === 1 ? "entry" : "entries"} on file, A to Z.`}
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <label htmlFor="dex-search" className="sr-only">
            Search the dex
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

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 pr-1 text-[11px] uppercase tracking-[0.14em] text-ink-faint">
          <ArrowDownAZ size={13} strokeWidth={1.75} aria-hidden="true" />
          alphabetical
        </span>
        {FILTERS.map((filter) => {
          const active = filter.generation === generation;
          return (
            <button
              key={filter.generation}
              onClick={() => setGeneration(filter.generation)}
              aria-pressed={active}
              title={filter.region}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                active
                  ? "border-accent/45 bg-accent/12 text-accent"
                  : "border-line bg-surface text-ink-dim hover:text-ink"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
        <span className="text-xs text-ink-faint">{region}</span>
      </div>

      <div className="mt-7">
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading ? (
          <GridSkeleton />
        ) : results.length === 0 ? (
          <EmptyState query={debounced} />
        ) : (
          <>
            <motion.div
              layout
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              <AnimatePresence mode="popLayout">
                {shown.map((p, i) => (
                  <PokemonCard
                    key={p.id}
                    pokemon={p}
                    // Only the first page staggers; later pages appear as the
                    // reader scrolls and should not re-animate down the grid.
                    index={i % PAGE_SIZE}
                    onSelect={onSelect}
                  />
                ))}
              </AnimatePresence>
            </motion.div>

            {visible < results.length && (
              <div ref={sentinel} className="mt-8 text-center">
                <button
                  onClick={() =>
                    setVisible((n) => Math.min(n + PAGE_SIZE, results.length))
                  }
                  className="rounded-full border border-line bg-surface px-5 py-2 text-sm text-ink-dim transition hover:text-ink"
                >
                  Show more ({results.length - visible} left)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
