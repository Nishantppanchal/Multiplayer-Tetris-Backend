/** File containing utility functions for tetrominoes. */

import { BlockDimensions, Viewport, Constants } from '../constants';
import { updateStats } from '../gameState';
import {
  Loc,
  Matrix,
  Pos,
  GameState,
  Tetromino,
  TetrominoBlock,
  TetrominoShape,
  Block,
  Color,
} from '../types';
import { canMoveBlock, moveBlock } from './blocks';
import { I, removeDuplicates, rotateMatrixRight } from './generic';
import { checkGameOver, checkIfRowFull } from './grid';
import { scaleNumber } from './random';
import { fallTetrominoTask, scheduleTask, spawnTetrominoTask } from './tasks';

/**
 * The `pickTetrominoShape` function takes a random number and returns a tetromino shape based on
 * the random number.
 * @param {number} randNum A number that represents a random number.
 * @returns {TetrominoShape} A `TetrominoShape` that represents the shape of the tetromino selected.
 */
const pickTetrominoShape = (randNum: number): TetrominoShape => {
  const scaledNumber = scaleNumber(randNum, 1, 7);
  switch (scaledNumber) {
    case 1:
      return 'I';
    case 2:
      return 'J';
    case 3:
      return 'L';
    case 4:
      return 'O';
    case 5:
      return 'S';
    case 6:
      return 'Z';
    case 7:
      return 'T';
    default:
      throw new Error('Invalid scaled number!');
  }
};

/**
 * The function `createTetrominoBlock` takes a color and returns a function that takes an id and
 * returns a `TetrominoBlock`.
 * @param {Color} color The color of the `TetrominoBlock`.
 * @param {string} id The id of the `TetrominoBlock`.
 * @returns {TetrominoBlock} A `TetrominoBlock` with the given color and id.
 */
const createTetrominoBlock =
  (color: Color) =>
  (id: string): TetrominoBlock => ({
    color: color,
    id: id,
  });

/**
 * The function `createTetrominoBlocks` takes a first id and a tetromino shape and returns a matrix
 * of `TetrominoBlock`s.
 * @param {number} firstId The id of the first `TetrominoBlock` to be created.
 * @param {TetrominoShape} tetrominoType The shape of the tetromino.
 * @returns {Matrix<TetrominoBlock | null>} A matrix of `TetrominoBlock`s.
 */
function createTetrominoBlocks(
  firstId: number,
  tetrominoType: TetrominoShape
): Matrix<TetrominoBlock | null> {
  const ids = [
    String(firstId),
    String(firstId + 1),
    String(firstId + 2),
    String(firstId + 3),
  ];

  switch (tetrominoType) {
    case 'I':
      const createIBlock = createTetrominoBlock('lightblue');
      return [
        [null, null, null, null],
        [
          createIBlock(ids[0]),
          createIBlock(ids[1]),
          createIBlock(ids[2]),
          createIBlock(ids[3]),
        ],
        [null, null, null, null],
        [null, null, null, null],
      ];
    case 'J':
      const createJBlock = createTetrominoBlock('darkblue');
      return [
        [createJBlock(ids[0]), null, null],
        [createJBlock(ids[1]), createJBlock(ids[2]), createJBlock(ids[3])],
        [null, null, null],
      ];
    case 'L':
      const createLBlock = createTetrominoBlock('orange');
      return [
        [null, null, createLBlock(ids[0])],
        [createLBlock(ids[1]), createLBlock(ids[2]), createLBlock(ids[3])],
        [null, null, null],
      ];
    case 'O':
      const createOBlock = createTetrominoBlock('yellow');
      return [
        [createOBlock(ids[0]), createOBlock(ids[1])],
        [createOBlock(ids[2]), createOBlock(ids[3])],
      ];
    case 'S':
      const createSBlock = createTetrominoBlock('green');
      return [
        [null, createSBlock(ids[0]), createSBlock(ids[1])],
        [createSBlock(ids[2]), createSBlock(ids[3]), null],
        [null, null, null],
      ];
    case 'Z':
      const createZBlock = createTetrominoBlock('red');
      return [
        [createZBlock(ids[0]), createZBlock(ids[1]), null],
        [null, createZBlock(ids[2]), createZBlock(ids[3])],
        [null, null, null],
      ];
    case 'T':
      const createTBlock = createTetrominoBlock('magenta');
      return [
        [null, createTBlock(ids[0]), null],
        [createTBlock(ids[1]), createTBlock(ids[2]), createTBlock(ids[3])],
        [null, null, null],
      ];
  }
}

