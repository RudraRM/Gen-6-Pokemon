import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Ruler, ShieldCheck, ShieldOff, Swords, Weight, X, Zap } from "lucide-react";
import type { Pokemon } from "../api/localPokeApi";
import {
  STAT_LABELS,
  TYPE_COLORS,
  defensiveProfile,
  dexNumber,
  formatMultiplier,
  titleCase,
} from "../lib/pokemonTypes";
import { PokemonArt, TypePill } from "./primitives";

/** Highest single base stat in Gen 6, used to scale the bars honestly. */
const STAT_CEILING = 180;

function StatBar({
  label,
  value,
  color,
  delay,
}: {
  label: string;
  value: number;
  color: string;
  delay: number;
}) {
  const reduce = useReducedMotion();
  return (
    <div className="grid grid-cols-[74px_1fr_34px] items-center gap-3">
      <span className="text-xs font-medium text-ink-dim">{label}</span>
      <span className="h-2 overflow-hidden rounded-full bg-surface-2">
        <motion.span
          className="block h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, color-mix(in srgb, ${color} 55%, transparent), ${color})`,
          }}
          initial={reduce ? false : { width: 0 }}
          animate={{ width: `${Math.min(100, (value / STAT_CEILING) * 100)}%` }}
          transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
        />
      </span>
      <span className="text-right font-mono text-xs text-ink">{value}</span>
    </div>
  );
}

