export const GameState = {
  MENU: 'MENU',
  COUNTDOWN: 'COUNTDOWN',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
  RESULTS: 'RESULTS',
} as const;

export type GameState = (typeof GameState)[keyof typeof GameState];

const VALID_TRANSITIONS: Record<GameState, GameState[]> = {
  [GameState.MENU]: [GameState.COUNTDOWN],
  [GameState.COUNTDOWN]: [GameState.PLAYING, GameState.MENU],
  [GameState.PLAYING]: [GameState.PAUSED, GameState.GAME_OVER],
  [GameState.PAUSED]: [GameState.PLAYING, GameState.MENU],
  [GameState.GAME_OVER]: [GameState.RESULTS],
  [GameState.RESULTS]: [GameState.MENU, GameState.COUNTDOWN],
};

type Listener = (next: GameState, prev: GameState) => void;

/** Single source of truth for which screen/mode the game is in. All state
 * transitions must go through this — never scatter state flags across
 * components (PRD §24). */
export class GameStateMachine {
  private current: GameState;
  private listeners: Listener[] = [];

  constructor(initial: GameState = GameState.MENU) {
    this.current = initial;
  }

  get state(): GameState {
    return this.current;
  }

  canTransition(next: GameState): boolean {
    return VALID_TRANSITIONS[this.current].includes(next);
  }

  transition(next: GameState): boolean {
    if (!this.canTransition(next)) return false;
    const prev = this.current;
    this.current = next;
    for (const listener of this.listeners) listener(next, prev);
    return true;
  }

  onChange(listener: Listener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
}
