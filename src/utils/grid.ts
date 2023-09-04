/** File containing utility functions related to the grid. */

import { BlockDimensions, Viewport } from '../constants';
import { Block } from '../types';

/**
 * The function `checkGameOver` checks if the game is over. The game is over if any block has a y
 * coordinate of 0.
 * @param {ReadonlyArray<Block>} blocks An array of `Block`s to check if the game is over.
 * @returns {Boolean} A boolean value that represents whether the game is over.
 */
const checkGameOver = (blocks: ReadonlyArray<Block>): boolean =>
  // Game is over if any block has reached the top of the grid.
  blocks.some(({ pos }) => pos.y === 0);

/**
 * The function `inGrid` is a curried function that checks if a block is within the grid.
 * @param {number} y A number that represents the y-coordinate of the block's left corner.
 * @param {number} x A number that represents the x-coordinate of the block's left corner.
 * @returns {boolean} A boolean value that represents whether the block is within the grid.
 */
const inGrid = (y: number) => (x: number) =>
  // Check if all four sides of the block are within the grid.
  0 <= x &&
  x + BlockDimensions.WIDTH <= Viewport.CANVAS_WIDTH &&
  0 <= y &&
  y + BlockDimensions.HEIGHT <= Viewport.CANVAS_HEIGHT;

/**
 * The function `checkIfRowFull` checks if a row is full.
 * @param {ReadonlyArray<Block>} blocks An array of `Block`s where we want to check if a row
 * is full.
 * @param {number} y A number that represents the y-coordinate of the row that we want to check.
 * @returns {boolean} A boolean value that represents whether the row is full.
 */
const checkIfRowFull =
  (blocks: ReadonlyArray<Block>) =>
  (y: number): boolean => {
    // Get all the blocks that are in the row.
    const yBlocks = blocks.filter(({ pos }) => pos.y === y);

    // Helper function that checks if a row is full recursively.
    const checkIfRowFullAux = (x: number): boolean =>
      // Base Case: If we have reached the end of the row, return true.
      x <= Viewport.CANVAS_WIDTH - BlockDimensions.WIDTH
        ? // Recursive Case: If there is a block at the current x-coordinate in the row, check the next
          // x-coordinate. Otherwise, return false. We jump by the width of a block to check the next
          // x-coordinate.
          yBlocks.find(({ pos }) => pos.x === x) !== undefined
          ? checkIfRowFullAux(x + BlockDimensions.WIDTH)
          : false
        : true;

    // Call the helper function with the first x-coordinate in the row.
    return checkIfRowFullAux(0);
  };

export { checkGameOver, checkIfRowFull, inGrid };
