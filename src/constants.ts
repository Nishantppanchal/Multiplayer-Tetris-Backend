const Viewport = {
  CANVAS_WIDTH: 200,
  CANVAS_HEIGHT: 400,
  PREVIEW_WIDTH: 160,
  PREVIEW_HEIGHT: 80,
} as const;

const Constants = {
  TICK_RATE_MS: 10, // Tick rate to allow for dynamically scheduled task
  //   TICK_RATE_MS: 1000,
  GRID_WIDTH: 10,
  GRID_HEIGHT: 20,
  INITIAL_FALL_RATE: 90,
  CREATION_DELAY: 50,
  SCORE_INC: {
    ONE_ROW: 1,
    TWO_ROWS: 2,
    THREE_ROWS: 4,
    FOUR_ROWS: 8,
  },
  SCORE_MULTIPLIER: 100,
  // SCORE_TO_LVL_UP: 15,
  SCORE_TO_LVL_UP: 1000,
  MAX_LVL: 20,
  // SPEED_MULTIPLIER: 4,
  SPEED_MULTIPLIER: 50,
  DEFAULT_MODE: 1,
} as const;

const BlockDimensions = {
  WIDTH: Viewport.CANVAS_WIDTH / Constants.GRID_WIDTH,
  HEIGHT: Viewport.CANVAS_HEIGHT / Constants.GRID_HEIGHT,
};

const LcgConstants = {
  // M: 0x80000000,
  M: 102034001,
  A: 1103515245,
  C: 12345,
};

export { Viewport, Constants, BlockDimensions, LcgConstants };
