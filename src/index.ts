import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { interval, map, merge, scan } from 'rxjs';
import { Constants } from './constants';
import createInputObservable from './socket';
import { initialServerState } from './gameState';
import { Event, ServerState, Update } from './types';
import { Tick } from './utils/gameState';
import { reduceServerState } from './server';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: true },
});
server.listen(3000);

const inputs$ = createInputObservable(io);
const tick$ = interval(Constants.TICK_RATE_MS).pipe(
  map((elapsed) => new Tick(elapsed))
);

const source$ = merge(inputs$, tick$)
  // .pipe(scan((s: GameState) => ({ gameEnd: false }), initialState))
  .pipe(
    scan(
      (s: ServerState, e: Event) => reduceServerState(s, e),
      initialServerState
    )
  )
  .subscribe((s: ServerState) => {
    s.gamesUpdated.forEach((game) => {
      try {
        const player1 = s.players[game.player1Id];
        const player2 = game.player2Id ? s.players[game.player2Id] : null;
        // console.log(player2);

        if (player1) {
          const player1Update: Update = {
            gameEnd: game.gameEnd,
            matchMaking: s.queue.includes(game.player1Id),
            player: 'player1',
            player1: {
              gameState: player1.gameState,
              highScore: player1.highScore,
            },
            player2: player2
              ? {
                  gameState: player2.gameState,
                  highScore: player2.highScore,
                }
              : null,
          };
          player1.socket.emit('update', player1Update);
        }

        if (game.player2Id && player2) {
          const player2Update: Update = {
            gameEnd: game.gameEnd,
            matchMaking: s.queue.includes(game.player2Id),
            player: 'player2',
            player1: player1
              ? {
                  gameState: player1.gameState,
                  highScore: player1.highScore,
                }
              : null,
            player2: {
              gameState: player2.gameState,
              highScore: player2.highScore,
            },
          };
          player2.socket.emit('update', player2Update);
        }
      } catch (error) {
        console.error(error);
      }
    });
  });
