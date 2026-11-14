import { writable } from 'svelte/store';
import type { ControlMode, DecalStyle, Difficulty, GameMode, MatchStats, ThemeId } from '../engine/types';

export interface PersistentData {
  supporterUnlocked: boolean;
  themeId: ThemeId;
  decalStyle: DecalStyle;
  controlMode: ControlMode;
  muted: boolean;
  highestLevelUnlocked: number;
  levelGrades: Record<number, string>;
}

export interface AppState extends PersistentData {
  screen: 'title' | 'playing';
  activeMode: GameMode;
  activeLevelId: number;
  skirmishDifficulty: Difficulty;
  matchResult: MatchStats | null;
  showSupporterModal: boolean;
  matchNonce: number;
}

const STORAGE_KEY = 'paper_tanks_save_v1';

const DEFAULT_PERSISTENT: PersistentData = {
  supporterUnlocked: false,
  themeId: 'classic',
  decalStyle: 'standard',
  controlMode: 'slingshot',
  muted: false,
  highestLevelUnlocked: 1,
  levelGrades: {}
};

function loadPersistent(): PersistentData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PERSISTENT };
    const parsed = JSON.parse(raw) as Partial<PersistentData>;
    return {
      ...DEFAULT_PERSISTENT,
      ...parsed
    };
  } catch {
    return { ...DEFAULT_PERSISTENT };
  }
}

function savePersistent(data: PersistentData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
}

function createGameStore() {
  const initial = loadPersistent();
  const { subscribe, update } = writable<AppState>({
    ...initial,
    screen: 'title',
    activeMode: 'campaign',
    activeLevelId: initial.highestLevelUnlocked,
    skirmishDifficulty: 'medium',
    matchResult: null,
    showSupporterModal: false,
    matchNonce: 0
  });

  function persistFromState(s: AppState): void {
    savePersistent({
      supporterUnlocked: s.supporterUnlocked,
      themeId: s.themeId,
      decalStyle: s.decalStyle,
      controlMode: s.controlMode,
      muted: s.muted,
      highestLevelUnlocked: s.highestLevelUnlocked,
      levelGrades: s.levelGrades
    });
  }

  return {
    subscribe,
    startCampaignLevel(levelId: number) {
      update((s) => ({
        ...s,
        screen: 'playing',
        activeMode: 'campaign',
        activeLevelId: levelId,
        matchResult: null,
        matchNonce: s.matchNonce + 1
      }));
    },
    startPassAndPlay() {
      update((s) => ({
        ...s,
        screen: 'playing',
        activeMode: 'pass_and_play',
        matchResult: null,
        matchNonce: s.matchNonce + 1
      }));
    },
    startSkirmish(difficulty: Difficulty) {
      update((s) => ({
        ...s,
        screen: 'playing',
        activeMode: 'skirmish',
        skirmishDifficulty: difficulty,
        matchResult: null,
        matchNonce: s.matchNonce + 1
      }));
    },
    restartMatch() {
      update((s) => ({
        ...s,
        matchResult: null,
        matchNonce: s.matchNonce + 1
      }));
    },
    returnToTitle() {
      update((s) => ({
        ...s,
        screen: 'title',
        matchResult: null
      }));
    },
    recordMatchEnd(stats: MatchStats) {
      update((s) => {
        const next: AppState = { ...s, matchResult: stats };
        if (stats.mode === 'campaign' && stats.winner === 'p1' && stats.levelId) {
          const gradeRank: Record<string, number> = { 'A+': 6, A: 5, 'B+': 4, B: 3, C: 2, F: 1 };
          const prev = s.levelGrades[stats.levelId];
          if (!prev || (gradeRank[stats.grade] ?? 0) > (gradeRank[prev] ?? 0)) {
            next.levelGrades = { ...s.levelGrades, [stats.levelId]: stats.grade };
          }
          if (stats.levelId >= s.highestLevelUnlocked && stats.levelId < 10) {
            next.highestLevelUnlocked = stats.levelId + 1;
          }
        }
        persistFromState(next);
        return next;
      });
    },
    setTheme(themeId: ThemeId) {
      update((s) => {
        const next = { ...s, themeId };
        persistFromState(next);
        return next;
      });
    },
    setDecal(decalStyle: DecalStyle) {
      update((s) => {
        const next = { ...s, decalStyle };
        persistFromState(next);
        return next;
      });
    },
    setControlMode(controlMode: ControlMode) {
      update((s) => {
        const next = { ...s, controlMode };
        persistFromState(next);
        return next;
      });
    },
    toggleMute() {
      update((s) => {
        const next = { ...s, muted: !s.muted };
        persistFromState(next);
        return next;
      });
    },
    unlockSupporter() {
      update((s) => {
        const next = { ...s, supporterUnlocked: true };
        persistFromState(next);
        return next;
      });
    },
    setShowSupporterModal(show: boolean) {
      update((s) => ({ ...s, showSupporterModal: show }));
    }
  };
}

export const gameStore = createGameStore();
