import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import "./EmptyState.css";

export function EmptyState({ Icon, title, children }: { Icon: LucideIcon; title: string; children?: ReactNode }) {
  return (
    <section className="empty-state">
      <Icon className="empty-state-icon" aria-hidden="true" />
      <h2>{title}</h2>
      {children && <div className="empty-state-body">{children}</div>}
    </section>
  );
}