export function PokemonDetailModal({
  pokemon,
  onClose,
}: {
  pokemon: Pokemon | null;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!pokemon) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [pokemon, onClose]);

  return (
    <AnimatePresence>
      {pokemon && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.button
            aria-label="Close detail view"
            tabIndex={-1}
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-void/80 backdrop-blur-sm"
          />
          <ModalBody
            pokemon={pokemon}
            onClose={onClose}
            closeRef={closeRef}
            reduce={!!reduce}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ModalBody({
  pokemon,
  onClose,
  closeRef,
  reduce,
}: {
  pokemon: Pokemon;
  onClose: () => void;
  closeRef: React.RefObject<HTMLButtonElement>;
  reduce: boolean;
}) {
  const typeNames = pokemon.types.map((t) => t.type.name);
  const primary = TYPE_COLORS[typeNames[0]].base;
  const profile = defensiveProfile(typeNames);
  const total = pokemon.stats.reduce((sum, s) => sum + s.base_stat, 0);
  const flavor = pokemon.flavor_text_entries[0]?.flavor_text ?? "";

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-title"
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className="glass relative max-h-[92dvh] w-full max-w-4xl overflow-y-auto rounded-t-[16px] sm:rounded-[16px]"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-56"
        style={{
          background: `radial-gradient(80% 100% at 28% 0%, color-mix(in srgb, ${primary} 26%, transparent), transparent 70%)`,
        }}
      />

      <button
        ref={closeRef}
        onClick={onClose}
        className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-ink-dim transition hover:text-ink active:scale-95"
        aria-label="Close"
      >
        <X size={17} strokeWidth={2} />
      </button>

      {/* Name leads on every breakpoint, so the header spans both columns. */}
      <header className="relative px-6 pt-7 sm:px-9 sm:pt-9">
        <span className="font-mono text-xs tracking-[0.16em] text-ink-faint">
          {dexNumber(pokemon.id)}
        </span>
        <h2
          id="detail-title"
          className="mt-1 pr-12 text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
        >
          {titleCase(pokemon.name)}
        </h2>
        <p className="mt-1 text-sm text-ink-dim">{pokemon.genus}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {typeNames.map((t) => (
            <TypePill key={t} type={t} />
          ))}
        </div>
      </header>

      <div className="relative grid gap-8 p-6 sm:p-9 lg:grid-cols-[300px_1fr]">
        {/* identity column */}
        <div>
          <div
            className="mx-auto grid aspect-square w-full max-w-[280px] place-items-center rounded-[16px] border border-white/8"
            style={{
              background: `radial-gradient(circle at 50% 42%, color-mix(in srgb, ${primary} 20%, transparent), transparent 68%)`,
            }}
          >
            <PokemonArt
              src={pokemon.sprites.other["official-artwork"].front_default}
              name={pokemon.name}
              types={typeNames}
              className="h-[74%] w-[74%]"
              eager
            />
          </div>

          <BattleSprites sprites={pokemon.sprites} />

          <dl className="mt-5 grid grid-cols-2 gap-3">
            <Metric
              icon={<Ruler size={14} strokeWidth={1.75} />}
              label="Height"
              value={`${(pokemon.height / 10).toFixed(1)} m`}
            />
            <Metric
              icon={<Weight size={14} strokeWidth={1.75} />}
              label="Weight"
              value={`${(pokemon.weight / 10).toFixed(1)} kg`}
            />
            <Metric
              icon={<Zap size={14} strokeWidth={1.75} />}
              label="Base exp"
              value={String(pokemon.base_experience)}
            />
            <Metric
              icon={<Swords size={14} strokeWidth={1.75} />}
              label="Stat total"
              value={String(total)}
            />
          </dl>
        </div>

        {/* detail column */}
        <div>
          <p className="max-w-[62ch] border-l-2 pl-4 text-sm leading-relaxed text-ink-dim"
            style={{ borderColor: `color-mix(in srgb, ${primary} 50%, transparent)` }}
          >
            {flavor}
          </p>

          <section className="mt-8">
            <h3 className="text-sm font-semibold text-ink">Base stats</h3>
            <div className="mt-4 grid gap-2.5">
              {pokemon.stats.map((s, i) => (
                <StatBar
                  key={s.stat.name}
                  label={STAT_LABELS[s.stat.name] ?? s.stat.name}
                  value={s.base_stat}
                  color={primary}
                  delay={0.1 + i * 0.06}
                />
              ))}
            </div>
          </section>

          <section className="mt-8 grid gap-5 sm:grid-cols-2">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <ShieldOff size={15} strokeWidth={1.75} className="text-[#ff7a45]" />
                Weak to
              </h3>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {profile.weaknesses.length === 0 && (
                  <span className="text-xs text-ink-faint">Nothing. Rare air.</span>
                )}
                {profile.weaknesses.map((w) => (
                  <MatchupChip
                    key={w.type}
                    type={w.type}
                    label={formatMultiplier(w.multiplier)}
                  />
                ))}
              </div>
            </div>
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <ShieldCheck size={15} strokeWidth={1.75} className="text-accent" />
                Resists
              </h3>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {profile.resistances.map((r) => (
                  <MatchupChip
                    key={r.type}
                    type={r.type}
                    label={formatMultiplier(r.multiplier)}
                  />
                ))}
                {profile.immunities.map((t) => (
                  <MatchupChip key={t} type={t} label="0x" />
                ))}
              </div>
            </div>
          </section>

          <section className="mt-8">
            <h3 className="text-sm font-semibold text-ink">Move pool</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {pokemon.moves.map((m) => (
                <div
                  key={m.move.name}
                  className="rounded-[16px] border border-line bg-surface/70 px-3.5 py-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm leading-snug text-ink">
                      {titleCase(m.move.name)}
                    </p>
                    <TypePill type={m.type} size="sm" />
                  </div>
                  <p className="mt-1 flex items-center gap-2 text-[11px] text-ink-faint">
                    <span className="capitalize">{m.damage_class}</span>
                    <span aria-hidden="true">/</span>
                    <span className="font-mono">
                      {m.power ? `${m.power} power` : "no damage"}
                    </span>
                    {m.accuracy && (
                      <>
                        <span aria-hidden="true">/</span>
                        <span className="font-mono">{m.accuracy}% acc</span>
                      </>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h3 className="text-sm font-semibold text-ink">Abilities</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {pokemon.abilities.map((a) => (
                <span
                  key={a.ability.name}
                  className="rounded-full border border-line bg-surface/70 px-3 py-1 text-xs text-ink-dim"
                >
                  {titleCase(a.ability.name)}
                  {a.is_hidden && (
                    <span className="ml-1.5 text-accent">hidden</span>
                  )}
                </span>
              ))}
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
}

/** Game sprites, dropped entirely if neither asset can be reached. */
function BattleSprites({ sprites }: { sprites: Pokemon["sprites"] }) {
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const shots = [
    { key: "front", src: sprites.front_default },
    { key: "back", src: sprites.back_default },
  ].filter((s) => !failed[s.key]);

  if (shots.length === 0) return null;

  return (
    <div className="mt-5 flex items-center gap-3">
      {shots.map((s) => (
        <img
          key={s.key}
          src={s.src}
          alt=""
          aria-hidden="true"
          className="h-14 w-14 [image-rendering:pixelated]"
          onError={() => setFailed((f) => ({ ...f, [s.key]: true }))}
        />
      ))}
      <span className="ml-auto font-mono text-xs text-ink-faint">
        in-battle sprites
      </span>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[16px] border border-line bg-surface/70 px-3.5 py-3">
      <dt className="flex items-center gap-1.5 text-[11px] text-ink-faint">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 font-mono text-sm text-ink">{value}</dd>
    </div>
  );
}

function MatchupChip({
  type,
  label,
}: {
  type: Parameters<typeof TypePill>[0]["type"];
  label: string;
}) {
  const { base, soft } = TYPE_COLORS[type];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize"
      style={{
        color: base,
        backgroundColor: soft,
        borderColor: `color-mix(in srgb, ${base} 38%, transparent)`,
      }}
    >
      {type}
      <span className="font-mono text-ink-dim">{label}</span>
    </span>
  );
}
