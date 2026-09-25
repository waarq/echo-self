import { describe, expect, it } from 'vitest';
import { GameState, GameStateMachine } from './GameState';

describe('GameStateMachine', () => {
  it('starts in MENU by default', () => {
    const sm = new GameStateMachine();
    expect(sm.state).toBe(GameState.MENU);
  });

  it('allows the documented happy-path sequence', () => {
    const sm = new GameStateMachine();
    expect(sm.transition(GameState.COUNTDOWN)).toBe(true);
    expect(sm.transition(GameState.PLAYING)).toBe(true);
    expect(sm.transition(GameState.GAME_OVER)).toBe(true);
    expect(sm.transition(GameState.RESULTS)).toBe(true);
    expect(sm.transition(GameState.MENU)).toBe(true);
  });

  it('rejects invalid transitions and leaves state unchanged', () => {
    const sm = new GameStateMachine();
    expect(sm.transition(GameState.PLAYING)).toBe(false);
    expect(sm.state).toBe(GameState.MENU);
  });

  it('supports pause/resume from PLAYING', () => {
    const sm = new GameStateMachine(GameState.PLAYING);
    expect(sm.transition(GameState.PAUSED)).toBe(true);
    expect(sm.transition(GameState.PLAYING)).toBe(true);
  });

  it('notifies listeners on successful transitions only', () => {
    const sm = new GameStateMachine();
    const seen: Array<[GameState, GameState]> = [];
    sm.onChange((next, prev) => seen.push([next, prev]));

    sm.transition(GameState.PLAYING); // invalid, no notification
    sm.transition(GameState.COUNTDOWN); // valid

    expect(seen).toEqual([[GameState.COUNTDOWN, GameState.MENU]]);
  });
});
