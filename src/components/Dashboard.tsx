import { useCallback, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, GitBranch, Grid2x2, Shield, Sparkles } from "lucide-react";
import type { Pokemon } from "../api/localPokeApi";
import { AllPokemonTab } from "./AllPokemonTab";
import { EvolutionTab } from "./EvolutionTab";
import { MegaEvolutionTab } from "./MegaEvolutionTab";
import { PokemonDetailModal } from "./PokemonDetailModal";
import { TypeMatchupTab } from "./TypeMatchupTab";

const TABS = [
  { id: "all", label: "All Pokemon", icon: Grid2x2 },
  { id: "evolution", label: "Evolution Trees", icon: GitBranch },
  { id: "types", label: "Type Matchup Chart", icon: Shield },
  { id: "mega", label: "Mega Evolution", icon: Sparkles },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function Dashboard({ onExit }: { onExit: () => void }) {
  const [tab, setTab] = useState<TabId>("all");
  const [selected, setSelected] = useState<Pokemon | null>(null);
  const reduce = useReducedMotion();

  const handleSelect = useCallback((p: Pokemon) => setSelected(p), []);
  const handleClose = useCallback(() => setSelected(null), []);

  return (
    <div className="relative min-h-[100dvh]">
      <div
        aria-hidden="true"
        className="lab-grid pointer-events-none fixed inset-0 opacity-40"
      />

      <header className="sticky top-0 z-30 border-b border-line bg-void/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-[1400px] items-center gap-4 px-4 sm:px-8">
          <button
            onClick={onExit}
            aria-label="Back to the home page"
            className="flex items-center gap-2 text-sm text-ink-dim transition hover:text-ink active:translate-y-px"
          >
            <ArrowLeft size={16} strokeWidth={1.75} />
            <span className="hidden sm:inline">Home</span>
          </button>

          <span className="h-6 w-px bg-line" aria-hidden="true" />

          <p className="text-sm font-semibold tracking-tight text-ink">
            Kalos Pokedex
          </p>

          <nav
            className="ml-auto flex items-center gap-1 overflow-x-auto"
            aria-label="Dashboard sections"
          >
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = id === tab;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  // The label is icon-only below md, so it needs a name here.
                  aria-label={label}
                  aria-current={active ? "page" : undefined}
                  className={`relative shrink-0 rounded-full px-3.5 py-2 text-sm transition-colors sm:px-4 ${
                    active ? "text-ink" : "text-ink-dim hover:text-ink"
                  }`}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon size={15} strokeWidth={1.75} />
                    <span className="hidden md:inline">{label}</span>
                  </span>
                  {active && (
                    <motion.span
                      layoutId="tab-pill"
                      className="absolute inset-0 rounded-full border border-accent/35 bg-accent/12"
                      transition={
                        reduce
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 420, damping: 34 }
                      }
                    />
                  )}
                  {active && (
                    <motion.span
                      layoutId="tab-underline"
                      className="absolute -bottom-[13px] left-3 right-3 h-[2px] rounded-full bg-accent"
                      transition={
                        reduce
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 420, damping: 34 }
                      }
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="relative mx-auto max-w-[1400px] px-4 py-9 sm:px-8 sm:py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -10 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            {tab === "all" && <AllPokemonTab onSelect={handleSelect} />}
            {tab === "evolution" && <EvolutionTab onSelect={handleSelect} />}
            {tab === "types" && <TypeMatchupTab onSelect={handleSelect} />}
            {tab === "mega" && <MegaEvolutionTab onSelect={handleSelect} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <PokemonDetailModal pokemon={selected} onClose={handleClose} />
    </div>
  );
}
