import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { Assignment, AssignmentMode, Project, SkillCategory } from '@/types';
import { EngineError } from '@/types';
import { ALL_PROJECTS, SEED_MEMBERS } from '@/data/seed';
import { autoAssign, clampRate, MIN_RATE, validateAssignments } from '@/lib/assignmentEngine';
import { memberLoad } from '@/lib/derive';
import {
  addProject as addProjectToGame,
  createGame,
  startTraining,
  stepDay,
  type GameState,
} from '@/lib/gameEngine';
import { MAX_SKILL_LEVEL, type GameSpeed } from '@/lib/gameConfig';
import { DEFAULT_LANG, type Lang } from '@/data/i18n';

export interface NecroCrewState extends GameState {
  mode: AssignmentMode;
  selectedProjectId: string;
  error: string | null;
  /** Incremented on every summon so the field can replay the summon effect. */
  summonCount: number;
  muted: boolean;
  playing: boolean;
  speed: GameSpeed;
  /** Whether the end-of-campaign summary dialog is open. */
  resultOpen: boolean;
  /** Display language. The campaign state does not depend on it. */
  lang: Lang;
  setLang: (lang: Lang) => void;

  setMode: (mode: AssignmentMode) => void;
  selectProject: (projectId: string) => void;
  summon: (projectId: string) => void;
  setRate: (projectId: string, memberId: string, rate: number) => void;
  removeAssignment: (projectId: string, memberId: string) => void;
  /** Adds one creator to a quest by hand (click or drag). Takes the skills they qualify for and the free time they have. */
  addMember: (projectId: string, memberId: string) => void;
  train: (memberId: string, skill: SkillCategory) => void;
  /** Demo editing: sets one skill level directly (0 to 5), without cost or training time. */
  setSkillLevel: (memberId: string, skill: SkillCategory, level: number) => void;
  addProject: (project: Project) => void;
  toggleMute: () => void;
  setPlaying: (playing: boolean) => void;
  setSpeed: (speed: GameSpeed) => void;
  advanceDay: () => void;
  resetGame: () => void;
  setResultOpen: (open: boolean) => void;
  /** Replaces the whole game with a save loaded from storage (called once, after the page mounts). */
  loadSave: (save: GameState & Partial<SavedExtras>) => void;
}

/** Bumped whenever the shape of GameState changes in a way old saves cannot satisfy; mismatches are discarded. */
export const SAVE_VERSION = 1;
export const SAVE_STORAGE_KEY = 'necrocrew.save';

/** Saved fields beyond GameState: everything the player would expect to still be true after a reload. */
export interface SavedExtras {
  mode: AssignmentMode;
  selectedProjectId: string;
  speed: GameSpeed;
  muted: boolean;
}

export interface SaveFile {
  version: number;
  game: GameState & Partial<SavedExtras>;
}

function pickGame(s: GameState): GameState {
  return {
    day: s.day,
    funds: s.funds,
    members: s.members,
    projects: s.projects,
    assignments: s.assignments,
    runs: s.runs,
    training: s.training,
    outcome: s.outcome,
    lostReason: s.lostReason,
    history: s.history,
    seed: s.seed,
    combo: s.combo,
    lastBanishDay: s.lastBanishDay,
    moonDaysLeft: s.moonDaysLeft,
    contribution: s.contribution,
    milestones: s.milestones,
  };
}

function errorMessage(e: unknown): string {
  return e instanceof EngineError ? e.message : 'Unexpected error';
}

function otherAssignments(all: Record<string, Assignment[]>, projectId: string): Assignment[] {
  return Object.entries(all)
    .filter(([id]) => id !== projectId)
    .flatMap(([, list]) => list);
}

/** Replaces one quest's squad after checking the 10-100% range and each member's capacity. */
function withSquad(s: NecroCrewState, projectId: string, list: Assignment[]): Partial<NecroCrewState> {
  try {
    validateAssignments(s.members, list, otherAssignments(s.assignments, projectId));
    return { assignments: { ...s.assignments, [projectId]: list }, error: null };
  } catch (e) {
    return { error: errorMessage(e) };
  }
}

/** The allocation slider moves in steps of 5%. */
const RATE_STEP = 5;
const initial = (seed?: number): GameState => createGame(SEED_MEMBERS, ALL_PROJECTS, seed);
const randomSeed = (): number => Math.floor(Math.random() * 0x7fffffff);