/**
 * The function `getTetrominoBlocks` takes a tetromino and returns an array of blocks that make up
 * the tetromino.
 * @param {Tetromino} tetromino The tetromino that we want to get the blocks for.
 * @returns {ReadonlyArray<Block>} The blocks that make up the tetromino.
 */
function getTetrominoBlocks(tetromino: Tetromino): ReadonlyArray<Block> {
  const anchor = tetromino.anchor;
  const mappedBlocks = tetromino.blocks.map((row, y) =>
    row
      .map((block, x) =>
        block !== null
          ? {
              ...block,
              pos: {
                x: anchor.x + x * BlockDimensions.WIDTH,
                y: anchor.y + y * BlockDimensions.HEIGHT,
              },
            }
          : block
      )
      .filter((block): block is Block => block !== null)
  );
  return mappedBlocks.flat();
}

/**
 * The function `createTetromino` takes a first id, a tetromino shape and a location and returns a
 * tetromino.
 * @param {number} firstId The id of the first block of the tetromino.
 * @param {TetrominoShape} tetrominoShape The shape of the tetromino.
 * @param {Loc} loc The location to spawn the tetromino on to (either 'grid' or 'preview').
 * @returns {Tetromino} The tetromino that was created.
 */
function createTetromino(
  firstId: number,
  tetrominoShape: TetrominoShape,
  loc: Loc
): Tetromino {
  const blocks = createTetrominoBlocks(firstId, tetrominoShape);
  return {
    anchor: getAnchor(tetrominoShape, loc),
    shape: tetrominoShape,
    blocks: blocks,
  };
}

/**
 * The function `getAnchor` takes a tetromino shape and a location and returns the anchor of the
 * tetromino.
 * @param {TetrominoShape} tetrominoShape The shape of the tetromino.
 * @param {Loc} loc The location of the tetromino.
 * @returns {Pos} The anchor of the tetromino.
 */
function getAnchor(tetrominoShape: TetrominoShape, loc: Loc): Pos {
  switch (loc) {
    case 'grid':
      if (tetrominoShape === 'O') return { x: 4 * BlockDimensions.WIDTH, y: 0 };
      else if (tetrominoShape === 'I')
        return { x: 3 * BlockDimensions.WIDTH, y: -BlockDimensions.HEIGHT };
      else return { x: 3 * BlockDimensions.WIDTH, y: 0 };
    case 'preview':
      if (tetrominoShape === 'O')
        return {
          x: Viewport.PREVIEW_WIDTH / 2 - BlockDimensions.WIDTH,
          y: Viewport.PREVIEW_HEIGHT / 2 - BlockDimensions.HEIGHT,
        };
      else if (tetrominoShape === 'I')
        return {
          x: Viewport.PREVIEW_WIDTH / 2 - BlockDimensions.WIDTH * 2,
          y: Viewport.PREVIEW_HEIGHT / 2 - BlockDimensions.HEIGHT * 1.5,
        };
      else
        return {
          x: Viewport.PREVIEW_WIDTH / 2 - BlockDimensions.WIDTH * 1.5,
          y: Viewport.PREVIEW_HEIGHT / 2 - BlockDimensions.HEIGHT,
        };
  }
}

/**
 * The function `changeTetrominoLoc` takes a tetromino moves it to a new location.
 * @param {Tetromino} tetromino The tetromino that we want to move.
 * @param {Loc} loc The location that we want to move the tetromino to.
 * @returns {Tetromino} The tetromino that was moved.
 */
