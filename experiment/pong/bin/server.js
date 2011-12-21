var strata = require('strata');

var app = new strata.Builder;
app.use(strata.static, __dirname + '/../', ['index.html']);
app.use(strata.static, __dirname + '/../../../');

var io = require('socket.io').listen(strata.run(app));
var pong = require('../lib/pong');
var Thing = require('../../../lib/thing');

var games = [], lastTick = 0, rate = 1000;
process.nextTick(function tickGames() {
  var now = Date.now(), current = games.length;
  if (now - lastTick > rate) {
    console.log('here', current);
    while (current--) {
      games[current].tick();
      console.log(JSON.stringify(games[current].toJSON()));
      games[current].socket.emit('tick', 'ticked');
    }
    lastTick = now;
  }

  process.nextTick(tickGames);
});


io.sockets.on('connection', function (socket) {

  var player1 = new pong.Player(), player2 = new pong.Player();

  player1.set('name', 'player1');
  player2.set('name', 'player2');

  player2.set('paddle', new pong.Paddle({
    y : Thing.constant(6),
    x : 190,
    width : Thing.constant(80),
    height: Thing.constant(10),
    color : '#ff0000',
    density : 100,
    restitution: 0,
    friction : .1
  }));

  player1.set('paddle', new pong.Paddle({
    y: Thing.constant(594),
    x : 190,
    width : Thing.constant(80),
    height: Thing.constant(10),
    color : 'blue',
    density : 100,
    restitution: 0,
    friction : .1
  }));

  var game = new pong.Scene({
     player1 : player1,
     player2 : player2
  });
  game.socket = socket;
  games.push(game);

  socket.on('message', function () {
    console.log(arguments);
  });

  socket.on('disconnect', function () {

    users = users.filter(function() {

    });
  });
});


var users = [];
var messages = [];
var msgid = 0;
var userid = 0;
var lobby = io.of('/lobby')
lobby.on('connection', function(socket) {
  lobby.emit('history', {
    messages : messages,
    users    : users
  });

  socket.on('msg', function(data) {
    data.type = data.type || "message";
    data.id = 'msg-' + msgid++;
    messages.unshift(data);
    lobby.emit('msg', data);
    console.log(messages)
  });

  socket.on('joined', function(data) {
    data.id = 'user-' + userid++;
    data.type = 'join';
    users.push(data);
    messages.unshift(data);
    lobby.emit('joined', data);
  });
});