export const useNecroCrew = create<NecroCrewState>()((set) => ({
  ...initial(),
  mode: 'Speedrun',
  selectedProjectId: ALL_PROJECTS[0].id,
  error: null,
  summonCount: 0,
  muted: false,
  playing: false,
  speed: 1,
  resultOpen: false,
  lang: DEFAULT_LANG,
  setLang: (lang) => set({ lang }),

  setMode: (mode) => set({ mode }),
  selectProject: (selectedProjectId) => set({ selectedProjectId, error: null }),

  summon: (projectId) =>
    set((s) => {
      const project = s.projects.find((p) => p.id === projectId);
      if (!project) return { error: 'Unknown quest' };
      if (s.outcome !== 'playing' || s.runs[projectId]?.completedOnDay != null) return { error: 'This quest is closed' };
      try {
        const list = autoAssign(project, s.members, s.mode, otherAssignments(s.assignments, projectId));
        return { ...withSquad(s, projectId, list), summonCount: s.summonCount + 1 };
      } catch (e) {
        return { error: errorMessage(e) };
      }
    }),

  setRate: (projectId, memberId, rate) =>
    set((s) =>
      withSquad(
        s,
        projectId,
        (s.assignments[projectId] ?? []).map((a) => (a.memberId === memberId ? { ...a, allocatedRate: clampRate(rate) } : a)),
      ),
    ),

  addMember: (projectId, memberId) =>
    set((s) => {
      const project = s.projects.find((p) => p.id === projectId);
      const member = s.members.find((m) => m.id === memberId);
      if (!project || !member) return { error: 'Unknown quest' };
      if (s.outcome !== 'playing' || s.runs[projectId]?.completedOnDay != null) return { error: 'This quest is closed' };
      const current = s.assignments[projectId] ?? [];
      if (current.some((a) => a.memberId === memberId)) return { error: null };
      const skills = project.requiredSkills
        .filter((r) => (member.skills.find((k) => k.skillName === r.skillName)?.level ?? 0) >= r.minLevel)
        .map((r) => r.skillName);
      if (skills.length === 0) return { error: 'No matching skill' };
      const free = member.capacity - memberLoad(memberId, s.assignments);
      const rate = Math.floor(free / RATE_STEP) * RATE_STEP;
      if (rate < MIN_RATE) return { error: `${member.name} is over capacity` };
      return withSquad(s, projectId, [...current, { projectId, memberId, allocatedRate: clampRate(rate), assignedSkills: skills }]);
    }),
  removeAssignment: (projectId, memberId) =>
    set((s) =>
      withSquad(
        s,
        projectId,
        (s.assignments[projectId] ?? []).filter((a) => a.memberId !== memberId),
      ),
    ),

  train: (memberId, skill) =>
    set((s) => {
      try {
        return { ...startTraining(pickGame(s), memberId, skill), error: null };
      } catch (e) {
        return { error: errorMessage(e) };
      }
    }),

  setSkillLevel: (memberId, skill, level) =>
    set((s) => ({
      members: s.members.map((m) =>
        m.id === memberId
          ? { ...m, skills: m.skills.map((k) => (k.skillName === skill ? { ...k, level: Math.min(MAX_SKILL_LEVEL, Math.max(0, Math.round(level))) } : k)) }
          : m,
      ),
    })),
  addProject: (project) =>
    set((s) => ({ ...addProjectToGame(pickGame(s), project), selectedProjectId: project.id })),

  toggleMute: () => set((s) => ({ muted: !s.muted })),
  setPlaying: (playing) => set((s) => ({ playing: playing && s.outcome === 'playing' })),
  setSpeed: (speed) => set({ speed }),

  advanceDay: () =>
    set((s) => {
      // The first day of a campaign draws a fresh seed, so each run gets different incidents.
      const game = s.day === 0 && s.history.length === 0 ? { ...pickGame(s), seed: randomSeed() } : pickGame(s);
      const next = stepDay(game);
      // Stop on a banished quest so the player can staff the next one before more days pass.
      const banishedToday = next.history[next.history.length - 1]?.events.some((e) => e.kind === 'banished') ?? false;
      // The summary opens the moment the campaign ends.
      const justEnded = s.outcome === 'playing' && next.outcome !== 'playing';
      return { ...next, playing: s.playing && next.outcome === 'playing' && !banishedToday, resultOpen: justEnded || s.resultOpen };
    }),

  resetGame: () => {
    clearSave();
    set({ ...initial(randomSeed()), error: null, playing: false, summonCount: 0, resultOpen: false });
  },
  setResultOpen: (resultOpen) => set({ resultOpen }),

  loadSave: (save) => set({ ...save, error: null, playing: false }),
}));

/** Writes the current game to localStorage. Called on every change; cheap next to a 60-day campaign's size. */
export function saveGame(): void {
  try {
    const s = useNecroCrew.getState();
    const extras: SavedExtras = { mode: s.mode, selectedProjectId: s.selectedProjectId, speed: s.speed, muted: s.muted };
    const file: SaveFile = { version: SAVE_VERSION, game: { ...pickGame(s), ...extras } };
    window.localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(file));
  } catch {
    // Storage can be blocked or full; the game still works, just without a save.
  }
}

/** Reads a save from localStorage if its shape matches the current version. Never throws. */
export function readSave(): (GameState & Partial<SavedExtras>) | null {
  try {
    const raw = window.localStorage.getItem(SAVE_STORAGE_KEY);
    if (!raw) return null;
    const file = JSON.parse(raw) as Partial<SaveFile>;
    if (file.version !== SAVE_VERSION || !file.game || typeof file.game.day !== 'number') return null;
    return file.game;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  try {
    window.localStorage.removeItem(SAVE_STORAGE_KEY);
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}

/** The game portion of the store as one object, for components that run engine functions. */
export function useGameState(): GameState {
  return useNecroCrew(useShallow(pickGame));
}



