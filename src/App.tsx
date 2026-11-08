import { useEffect, useRef } from "react";
import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, m } from "motion/react";
import { useRoute } from "./useRoute.ts";
import { tabFor, type Route } from "./route.ts";
import { duration, easing } from "./motion.ts";
import { BottomTabBar } from "./components/BottomTabBar.tsx";
import { Chapter, Home, Learn, Level, Progress, Settings, chapterLabel } from "./screens/Placeholders.tsx";
import "./App.css";

function screenFor(r: Route) {
  switch (r.screen) {
    case "home": return <Home />;
    case "learn": return <Learn />;
    case "progress": return <Progress />;
    case "settings": return <Settings />;
    case "chapter": return <Chapter chapter={r.chapter} />;
    case "level": return <Level chapter={r.chapter} level={r.level} />;
  }
}

function titleFor(r: Route): string {
  const base = "Hyōshiki Dojo";
  switch (r.screen) {
    case "home": return base;
    case "chapter": return `${chapterLabel(r.chapter)} · ${base}`;
    case "level": return `${r.level} · ${chapterLabel(r.chapter)} · ${base}`;
    default: return `${r.screen[0]!.toUpperCase()}${r.screen.slice(1)} · ${base}`;
  }
}

export function App() {
  const { route, hash } = useRoute();
  const tab = tabFor(route);
  const first = useRef(true);

  useEffect(() => {
    document.title = titleFor(route);
    if (first.current) { first.current = false; return; }
    window.scrollTo(0, 0);
  }, [hash]); // route is derived from hash

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <div className="app" data-focused={tab === null ? "" : undefined}>
          <AnimatePresence mode="wait" initial={false}>
            <m.main
              key={hash}
              className="app-main"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: duration("--dur-page"), ease: easing("--ease-enter") } }}
              exit={{ opacity: 0, transition: { duration: duration("--dur-press"), ease: easing("--ease-exit") } }}
              onAnimationComplete={() => {
                if (!first.current) document.querySelector<HTMLElement>("[data-page-title]")?.focus({ preventScroll: true });
              }}
            >
              {screenFor(route)}
            </m.main>
          </AnimatePresence>
          {tab && <BottomTabBar active={tab} />}
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}
