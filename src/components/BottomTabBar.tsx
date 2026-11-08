import { motion } from "motion/react";
import { BookOpen, ChartColumn, House, type LucideIcon } from "lucide-react";
import type { Tab } from "../route.ts";
import { duration, easing } from "../motion.ts";
import "./BottomTabBar.css";

const TABS: { id: Tab; label: string; href: string; Icon: LucideIcon }[] = [
  { id: "home", label: "Home", href: "#", Icon: House },
  { id: "learn", label: "Learn", href: "#learn", Icon: BookOpen },
  { id: "progress", label: "Progress", href: "#progress", Icon: ChartColumn },
];

export function BottomTabBar({ active }: { active: Tab }) {
  return (
    <nav className="tabbar" aria-label="Main">
      <ul>
        {TABS.map(({ id, label, href, Icon }) => {
          const on = id === active;
          return (
            <li key={id}>
              <a href={href} className="tabbar-link" data-tab={id} aria-current={on ? "page" : undefined}>
                {on && (
                  <motion.span
                    layoutId="tabbar-indicator"
                    className="tabbar-indicator"
                    transition={{ duration: duration("--dur-state"), ease: easing("--ease-move") }}
                  />
                )}
                <Icon className="tabbar-icon" aria-hidden="true" strokeWidth={on ? 2.25 : 1.75} />
                <span className="tabbar-label">{label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
