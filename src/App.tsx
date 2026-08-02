import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Dashboard } from "./components/Dashboard";
import { Landing } from "./components/Landing";

type View = "landing" | "dashboard";

export default function App() {
  const [view, setView] = useState<View>("landing");
  const reduce = useReducedMotion();

  // Each view starts at its own top rather than inheriting the other's scroll.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [view]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={view}
        initial={reduce ? false : { opacity: 0, y: view === "dashboard" ? 24 : -16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduce ? undefined : { opacity: 0, y: view === "dashboard" ? -16 : 24 }}
        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      >
        {view === "landing" ? (
          <Landing onLaunch={() => setView("dashboard")} />
        ) : (
          <Dashboard onExit={() => setView("landing")} />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
