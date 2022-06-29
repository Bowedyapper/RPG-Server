import Player from './player.class';
import Queue from './queue.class';
import express from 'express';
const app = express();
import http from 'http';
const server = http.createServer(app);
import { Server } from 'socket.io';
const io = new Server(server);
let delta;
let ptime = Date.now();    // Time since last frame
let offset = 0;
let tickRate = 1000 / 60;
let updateQueue: any = new Queue();
let users: any[] = [];

const deltaTime = (previous: number, offset: number) => {
  let Δt = (Date.now() - previous);  // Δt = Current time - time of last frame
  return Δt;
}

app.get('/', (req, res):void => {
  res.send("👀");
});

/* 
// Game tick loop
*/
setInterval(():void => {

  const userChunk: any[] = []
  users.forEach(user => {
    userChunk.push({ socketid: user.socketid, x: user.x, y: user.y })
  })

  //console.log(userChunk)
  io.emit("game_chunk_update", userChunk);
}, 100);

/*
// Physics tick loop
*/
setInterval(():void => {
  delta = deltaTime(ptime, offset);
  ptime = Date.now();
  offset = delta % (1000 / tickRate);
  ptime = Date.now();

  io.emit("physics_update_tick")

  if (updateQueue.isEmpty()) return;
  users.forEach((user, index):void => {
    const getActions = updateQueue.items.filter((item: { user: any; }):boolean => item.user === user.socketid)
    if (!getActions) return;
    getActions.forEach((action: { action: any; }, index: number) => {
      let calc = Math.round((action.action.delta / 256) * 50)
      if (action.action.move) {
        if (action.action.move.dir === "right") {
          user.x += calc
          updateQueue.dequeue()
        }
        if (action.action.move.dir === "left") {
          user.x -= calc
          updateQueue.dequeue()
        }
        if (action.action.move.dir === "up") {
          user.y -= calc
          updateQueue.dequeue()
        }
        if (action.action.move.dir === "down") {
          user.y += calc
          updateQueue.dequeue()
        }
      }
    })
  })
}, 15)

io.on('connection', (socket):void => {
  const player = new Player('', socket.id)
  player.x = 1064;
  player.y = 1534
  users.push(player);

  socket.on('latency_check', ():void => {
    socket.emit('latency_response');
  })

  socket.on('move', (dir, delta, previousPos, time):void => {
    const direction = Buffer.from(dir).toString()
    if (direction === 'u') {
      player.upPressed = true;
      updateQueue.enqueue({ user: socket.id, action: { move: { dir: "up" }, delta: delta } });
    }
    if (direction === 'd') {
      player.downPressed = true;
      updateQueue.enqueue({ user: socket.id, action: { move: { dir: "down" }, delta: delta } });
    }
    if (direction === 'l') {
      player.leftPressed = true;
      updateQueue.enqueue({ user: socket.id, action: { move: { dir: "left" }, delta: delta } });
    }
    if (direction === 'r') {
      player.rightPressed = true;
      updateQueue.enqueue({ user: socket.id, action: { move: { dir: "right" }, delta: delta } });
    }
  })

  socket.on('user_wants_connection', (username:string):void => {
    socket.emit("user_got_connected", { user: socket.id })

  })

  socket.on('disconnect', (): void => {
    console.log(socket.id, 'disconnected')
    users.splice(users.findIndex(({ user }) => user == socket.id), 1);
    io.emit('user_disconnect', socket.id)
  })
});



const yeetServer = (): void => {
  console.log('Shutting Down!');
  server.close();
  process.kill(process.pid);
}
process.once('SIGUSR1', (): void => {
  yeetServer();
});
process.once('SIGUSR2', (): void => {
  yeetServer()
});
process.once('SIGINT', (): void => {
  yeetServer();
});
server.listen(4545, (): void => {
  console.log('listening on *:4545');
});