const changeTetrominoLoc = (tetromino: Tetromino, loc: Loc): Tetromino => ({
  ...tetromino,
  anchor: getAnchor(tetromino.shape, loc),
});

const validateTetrominoPos =
  (mapY: (y: number) => number) =>
  (mapX: (x: number) => number) =>
  (s: GameState) => {
    if (s.tetromino === null) return false;

    const blockMoveChecker = canMoveBlock(s.placedBlocks);
    return getTetrominoBlocks(s.tetromino).every(({ pos }) =>
      blockMoveChecker(mapY(pos.y))(mapX(pos.x))
    );
  };

/**
 * The function `moveTetromino` is a curried higher order function that takes two functions that map
 * the x and y coordinates of the tetromino to new x and y coordinates as well as a gameState and
 * returns a new gameState with the tetromino moved to the new coordinates.
 * @param {function(number): number} mapY A function that maps the y-coordinates to a new
 * y-coordinates.
 * @param {function(number): number} mapX A function that maps the x-coordinates to a new
 * x-coordinates.
 * @param {GameState} s The gameState for which we want to move the tetromino.
 * @returns {GameState} The new gameState with the tetromino moved to the new coordinates.
 */
const moveTetromino =
  (mapY: (y: number) => number) =>
  (mapX: (x: number) => number) =>
  (s: GameState): GameState => {
    if (s.tetromino === null) return s;

    const anchor = s.tetromino.anchor;
    const newAnchor = { x: mapX(anchor.x), y: mapY(anchor.y) };
    const newTetromino = {
      ...s.tetromino,
      anchor: newAnchor,
    };
    const movedBlocks = getTetrominoBlocks(newTetromino);

    return {
      ...s,
      tetromino: newTetromino,
    };
  };

/**
 * The function `placeTetromino` places the tetromino. This means that the tetromino has landed and
 * is no longer moving.
 * @param {GameState} s The gameState for which we want to place the tetromino.
 * @returns {GameState} The new gameState with the tetromino placed.
 */
const placeTetromino = (s: GameState): GameState => {
  if (s.tetromino === null) return s;

  const tetrominoBlocks = getTetrominoBlocks(s.tetromino);
  const blocks = [...s.placedBlocks, ...tetrominoBlocks];
  const rowFullChecker = checkIfRowFull(blocks);
  const yToRemove = removeDuplicates(
    tetrominoBlocks.map(({ pos }) => pos.y)
  ).filter(rowFullChecker);

  const blocksToRemove = blocks.filter(({ pos }) => yToRemove.includes(pos.y));
  const blocksToKeep = blocks.filter(({ pos }) => !yToRemove.includes(pos.y));

  const blocksToNotMove = blocksToKeep.filter(
    ({ pos }) => !yToRemove.some((y) => pos.y < y)
  );
  const blocksToMove = blocksToKeep
    .filter(({ pos }) => yToRemove.some((y) => pos.y < y))
    .map((block) =>
      moveBlock(
        block.pos.y +
          yToRemove.reduce(
            (count, y) => count + (block.pos.y < y ? BlockDimensions.WIDTH : 0),
            0
          )
      )(block.pos.x)(block)
    );

  return updateStats(
    {
      ...s,
      tetromino: null,
      placedBlocks: [...blocksToNotMove, ...blocksToMove],
    },
    yToRemove.length
  );
};

/**
 * The function `rotateTetromino` rotates the tetromino 90 degrees to the right.
 * @param {Tetromino} tetromino The tetromino that we want to rotate.
 * @returns {Tetromino} The rotated tetromino.
 */
const rotateTetromino = (tetromino: Tetromino): Tetromino => ({
  ...tetromino,
  blocks: rotateMatrixRight(tetromino.blocks),
});

