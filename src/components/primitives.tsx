import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, RotateCw, SearchX } from "lucide-react";
import type { TypeName } from "../api/localPokeApi";
import { TYPE_COLORS, titleCase } from "../lib/pokemonTypes";

/* ------------------------------- type pill ------------------------------- */

export function TypePill({
  type,
  size = "md",
}: {
  type: TypeName;
  size?: "sm" | "md";
}) {
  const { base, soft } = TYPE_COLORS[type];
  return (
    <span
      className={
        size === "sm"
          ? "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
          : "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]"
      }
      style={{
        color: base,
        backgroundColor: soft,
        borderColor: `color-mix(in srgb, ${base} 42%, transparent)`,
      }}
    >
      {type}
    </span>
  );
}

/* ------------------------------- artwork -------------------------------- */

/**
 * Official artwork with a graceful degradation path: while the sprite loads we
 * show a shimmer, and if the asset cannot be reached at all (offline demo,
 * blocked CDN) we fall back to a type-tinted monogram rather than a broken img.
 */
export function PokemonArt({
  src,
  name,
  types,
  className = "",
  eager = false,
}: {
  src: string;
  name: string;
  types: TypeName[];
  className?: string;
  eager?: boolean;
}) {
  const [status, setStatus] = useState<"loading" | "ready" | "failed">(
    "loading",
  );
  const primary = TYPE_COLORS[types[0] ?? "normal"].base;
  const secondary = TYPE_COLORS[types[1] ?? types[0] ?? "normal"].base;

  if (status === "failed") {
    return (
      <div
        className={`grid place-items-center rounded-full ${className}`}
        style={{
          background: `radial-gradient(circle at 32% 28%, color-mix(in srgb, ${primary} 40%, transparent), transparent 68%), radial-gradient(circle at 70% 76%, color-mix(in srgb, ${secondary} 32%, transparent), transparent 66%)`,
        }}
        role="img"
        aria-label={`${titleCase(name)} artwork unavailable`}
      >
        <span
          className="font-mono text-3xl font-bold"
          style={{ color: primary }}
        >
          {name.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {status === "loading" && (
        <div className="skeleton absolute inset-2 rounded-full" />
      )}
      <img
        src={src}
        alt={`${titleCase(name)} official artwork`}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setStatus("ready")}
        onError={() => setStatus("failed")}
        className="relative h-full w-full object-contain"
        style={{
          opacity: status === "ready" ? 1 : 0,
          transition: "opacity 260ms ease",
          filter: `drop-shadow(0 12px 26px color-mix(in srgb, ${primary} 34%, transparent))`,
        }}
      />
    </div>
  );
}

/* ------------------------------- states --------------------------------- */

export function CardSkeleton() {
  return (
    <div className="rounded-[16px] border border-line bg-surface p-5">
      <div className="skeleton mx-auto h-28 w-28 rounded-full" />
      <div className="skeleton mt-5 h-3 w-14 rounded-full" />
      <div className="skeleton mt-3 h-5 w-32 rounded-full" />
      <div className="mt-4 flex gap-2">
        <div className="skeleton h-6 w-16 rounded-full" />
        <div className="skeleton h-6 w-14 rounded-full" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-[16px] border border-line bg-surface px-6 py-14 text-center">
      <AlertTriangle
        className="mx-auto text-[#ff7a45]"
        size={30}
        strokeWidth={1.5}
      />
      <p className="mt-4 text-base font-semibold text-ink">
        The Pokedex could not read that record
      </p>
      <p className="mx-auto mt-2 max-w-[46ch] text-sm text-ink-dim">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-5 py-2 text-sm font-semibold text-accent transition hover:bg-accent/20 active:scale-[0.98]"
        >
          <RotateCw size={15} strokeWidth={2} />
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ query }: { query: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[16px] border border-dashed border-line bg-surface/60 px-6 py-16 text-center"
    >
      <SearchX className="mx-auto text-ink-faint" size={30} strokeWidth={1.5} />
      <p className="mt-4 text-base font-semibold text-ink">
        No Kalos entry matches "{query}"
      </p>
      <p className="mx-auto mt-2 max-w-[44ch] text-sm text-ink-dim">
        Search by name, National Dex number, or a type such as fairy or steel.
      </p>
    </motion.div>
  );
}
