import { Connection, Input, Disconnection } from './socket';
import { Socket } from 'socket.io';
import { Tick } from './utils/gameState';

type Mode = 1 | 2;

type Game = Readonly<{
  gameEnd: boolean;
  player1Id: string;
  player2Id: string | null;
}>;

type Player = Readonly<{
  socket: Socket;
  gameState: GameState;
  mode: Mode;
  highScore: number;
}>;

type Players = Readonly<{
  [key: string]: Player;
}>;

type ServerState = Readonly<{
  players: Players;
  games: ReadonlyArray<Game>;
  queue: ReadonlyArray<string>;
  gamesUpdated: ReadonlyArray<Game>;
  lcg: Lcg;
}>;

type SocketEvent = Connection | Disconnection | Input;

type UserInput =
  | 'right'
  | 'left'
  | 'smash'
  | 'rotate'
  | 'new SPG'
  | 'new MPG';

// type Event = Right | Left | Tick;
type Event = Tick | SocketEvent;

type Pos = Readonly<{
  x: number;
  y: number;
}>;

type Matrix<T> = ReadonlyArray<ReadonlyArray<T>>;

type Color =
  | 'lightblue'
  | 'darkblue'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'red'
  | 'magenta';

type TetrominoBlock = Readonly<{
  color: Color;
  id: string;
}>;

type TetrominoShape = 'I' | 'J' | 'L' | 'O' | 'S' | 'Z' | 'T';

interface Block extends TetrominoBlock {
  pos: Pos;
}

type Tetromino = Readonly<{
  anchor: Pos;
  shape: TetrominoShape;
  blocks: Matrix<TetrominoBlock | null>;
}>;

type Task = Readonly<{
  triggerTime: number;
  task: (s: GameState) => GameState;
}>;

type UIUpdate = Readonly<{
  render: ReadonlyArray<Block>;
  move: ReadonlyArray<Block>;
  remove: ReadonlyArray<Block>;
}>;

type Stats = Readonly<{
  score: number;
  level: number;
}>;

type GameState = Readonly<{
  tickEclipsed: number;
  gameEnd: boolean;
  tetromino: Tetromino | null;
  fallRate: number;
  nextTetromino: Tetromino | null;
  placedBlocks: ReadonlyArray<Block>;
  blockCounter: number;
  stats: Stats;
  scheduledTasks: ReadonlyArray<Task>;
  lcg: Lcg;
}>;

type Lcg = () => number;

type Loc = 'grid' | 'preview';

type Update = {
  gameEnd: boolean;
  matchMaking: boolean;
  player: 'player1' | 'player2';
  player1: {
    gameState: GameState;
    highScore: number;
  } | null;
  player2: {
    gameState: GameState;
    highScore: number;
  } | null;
};

export type {
  Player,
  Players,
  Game,
  Mode,
  SocketEvent,
  UserInput,
  Event,
  Pos,
  Matrix,
  Color,
  Block,
  TetrominoBlock,
  TetrominoShape,
  Tetromino,
  Task,
  UIUpdate,
  ServerState,
  GameState,
  Lcg,
  Loc,
  Update,
};