/**
 * The function `handleTetrominoMove` is a curried higher order function that handle all the logic
 * required for moving a tetromino.
 * @param {function(number): number} mapY A function that maps the y-coordinates to a new
 * y-coordinates.
 * @param {function(number): number} mapX A function that maps the x-coordinates to a new
 * x-coordinates.
 * @param {GameState} s The gameState for which we want to move the tetromino.
 * @returns {GameState} The new gameState with the tetromino moved to the new coordinates if it can be moved
 * to the new coordinates.
 */
const handleTetrominoMove =
  (mapY: (y: number) => number) =>
  (mapX: (x: number) => number) =>
  (s: GameState): GameState =>
    validateTetrominoPos(mapY)(mapX)(s) && !s.gameEnd
      ? moveTetromino(mapY)(mapX)(s)
      : s;

/**
 * The function `handleTetrominoMoveLeft` moves the tetromino one block to the left if it can be
 * moved to the left.
 */
const handleTetrominoMoveLeft = handleTetrominoMove(I)(
  (x) => x - BlockDimensions.WIDTH
);

/**
 * The function `handleTetrominoMoveRight` moves the tetromino one block to the right if it can be
 * moved to the right.
 */
const handleTetrominoMoveRight = handleTetrominoMove((y) => y)(
  (x) => x + BlockDimensions.WIDTH
);

/**
 * The function `handleTetrominoMoveDown` handles the logic to place the tetromino.
 * @param {GameState} s The gameState for which we want to place the tetromino.
 * @returns {GameState} The new gameState with the tetromino placed.
 */
const handlePlaceTetromino = (s: GameState): GameState => {
  const placedState = placeTetromino(s);
  const schedulerCleanedState: GameState = {
    ...placedState,
    scheduledTasks: placedState.scheduledTasks.filter(
      (scheduledTask) => scheduledTask.task !== fallTetrominoTask
    ),
  };

  if (checkGameOver(placedState.placedBlocks)) {
    return {
      ...schedulerCleanedState,
      gameEnd: true,
    };
  }

  return scheduleTask(schedulerCleanedState, {
    triggerTime: s.tickEclipsed + Constants.CREATION_DELAY,
    task: spawnTetrominoTask,
  });
};

/**
 * The function `handleTetrominoSmashDown` handles the logic to smash the tetromino down. This just
 * means that the tetromino is moved down as far as it can go.
 * @param {GameState} s The gameState for which we want to smash the tetromino down.
 * @returns {GameState} The new gameState with the tetromino smashed down.
 */
const handleTetrominoSmashDown = (s: GameState): GameState => {
  if (s.tetromino === null || s.gameEnd) return s;

  const findYShift = (yShift: number): number => {
    if (!validateTetrominoPos((y) => y + yShift + BlockDimensions.HEIGHT)(I)(s))
      return yShift;
    else return findYShift(yShift + BlockDimensions.HEIGHT);
  };
  const yShift = findYShift(0);
  const movedState = moveTetromino((y) => y + yShift)(I)(s);

  return handlePlaceTetromino(movedState);
};

/**
 * The function `handleTetrominoRotate` handles the logic to rotate the tetromino.
 * @param {GameState} s The gameState for which we want to rotate the tetromino.
 * @returns {GameState} The new gameState with the tetromino rotated.
 */
const handleRotateTetromino = (s: GameState): GameState => {
  if (s.tetromino === null) return s;

  const rotatedTetromino = rotateTetromino(s.tetromino);
  const rotatedState: GameState = {
    ...s,
    tetromino: rotatedTetromino,
  };

  return validateTetrominoPos(I)(I)(rotatedState) ? rotatedState : s;
};

export {
  createTetromino,
  changeTetrominoLoc,
  getTetrominoBlocks,
  handlePlaceTetromino,
  handleRotateTetromino,
  handleTetrominoMoveLeft,
  handleTetrominoMoveRight,
  handleTetrominoSmashDown,
  pickTetrominoShape,
  moveTetromino,
  validateTetrominoPos,
};
