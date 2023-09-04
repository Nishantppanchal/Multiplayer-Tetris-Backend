import { Constants, LcgConstants } from './constants';
import { Lcg, ServerState, GameState, UserInput } from './types';
import { createLcg } from './utils/random';
import { initialiseTetrominosTask } from './utils/tasks';
import {
  handleRotateTetromino,
  handleTetrominoMoveLeft,
  handleTetrominoMoveRight,
  handleTetrominoSmashDown,
} from './utils/tetromino';

const initialGameState = (initialRandNum: number): GameState => ({
  tickEclipsed: 0,
  gameEnd: false,
  tetromino: null,
  nextTetromino: null,
  fallRate: Constants.INITIAL_FALL_RATE,
  placedBlocks: [],
  blockCounter: 0,
  stats: {
    score: 0,
    level: 1,
  },
  scheduledTasks: [{ triggerTime: 0, task: initialiseTetrominosTask }],
  lcg: createLcg(Math.floor(initialRandNum * LcgConstants.M)),
});

const emptyGameState: GameState = {
  tickEclipsed: 0,
  gameEnd: false,
  tetromino: null,
  nextTetromino: null,
  fallRate: Constants.INITIAL_FALL_RATE,
  placedBlocks: [],
  blockCounter: 0,
  stats: {
    score: 0,
    level: 1,
  },
  scheduledTasks: [],
  lcg: createLcg(0),
};

/** Class representing a tick for the game state */
class Tick {
  /**
   * The constructor for the `Tick` class.
   * @param {number} elapsed The number of tick that have elapsed.
   */
  constructor(public readonly elapsed: number) {}
}

/**
 * The function `updateGameState` takes in a `GameState` object and returns a new `GameState` object
 * with the player stats updated.
 * @param {GameState} s The `GameState` object that we want to update.
 * @param {number} rowRemoved The number of rows that were removed.
 * @returns {GameState} A new `GameState` object with the player stats updated.
 */
const updateStats = (s: GameState, rowRemoved: number): GameState => {
  // Calculate the new score, level, and fall rate.
  const newScore = s.stats.score + rowRemoved * Constants.SCORE_MULTIPLIER;
  const newLevel = Math.min(
    Math.floor(newScore / Constants.SCORE_TO_LVL_UP) + 1,
    Constants.MAX_LVL
  );
  const newFallRate =
    Constants.INITIAL_FALL_RATE - (newLevel - 1) * Constants.SPEED_MULTIPLIER;

  // Return a new `GameState` object with the updated stats.
  return {
    ...s,
    stats: {
      ...s.stats,
      score: newScore,
      level: newLevel,
    },
    fallRate: newFallRate,
  };
};

/**
 * Reduce the game state based on the user input.
 *
 * @param {GameState} s The current game state.
 * @param {UserInput | Tick} e The user input or tick.
 * @returns {GameState} The new game state.
 */
function reduceGameState(s: GameState, e: UserInput | Tick): GameState {
  // Run the appropriate function to update the state based on the user input.
  if (e instanceof Tick) {
    return tickGameState(s, e.elapsed);
  } else if (e === 'left') {
    return handleTetrominoMoveLeft(s);
  } else if (e === 'right') {
    return handleTetrominoMoveRight(s);
  } else if (e === 'rotate') {
    return handleRotateTetromino(s);
  } else if (e === 'smash') {
    return handleTetrominoSmashDown(s);
  } else {
    return s;
  }
}

/**
 * Ticks the game state.
 * @param {GameState} s The current game state.
 * @param {number} elapsed The number of ticks that have elapsed.
 * @returns {GameState} The new game state.
 */
const tickGameState = (s: GameState, elapsed: number): GameState => {
  // Update the game state based on the elapsed time.
  const tickedState: GameState = { ...s, tickEclipsed: elapsed };

  // Get the tasks that need to be run and remove them from the game state.
  const tasksToRun = tickedState.scheduledTasks.filter(
    ({ triggerTime }) => triggerTime <= elapsed
  );
  const filteredState: GameState = {
    ...tickedState,
    scheduledTasks: s.scheduledTasks.filter(
      ({ triggerTime }) => triggerTime > elapsed
    ),
  };

  // Run the tasks and return the new game state.
  return tasksToRun.reduce(
    (accumState: GameState, { task }) => task(accumState),
    filteredState
  );
};

export { emptyGameState, initialGameState, Tick, reduceGameState, updateStats };
