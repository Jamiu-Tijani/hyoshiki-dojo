import type { ReactNode } from "react";
import "./PageHeader.css";

/** Screen title. The h1 takes focus after navigation so screen readers announce the new screen. */
export function PageHeader({ title, jp, leading, trailing }: { title: string; jp?: string; leading?: ReactNode; trailing?: ReactNode }) {
  return (
    <header className="page-header">
      {leading}
      <div className="page-header-titles">
        <h1 tabIndex={-1} data-page-title>{title}</h1>
        {jp && <p className="page-header-jp" lang="ja">{jp}</p>}
      </div>
      {trailing}
    </header>
  );
}
