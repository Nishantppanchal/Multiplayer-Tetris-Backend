import { Mode, SocketEvent, UserInput } from './types';
import { Server, Socket } from 'socket.io';
import { Subject } from 'rxjs';
import { throttleTime } from 'rxjs/operators';

class Connection {
  constructor(public readonly socket: Socket) {}
}
class Disconnection {
  constructor(public readonly socketId: string) {}
}
class Input {
  constructor(public readonly id: string, public readonly input: UserInput) {}
}

function createInputObservable(io: Server) {
  const comms$ = new Subject<SocketEvent>();

  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);
    comms$.next(new Connection(socket));

    socket.on('input', (data: UserInput) => {
      console.log(`Received data from client ${socket.id}:`, data);
      comms$.next(new Input(socket.id, data));
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      comms$.next(new Disconnection(socket.id));
    });
  });

  return comms$.pipe(throttleTime(10));
}

export default createInputObservable;
export { Connection, Disconnection, Input };
