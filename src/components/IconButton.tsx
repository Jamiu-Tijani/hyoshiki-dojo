import type { LucideIcon } from "lucide-react";
import "./IconButton.css";

/** 44px icon control rendered as a link (all navigation is hash links). `label` is the accessible name. */
export function IconLink({ href, label, Icon }: { href: string; label: string; Icon: LucideIcon }) {
  return (
    <a className="icon-button" href={href} aria-label={label}>
      <Icon aria-hidden="true" />
    </a>
  );
}
