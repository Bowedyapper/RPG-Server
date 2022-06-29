import Player from './player.class.js';
import Queue from './queue.class.js';
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
let updateQueue = new Queue();
let users = [];

const deltaTime = (previous, offset) => {
  let Δt = (Date.now() - previous);  // Δt = Current time - time of last frame
  return Δt;
}

app.get('/', (req, res) => {
  res.send("👀");
});

/* 
// Game tick loop
*/
setInterval(() => {

  const userChunk = []
  users.forEach(user => {
    userChunk.push({ socketid: user.socketid, x: user.x, y: user.y })
  })

  //console.log(userChunk)
  io.emit("game_chunk_update", userChunk);
}, 100);

/*
// Physics tick loop
*/
setInterval(() => {
  delta = deltaTime(ptime, offset);
  ptime = Date.now();
  offset = delta % (1000 / tickRate);
  ptime = Date.now();

  io.emit("physics_update_tick")

  if (updateQueue.isEmpty()) return;
  users.forEach((user, index) => {
    const getActions = updateQueue.items.filter(item => item.user === user.socketid)
    if (!getActions) return;
    getActions.forEach((action, index) => {
      let calc = Math.round( (action.action.delta / 256) * 50)
      if (action.action.move) {
        if (action.action.move.dir === "right") {
          user.x += calc
          updateQueue.dequeue(index)
        }
        if (action.action.move.dir === "left") {
          user.x -= calc
          updateQueue.dequeue(index)
        }
        if (action.action.move.dir === "up") {
          user.y -= calc
          updateQueue.dequeue(index)
        }
        if (action.action.move.dir === "down") {
          user.y += calc
          updateQueue.dequeue(index)
        }
      }
    })
  })
}, 15)

io.on('connection', (socket) => {
  const player = new Player('', socket.id)
  player.x = 1064;
  player.y = 1534
  users.push(player);

  socket.on('latency_check', ()=>{
     socket.emit('latency_response');
  })

  socket.on('move', (dir, delta, previousPos, time) => {
    const direction = Buffer.from(dir).toString()
    if (direction === 'u') {
      player.up_pressed = true;
      updateQueue.enqueue({ user: socket.id, action: { move: { dir: "up" }, delta: delta } });
    }
    if (direction === 'd') {
      player.down_pressed = true;
      updateQueue.enqueue({ user: socket.id, action: { move: { dir: "down" }, delta: delta } });
    }
    if (direction === 'l') {
      player.left_pressed = true;
      updateQueue.enqueue({ user: socket.id, action: { move: { dir: "left" }, delta: delta } });
    }
    if (direction === 'r') {
      player.right_pressed = true;
      updateQueue.enqueue({ user: socket.id, action: { move: { dir: "right" }, delta: delta } });
    }
  })

  socket.on('user_wants_connection', (username) => {
    socket.emit("user_got_connected", { user: socket.id })

  })

  socket.on('disconnect', () => {
    console.log(socket.id, 'disconnected')
    users.splice(users.findIndex(({ user }) => user == socket.id), 1);
    io.emit('user_disconnect', socket.id)
  })
});



const yeetServer = () => {
    console.log('Shutting Down!');
    server.close();
    process.kill(process.pid);
}
process.once('SIGUSR1', () => {
  yeetServer();
});
process.once('SIGUSR2', () => {
  yeetServer()
});
process.once('SIGINT', () => {
  yeetServer();
});

server.listen(4545, () => {
  console.log('listening on *:4545');
});