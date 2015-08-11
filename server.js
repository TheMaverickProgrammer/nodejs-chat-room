var express = require('express')
  , app = express(app)
  , server = require('http').createServer(app);

var EurecaServer = require('eureca.io').EurecaServer;

var eurecaServer = new EurecaServer({allow : ['tchat.welcome', 'tchat.send']});

//attach eureca to express server
eurecaServer.attach(server);

//serve index.html as default static file and the stylesheet
app.get('/', function (req, res, next) {
 res.sendfile('tchat-client.html');
});

var connections = {};

eurecaServer.onConnect(function (connection) {
    console.log('New client ', connection.id, connection.eureca.remoteAddress);
 connections[connection.id] = {nick:null, client:eurecaServer.getClient(connection.id)};
});

eurecaServer.onDisconnect(function (connection) {
    console.log('Client quit', connection.id);
    connections[connection.id].client.tchat.disconnect(connections[connection.id].nick);
 delete connections[connection.id];
});


//a namespace for chat methods on the server side
var tchatServer = eurecaServer.exports.tchatServer = {};

tchatServer.login = function (nick) {
 console.log('Client %s auth with %s', this.connection.id, nick);
 var id = this.connection.id;
 if (nick !== undefined) //here we can check for login/password validity for example
 {
  connections[id].nick = nick;

  //tchat.welcome() is a client side function indicated that the client authentication is ok
  connections[id].client.tchat.welcome(nick);

  /*for (var c in connections) // just loop and send message to all connected clients
  {
    if (connections[c].nick) //if the client is not connected nick is null
      connections[c].client.tchat.send(sender.nick, "has joined the chat");
  }*/
 }
}

/*tchatServer.disconnect = function(nick) {
  for (var c in connections) // just loop and send message to all connected clients
  {
    connections[c].client.tchat.disconnect(nick);
  }
}*/

//clients will call this method to send messages
tchatServer.send = function (message) {
 var sender = connections[this.connection.id];
 for (var c in connections) // just loop and send message to all connected clients
 {
  if (connections[c].nick) //if the client is not connected nick is null
   connections[c].client.tchat.send(sender.nick, message);
 }
}

console.log('Eureca.io tchat server listening on port 8000')
server.listen(8000);
