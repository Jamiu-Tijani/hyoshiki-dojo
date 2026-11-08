/* Phase 1 placeholders: every route renders, nothing is invented. Screens are built in Phase 3,
   mechanics in Phase 4; until the Phase 5 cut-over the old game at ../ is the live version. */
import { ArrowLeft, BookOpen, ChartColumn, House, Settings as SettingsIcon, X } from "lucide-react";
import type { ChapterId } from "../route.ts";
import { PageHeader } from "../components/PageHeader.tsx";
import { IconLink } from "../components/IconButton.tsx";
import { EmptyState } from "../components/EmptyState.tsx";

const CHAPTER_LABEL: Record<ChapterId, string> = { ch1: "Chapter 1", ch2: "Chapter 2", bonus: "Bonus" };
export const chapterLabel = (c: ChapterId) => CHAPTER_LABEL[c];

const OldGame = ({ hash = "" }: { hash?: string }) => <p><a href={`../${hash}`}>Open the current game</a></p>;

export function Home() {
  return (
    <>
      <PageHeader title="Hyōshiki Dojo" jp="標識道場" trailing={<IconLink href="#settings" label="Settings" Icon={SettingsIcon} />} />
      <EmptyState Icon={House} title="Home is built in Phase 3">
        <p>This is the new app shell. The current game is still the live version.</p>
        <OldGame />
      </EmptyState>
    </>
  );
}

export function Learn() {
  return (
    <>
      <PageHeader title="Learn" />
      <EmptyState Icon={BookOpen} title="Chapter list is built in Phase 3">
        <nav aria-label="Chapters">
          {(Object.keys(CHAPTER_LABEL) as ChapterId[]).map(c => <p key={c}><a href={`#${c}`}>{chapterLabel(c)}</a></p>)}
        </nav>
      </EmptyState>
    </>
  );
}

export function Chapter({ chapter }: { chapter: ChapterId }) {
  return (
    <>
      <PageHeader title={chapterLabel(chapter)} leading={<IconLink href="#learn" label="Back to Learn" Icon={ArrowLeft} />} />
      <EmptyState Icon={BookOpen} title="Chapter screen is built in Phase 3">
        <OldGame hash={`#${chapter}`} />
      </EmptyState>
    </>
  );
}

export function Level({ chapter, level }: { chapter: ChapterId; level: string }) {
  return (
    <>
      <PageHeader title={level} leading={<IconLink href={`#${chapter}`} label={`Close, back to ${chapterLabel(chapter)}`} Icon={X} />} />
      <EmptyState Icon={BookOpen} title="Questions are ported in Phase 4">
        <OldGame hash={`#${chapter}`} />
      </EmptyState>
    </>
  );
}

export function Progress() {
  return (
    <>
      <PageHeader title="Progress" />
      <EmptyState Icon={ChartColumn} title="Progress is built in Phase 3">
        <p>It will read the same saved history as the current game.</p>
      </EmptyState>
    </>
  );
}

export function Settings() {
  return (
    <>
      <PageHeader title="Settings" leading={<IconLink href="#" label="Back to Home" Icon={ArrowLeft} />} />
      <EmptyState Icon={SettingsIcon} title="Settings is built in Phase 3" />
    </>
  );
}
