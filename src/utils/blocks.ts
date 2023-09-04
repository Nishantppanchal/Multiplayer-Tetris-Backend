/** File containing utility functions for blocks. */

import { BlockDimensions } from '../constants';
import { Block } from '../types';
import { inGrid } from './grid';

/**
 * The function `canMoveBlock` checks if a block can be moved to a new position without colliding
 * with other blocks. This function is curried.
 * @param {ReadonlyArray<Block>} otherBlocks An array of `Block` objects.
 * @param {number} newY A number that represents the new y-coordinate of the block that we want to
 * move.
 * @param {number} newX A number that represents the new x-coordinate of the block that we want to
 * move.
 * @returns {boolean} A boolean value that represents whether the block can be moved to the new
 * position without colliding with other blocks.
 */
const canMoveBlock =
  (otherBlocks: ReadonlyArray<Block>) => (newY: number) => (newX: number) =>
    // Ensure that the new position is in the grid and that the block is not colliding with other
    // blocks.
    inGrid(newY)(newX) &&
    otherBlocks.every(
      ({ pos }) =>
        Math.abs(pos.x - newX) >= BlockDimensions.WIDTH ||
        Math.abs(pos.y - newY) >= BlockDimensions.HEIGHT
    );

/**
 * The `moveBlock` function takes in new x and y coordinates and returns a new block object with the
 * updated position.
 * @param {number} newY - The `newY` parameter is a number that represents the new y-coordinate of
 * the block's position.
 * @param {number} newX - The `newX` parameter is a number that represents the new x-coordinate of
 * the block's position.
 * @param {Block} block - The `block` parameter is a `Block` object that represents the block that
 * we want to move.
 */
const moveBlock =
  (newY: number) =>
  (newX: number) =>
  (block: Block): Block => ({ ...block, pos: { x: newX, y: newY } });

export { canMoveBlock, moveBlock };
