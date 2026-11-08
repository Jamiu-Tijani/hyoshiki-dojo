import { BookOpen, ChartColumn, House, type LucideIcon } from "lucide-react";
import type { Tab } from "../route.ts";
import "./BottomTabBar.css";

const TABS: { id: Tab; label: string; href: string; Icon: LucideIcon }[] = [
  { id: "home", label: "Home", href: "#", Icon: House },
  { id: "learn", label: "Learn", href: "#learn", Icon: BookOpen },
  { id: "progress", label: "Progress", href: "#progress", Icon: ChartColumn },
];

/* The active-tab highlight is a CSS transition (BottomTabBar.css), so the app only needs
   Motion's domAnimation features, not layout animations. */
export function BottomTabBar({ active }: { active: Tab }) {
  return (
    <nav className="tabbar" aria-label="Main">
      <ul>
        {TABS.map(({ id, label, href, Icon }) => (
          <li key={id}>
            <a href={href} className="tabbar-link" data-tab={id} aria-current={id === active ? "page" : undefined}>
              <Icon className="tabbar-icon" aria-hidden="true" />
              <span className="tabbar-label">{label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
