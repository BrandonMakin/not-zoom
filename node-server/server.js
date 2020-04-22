const http = require('http');
const WebSocket = require('ws');
const uuid = require('uuid')

const port = 1337

const server = http.createServer();
const wss = new WebSocket.Server({ server });

let clients = []

wss.on('connection', function connection(ws) {
  // ws.id = uuid.v4();
  clients.push(ws)

  ws.on('message', function incoming(message) {
    try {
      console.log(message);
      // send the message to each client
      clients.forEach((client) => {
        // don't send a message back to the client that originally sent it
        if (client == ws) {
          return;
        }
        client.send(message)
      });

    } catch (error) {
      console.log(error)
    }
  });

  ws.on('close', function close() {
    // remove the ws from the clients list
    clients = clients.slice(clients.indexOf(ws), 1)
  });
});

server.listen(port);
console.log("Server is running on port " + port)
