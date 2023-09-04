/** File containing utility functions for generic types. */

import { Matrix } from '../types';

/**
 * The I combinator function takes an input and returns the same input.
 * @param {T} i Input that we want to return.
 * @returns {T} The same input that we passed in.
 */
const I = <T>(i: T): T => i;

/**
 * The `removeDuplicates` function takes an array as input and returns a new array with duplicate
 * elements removed.
 * @param {ReadonlyArray<T>} arr An array of type `T`.
 * @returns {ReadonlyArray<T>} An array of type `T` with duplicate elements.
 */
const removeDuplicates = <T>(arr: ReadonlyArray<T>) =>
  // Filter out elements that are not the first occurrence of the element.
  arr.filter((e, idx) => arr.indexOf(e) === idx);

/**
 * The `rotateMatrixRight` function takes a matrix and rotates it 90 degrees to the right.
 * @param {Matrix<T>} matrix A Matrix of type `T`. It represents the matrix that needs to be
 * rotated.
 * @returns {Matrix<T>} A rotated matrix of type `Matrix<T>`.
 */
function rotateMatrixRight<T>(matrix: Matrix<T>): Matrix<T> {
  // The function `rotateMatrixRightAux` is a helper function that recursively rotates the matrix.
  const rotateMatrixRightAux = (
    rotatedMatrix: Matrix<T>,
    col: number
  ): Matrix<T> => {
    // Base Case: If we have reached the end of the matrix, return the rotated matrix.
    if (col >= matrix[0].length) return rotatedMatrix;

    // Recursive Case: Map column to row, reverse it and add it to the rotated matrix.
    const newRow = matrix.map((row) => row[col]).reverse();
    const newMatrix = [...rotatedMatrix, newRow];

    // Recursively call the function with the updated matrix and the next column.
    return rotateMatrixRightAux(newMatrix, col + 1);
  };

  // Call the helper function with an empty matrix and the first column.
  return rotateMatrixRightAux([], 0);
}

export { I, removeDuplicates, rotateMatrixRight };
