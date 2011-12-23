var strata = require('strata');

var app = new strata.Builder;
app.use(strata.static, __dirname + '/../', ['index.html']);
app.use(strata.static, __dirname + '/../../../');

var io = require('socket.io').listen(strata.run(app));
var pong = require('../lib/pong');
var Thing = require('../../../lib/thing');
io.disable('log');
var games = [], lastTick = 0, rate = 60;
process.nextTick(function tickGames() {
  var now = Date.now(), current = games.length;
  if (now - lastTick > rate) {
    while (current--) {
      games[current].step();
      games[current].socket.emit('tick', games[current].pack());
    }
    lastTick = now;
  }

  process.nextTick(tickGames);
});


io.sockets.on('connection', function (socket) {
  socket.on('message', function () {
    //console.log(arguments);
  });

  socket.on('disconnect', function () {
  });
});

var createGame = function(player1, player2) {
  var game = pong.setupScene(player1, player2);

  game.set('room', '/game/' + game.meta('id').value);
  game.socket = io.of(game.get('room'));

  var pendingJoins = 2;
  game.socket.on('connection', function() {
    pendingJoins--;
    if (pendingJoins < 1) {

      games.push(game);
    }
  });

  return game;
}

var users = [];
var messages = [];
var msgid = 0;
var userid = 0;
var lobby = io.of('/lobby');

var findPlayerByHandle = function(handle) {
  var current = users.length;
  while(current--) {
    if (users[current].handle === handle) {
      return users[current];
    }
  }
};

lobby.on('connection', function(socket) {
  lobby.emit('history', {
    messages : messages
  });

  socket.on('msg', function(data) {
    data.type = data.type || "message";
    data.id = 'msg-' + msgid++;
    messages.unshift(data);
    lobby.emit('msg', data);

    if (data.type === "accept") {
      // find both users and send them a game request as soon as the game is ready
      var player1 = findPlayerByHandle(data.handle);
      var player2 = findPlayerByHandle(data.handle2);
      var game = createGame(player1, player2);

      // prompt the users to join a game
      player1.socket.emit('game.created', game.get('room'));
      player2.socket.emit('game.created', game.get('room'));
    }
  });

  socket.on('joined', function(data) {
    data.id = 'user-' + userid++;
    data.type = 'join';
    lobby.emit('joined', data);
    messages.unshift(JSON.parse(JSON.stringify(data)));
    data.socket = socket;
    users.push(data);

  });
});
