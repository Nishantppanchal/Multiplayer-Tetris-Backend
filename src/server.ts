/** File containing utility functions for the server. */

import { Socket } from 'socket.io';
import {
  Event,
  Game,
  Mode,
  Player,
  Players,
  ServerState,
  UserInput,
} from './types';
import { Constants } from './constants';
import { Tick, emptyGameState, initialGameState, reduceGameState } from './gameState';
import { createLcg, scaleFloat } from './utils/random';
import { Connection, Input } from './socket';

const initialServerState: ServerState = {
  players: {},
  queue: [],
  games: [],
  gamesUpdated: [],
  lcg: createLcg(Math.random()),
};

/**
 * The function `createGame` takes in two player ids and returns a new `Game`.
 * @param {string} player1Id The id of the first player.
 * @param {string} [player2Id] The id of the second player.
 * @returns {Game} A new `Game`.
 */
const createGame = (player1Id: string, player2Id?: string): Game => ({
  gameEnd: false,
  player1Id: player1Id,
  player2Id: player2Id ? player2Id : null,
});

/**
 * The function `addConnection` add a new connection to the server.
 * @param {State} s The current state of the server.
 * @param {Socket} socket The socket of the new connection.
 * @returns {ServerState} A new `ServerState` with the new connection added.
 */
function addConnection(s: ServerState, socket: Socket): ServerState {
  // Create a new player. The player's game state is empty and the player's mode is the default
  // mode.
  const newPlayer: Player = {
    socket: socket,
    gameState: emptyGameState,
    mode: Constants.DEFAULT_MODE,
    highScore: 0,
  };

  // Add the new player to the server.
  return {
    ...s,
    players: { ...s.players, [socket.id]: newPlayer },
  };
}

/**
 * The function `matchMake` makes matches between players in the queue.
 * @param {ServerState} s The current state of the server.
 * @returns {ServerState} A new `ServerState` with the new matches added.
 */
function matchMake(s: ServerState): ServerState {
  // Base Case: If there are no players in the queue, return the server state.
  if (s.queue.length === 0) return s;

  // Recursive Case: If there is one player or more in the queue, create a game.
  // Get the first player in the queue.
  const player1Id = s.queue[0];
  // If the player is in single player mode, create a single player game.
  if (s.players[player1Id].mode === 1) {
    const singlePlayerGame = createGame(player1Id);

    // Generate a random number between 0 and 1.
    const randNum = scaleFloat(s.lcg(), 0, 1);

    // Add the new game to the server and update the queue as well as the lcg, before recursively
    // calling the matchMake function to match the next player in the queue.
    return matchMake({
      ...s,
      players: {
        ...s.players,
        [player1Id]: {
          ...s.players[player1Id],
          gameState: initialGameState(randNum),
        },
      },
      queue: s.queue.slice(1),
      games: [...s.games, singlePlayerGame],
      gamesUpdated: [...s.gamesUpdated, singlePlayerGame],
      lcg: createLcg(randNum),
    });
    // If the player is in multiplayer mode and there is more than 1 player in the queue, create a two
    // player game.
  } else if (s.queue.length >= 2) {
    // Get the second player in the queue and create a two player game.
    const player2Id = s.queue[1];
    const twoPlayerGame = createGame(player1Id, player2Id);

    // Generate two random numbers between 0 and 1.
    const randNum1 = scaleFloat(s.lcg(), 0, 1);
    const randNum2 = scaleFloat(createLcg(randNum1)(), 0, 1);

    // Add the new game to the server and update the queue as well as the lcg, before recursively
    // calling the matchMake function to match the next players in the queue.
    return matchMake({
      ...s,
      players: {
        ...s.players,
        [player1Id]: {
          ...s.players[player1Id],
          gameState: initialGameState(randNum1),
        },
        [player2Id]: {
          ...s.players[player2Id],
          gameState: initialGameState(randNum2),
        },
      },
      queue: s.queue.slice(2),
      games: [...s.games, twoPlayerGame],
      gamesUpdated: [...s.gamesUpdated, twoPlayerGame],
      lcg: createLcg(randNum2),
    });
    // In all other cases, return the server state without making any matches.
  } else {
    return s;
  }
}

/**
 * The function `updateHighScore` updates the high score of a player.
 * @param {State} s The current state of the server.
 * @param {string} playerId The id of the player whose high score we want to update.
 * @returns {ServerState} A new `ServerState` with the high score of the player updated.
 */
const updateHighScore = (s: ServerState, playerId: string): ServerState => ({
  // Update the high score of the player in the server state using spread syntax.
  ...s,
  players: {
    ...s.players,
    [playerId]: {
      ...s.players[playerId],
      highScore: Math.max(
        s.players[playerId].highScore,
        s.players[playerId].gameState.stats.score
      ),
    },
  },
});

/**
 * End the game that the player is in.
 * @param {ServerState} s The current state of the server.
 * @param {string} playerQuitId The id of the player that quit the game.
 * @returns {ServerState} A new `ServerState` with the game that the player is in ended.
 */
function endGame(s: ServerState, playerQuitId: string): ServerState {
  // Get the game that the player is in.
  const game = s.games.find(
    (game) => game.player1Id === playerQuitId || game.player2Id === playerQuitId
  );

  // Get the games that the player is not in.
  const otherGames = s.games.filter(
    (game) => game.player1Id !== playerQuitId && game.player2Id !== playerQuitId
  );

  // Update the server state, adding the player to the queue and removing game that the player is in
  // from the games array. We also request an update for players in the game about the game ending.
  // gameEnd is set to true to indicate that the game has ended.
  return {
    ...s,
    queue: [...s.queue.filter((id) => id !== playerQuitId), playerQuitId],
    games: otherGames,
    gamesUpdated: game
      ? [
          {
            ...game,
            gameEnd: true,
          },
        ]
      : [],
  };
}

