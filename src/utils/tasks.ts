/** This file contains utility functions for task scheduling. */

import { BlockDimensions } from '../constants';
import { GameState, Task } from '../types';
import { I } from './generic';
import { createLcg } from './random';
import {
  pickTetrominoShape,
  createTetromino,
  getTetrominoBlocks,
  changeTetrominoLoc,
  validateTetrominoPos,
  handlePlaceTetromino,
  moveTetromino,
} from './tetromino';

/**
 * The function `scheduleTask` takes a gameState and a task and returns a new gameState with the
 * scheduled task scheduled.
 * @param {GameState} s The gameState that we want to schedule the task for.
 * @param {Task} task The task that we want to schedule.
 * @returns {GameState} The new gameState with the task scheduled.
 */
const scheduleTask = (s: GameState, task: Task) => ({
  ...s,
  scheduledTasks: [...s.scheduledTasks, task],
});

/**
 * The function `initialiseTetrominosTask` is a task that takes a gameState and returns a new gameState with
 * the next tetromino initialised.
 * @param {GameState} s The game gameState that we want to initialise the next tetromino in.
 * @returns {GameState} The new game gameState with the next tetromino initialised.
 */
function initialiseTetrominosTask(s: GameState) {
  if (s.nextTetromino !== null)
    throw Error('nextTetromino need to be null to initialise!');

  const randNum = s.lcg();
  const tetrominoShape = pickTetrominoShape(randNum);
  const previewTetromino = createTetromino(
    s.blockCounter,
    tetrominoShape,
    'preview'
  );
  const previewTetrominoBlocks = getTetrominoBlocks(previewTetromino);

  const newState: GameState = {
    ...s,
    nextTetromino: previewTetromino,
    blockCounter: s.blockCounter + previewTetrominoBlocks.length,
    lcg: createLcg(randNum),
  };
  return spawnTetrominoTask(newState);
}

/**
 * The function `spawnTetrominoTask` is a task that takes a gameState and returns a new gameState with a new
 * tetromino spawned.
 * @param {GameState} s The game gameState that we want to spawn a new tetromino in.
 * @returns {GameState} The new game gameState with a new tetromino spawned.
 */
const spawnTetrominoTask = (s: GameState): GameState => {
  if (s.tetromino !== null) return s;
  if (s.nextTetromino === null) throw Error('nextTeetromino is null!');

  const randNum = s.lcg();
  const tetrominoShape = pickTetrominoShape(randNum);
  const previewTetromino = createTetromino(
    s.blockCounter,
    tetrominoShape,
    'preview'
  );
  const previewTetrominoBlocks = getTetrominoBlocks(previewTetromino);

  const spawnedTetromino = changeTetrominoLoc(s.nextTetromino, 'grid');

  const newState: GameState = {
    ...s,
    tetromino: spawnedTetromino,
    nextTetromino: previewTetromino,
    blockCounter: s.blockCounter + previewTetrominoBlocks.length,
    lcg: createLcg(randNum),
  };

  if (!validateTetrominoPos(I)(I)(newState)) {
    return {
      ...newState,
      gameEnd: true,
    };
  }

  return scheduleTask(newState, {
    triggerTime: s.tickEclipsed + s.fallRate,
    task: fallTetrominoTask,
  });
};

/**
 * The function `fallTetrominoTask` is a task that handles the logic to make the tetromino fall.
 * @param {GameState} s The gameState for which we want to make the tetromino fall.
 * @returns {GameState} The new gameState with the tetromino falling.
 */
const fallTetrominoTask = (s: GameState): GameState => {
  if (s.tetromino === null) return s;

  const mapY = (y: number) => y + BlockDimensions.HEIGHT;
  const mapX = (x: number) => x;

  if (validateTetrominoPos(mapY)(mapX)(s)) {
    const newState = scheduleTask(s, {
      triggerTime: s.tickEclipsed + s.fallRate,
      task: fallTetrominoTask,
    });
    return moveTetromino(mapY)(mapX)(newState);
  } else {
    return handlePlaceTetromino(s);
  }
};

export {
  fallTetrominoTask,
  initialiseTetrominosTask,
  scheduleTask,
  spawnTetrominoTask,
};