/**
 * The function `removeConnection` removes a connection from the server.
 * @param {State} s The current state of the server.
 * @param {string} playerId The id of the player that we want to remove.
 * @returns {ServerState} A new `ServerState` with the player removed.
 */
const removeConnection = (s: ServerState, playerId: string): ServerState => {
  // Remove the player from all players using destructuring.
  const { [playerId]: _, ...filteredPlayers } = s.players;
  // Remove the player from the queue.
  const filteredQueue = s.queue.filter((id) => id !== playerId);

  // End the game that the player is in and updates the queue and players.
  return {
    ...endGame(s, playerId),
    queue: filteredQueue,
    players: filteredPlayers,
  };
};

/**
 * The function `updateGameState` is a helper function that checks if the player is in a game.
 * @param {string} id The id of the player.
 * @param {game} Game The game that we want to check if the player is in.
 * @returns {boolean} A boolean value that represents whether the player is in the game.
 */
const playerInGame = (id: string) => (game: Game) =>
  game.player1Id === id || game.player2Id === id;

/**
 * Set the player's mode.
 * @param {ServerState} s The current state of the server.
 * @param {string} playerId The id of the player whose game state we want to update.
 * @param {Mode} mode The mode that we want to set the player to.
 * @returns {ServerState} A new `ServerState` with the player's mode updated.
 */
const setPlayerMode = (
  s: ServerState,
  playerId: string,
  mode: Mode
): ServerState => ({
  ...s,
  players: {
    ...s.players,
    [playerId]: {
      ...s.players[playerId],
      mode: mode,
    },
  },
});

const updatePlayerState =
  (e: UserInput | Tick) =>
  (player: Player): Player => ({
    ...player,
    gameState: reduceGameState(player.gameState, e),
  });

function processInput(s: ServerState, input: Input): ServerState {
  if (input.input === 'new SPG' || input.input === 'new MPG') {
    console.log('Making matches');
    return matchMake(
      endGame(
        setPlayerMode(
          {
            ...s,
            gamesUpdated: [],
          },
          input.id,
          input.input === 'new SPG' ? 1 : 2
        ),
        input.id
      )
    );
  }

  const playerInGameChecker = playerInGame(input.id);
  const game = s.games.find(playerInGameChecker);
  if (!game) return s;
  if (game.gameEnd) return s;

  const playerStateUpdater = updatePlayerState(input.input);
  const player1 =
    game.player1Id === input.id
      ? playerStateUpdater(s.players[game.player1Id])
      : s.players[game.player1Id];
  const player2 =
    game.player2Id === input.id
      ? playerStateUpdater(s.players[input.id])
      : game.player2Id
      ? s.players[game.player2Id]
      : null;
  const newPlayers: Players =
    game.player2Id && player2
      ? {
          ...s.players,
          [game.player1Id]: player1,
          [game.player2Id]: player2,
        }
      : {
          ...s.players,
          [game.player1Id]: player1,
        };

  const updatedGameState: Game = {
    ...game,
    gameEnd:
      player1?.gameState.gameEnd === true ||
      player2?.gameState.gameEnd === true,
  };

  return updateHighScore(
    {
      ...s,
      players: newPlayers,
      games: [
        ...s.games.filter((game) => !playerInGameChecker(game)),
        updatedGameState,
      ],
      gamesUpdated: [updatedGameState],
    },
    input.id
  );
}

function tickServer(s: ServerState, e: Tick): ServerState {
  const playerStateUpdater = updatePlayerState(e);

  const newPlayers = s.games.reduce((players, game) => {
    if (game.player2Id) {
      return {
        ...players,
        [game.player1Id]: playerStateUpdater(s.players[game.player1Id]),
        [game.player2Id]: playerStateUpdater(s.players[game.player2Id]),
      };
    } else {
      return {
        ...players,
        [game.player1Id]: playerStateUpdater(s.players[game.player1Id]),
      };
    }
  }, {});
  const allPlayers: Players = {
    ...s.players,
    ...newPlayers,
  };

  const newGames = s.games.map(
    (game): Game => ({
      ...game,
      gameEnd:
        s.players[game.player1Id].gameState.gameEnd ||
        (game.player2Id !== null &&
          s.players[game.player2Id].gameState.gameEnd),
    })
  );

  const updatedState = {
    ...s,
    players: allPlayers,
    games: newGames,
    gamesUpdated: newGames,
  };

  return newGames.reduce(
    (accumState: ServerState, game) =>
      game.player2Id
        ? updateHighScore(
            updateHighScore(accumState, game.player1Id),
            game.player2Id
          )
        : updateHighScore(accumState, game.player1Id),
    updatedState
  );
}

function reduceServerState(s: ServerState, e: Event): ServerState {
  const clearState: ServerState = {
    ...s,
    games: s.games.filter(({ gameEnd }) => !gameEnd),
  };

  if (e instanceof Connection) {
    return addConnection(clearState, e.socket);
  } else if (e instanceof Input) {
    return processInput(clearState, e);
  } else if (e instanceof Tick) {
    return tickServer(clearState, e);
  } else {
    return removeConnection(clearState, e.socketId);
  }
}

export { reduceServerState, initialServerState };
