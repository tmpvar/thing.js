var when = Thing.when;
var Value = Thing.Value;
var RATIO = 100;
var b2Vec2 = Box2D.Common.Math.b2Vec2;
var b2BodyDef = Box2D.Dynamics.b2BodyDef;
var b2Body = Box2D.Dynamics.b2Body;
var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
var b2Fixture = Box2D.Dynamics.b2Fixture;
var b2World = Box2D.Dynamics.b2World;
var b2MassData = Box2D.Collision.Shapes.b2MassData;
var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;


var Player = Thing.class(['game.actor']);
Player.prototype.link = function() {};

var human = new Player();
var ai = new Player();

Thing.trait('game.renderable', ['game.solid'], function(proto) {
  proto.init.push(function(obj, options) {
    obj.set('color', options.color || '#FF00FF');
    obj.set('renderSteps', []);
  });

  proto.beginRender = function(ctx) {
    ctx.save();
    // TODO: move getting the world center out of here
    var center = this.get('body').GetBody().GetWorldCenter()
    ctx.translate(center.x*RATIO, center.y*RATIO);
    ctx.rotate(this.get('rotation') || 0);
  };

  proto.render = function(ctx) {
    this.beginRender(ctx);
    var steps = this.get('renderSteps');

    for (var i=0, l=steps.length; i<l; i++) {
      steps[i].call(this, ctx);
    }

    this.endRender(ctx);
  };

  proto.endRender = function(ctx) {
    ctx.restore();
  }
});

Thing.trait('game.solid.rectangular', ['game.renderable'], function(proto) {
  proto.init.push(function(obj, options) {
    obj.set('physicalShape', new b2PolygonShape);
    obj.get('physicalShape').SetAsBox(
      obj.get('width')/RATIO/2,
      obj.get('height')/RATIO/2
    );

    obj.get('renderSteps').push(function(ctx) {
      ctx.fillStyle = this.get('color');
      ctx.fillRect(
        -(this.get('width')/2), // center on the x
        -(this.get('height')/2), // center on the y
        this.get('width'),
        this.get('height')
      );
    });
  });
});

Thing.trait('game.solid.circular', ['game.renderable'], function(proto) {
  proto.init.push(function(obj, options) {
    obj.set('physicalShape', new b2CircleShape);
    obj.get('physicalShape').SetRadius(obj.get('width')/RATIO/2);

    obj.get('renderSteps').push(function(ctx) {
      ctx.fillStyle = this.get('color');
      ctx.beginPath();
      ctx.arc(
        0, // center on the x
        0, // center on the y
        this.get('width')/2,
        0,
        Math.PI*2,
        true
      );


      ctx.closePath();
      ctx.fill();
    });
  });
});


Thing.trait('object.physics.static', function(proto) {
  proto.init.push(function(o, options) {
    o.set('type', b2Body.b2_staticBody);
    o.set('density', options.density || 1.0);
    o.set('friction', options.friction || 0);
    o.set('restitution', options.restitution || 0);
    o.set('tick', 0);
    o._store.tick.on(function() {
      var pos = o.get('body').GetBody().GetPosition();
      o.set('x', pos.x*RATIO);
      o.set('y', pos.y*RATIO);
      o.set('rotation', o.get('body').GetBody().GetAngle());
    });
  });
});

var Paddle = Thing.class(['game.solid.rectangular', 'object.physics.static']);

var aiPaddle = new Paddle({
  y : Thing.constant(10),
  x : 150,
  width : Thing.constant(80),
  height: Thing.constant(5),
  color : '#ff0000',
  density : 10,
  restitution: 0,
  friction : 1000
});

human.link(playerPaddle);

var playerPaddle = new Paddle({
  y: Thing.constant(590),
  x : 150,
  width : Thing.constant(80),
  height: Thing.constant(5),
  color : 'blue',
  density : 10,
  restitution: 0,
  friction : 1000
});

ai.link(aiPaddle);

Thing.trait('pong.physics.object', ['game.solid', 'game.box2d.node'], function(proto) {
  proto.collidesWith = function() {
    return {
      then : function() {}
    }
  };
});


Thing.trait('object.physics.dynamic', function(proto) {
  proto.init.push(function(o) {
    o.set('type', b2Body.b2_dynamicBody);
    o.set('density', 1);
    o.set('tick', 0);
    o._store.tick.on(function() {
      var pos = o.get('body').GetBody().GetPosition();
      o.set('x', pos.x*RATIO);
      o.set('y', pos.y*RATIO);
      o.set('rotation', o.get('body').GetBody().GetAngle());
    });
  });
});

var Wall = Thing.class([
  'pong.physics.object',
  'game.solid.rectangular',
  'object.physics.static'
]);

var wallcolor = "rgba(255,0,255,1)"
var topw = new Wall({
  x : Thing.constant(200),
  y : Thing.constant(5),
  width : Thing.constant(400),
  height : Thing.constant(10),
  color : wallcolor,
  density : 100000000,
  restitution : 0
});

var leftw = new Wall({
  x : Thing.constant(5),
  y : Thing.constant(300),
  width : Thing.constant(10),
  height : Thing.constant(578),
  color : 'blue',
  density : 100000000,
  restitution : 0
});

var rightw = new Wall({
  x : Thing.constant(395),
  y : Thing.constant(300),
  width : Thing.constant(10),
  height : Thing.constant(578),
  color : 'green',
  density : 10000000,
  restitution : 0
});

var bottomw = new Wall({
  x : Thing.constant(200),
  y : Thing.constant(590),
  width : Thing.constant(400),
  height : Thing.constant(10),
  color : wallcolor,
  density : 1000000000,
  restitution : 0
});

ai.link(bottomw);
human.link(topw);

var puck = Thing.create([
  'pong.physics.object',
  'game.solid.circular',
  'object.physics.static'
], {
  x : 200,
  y : 250,
  width : 20,
  height : 20,
  reset : function() {
    // TODO: reset the puck to 0 and randomly choose a direction
  },
  color : 'black',
  friction : 1000,
  restitution : 1.01,
  density : 1
});

var scoreboard = Thing.create('object', {
  human : new Value(0, ['dom.binding'], {
    el : document.getElementById('player-score')
  }),
  ai : new Value(0, ['dom.binding'], {
    el :document.getElementById('ai-score')
  })
});

human.link(scoreboard.reference('player'))
ai.link(scoreboard.reference('ai'))


Thing.when(puck).collidesWith(bottomw, topw).then(function(wall) {
  var score = wall.get('player').get('score') + 1;
  wall.get('player').set('score', score);

  if (score > 14) {
    // TODO: end the game
  }
});

Thing.trait(['pong.physics.world'], function(proto) {
  proto.init.push(function(obj, options) {
    options.gravity = options.gravity || { x : 0, y : 0};
    var gravity = new b2Vec2(options.gravity.x || 0, options.gravity.y || 0);

    // TODO: externalize gravity with Thing.Value

    obj.set('world', new b2World(gravity, true));
    if (obj._store.children) {
      obj._store.children.on(function(node) {
        obj.addBody(node);
      })
    }

    var debugDraw = new Box2D.Dynamics.b2DebugDraw;
    console.log(debugDraw);
    debugDraw.SetSprite(ctx);
    debugDraw.SetDrawScale(RATIO);
    debugDraw.SetFillAlpha(0.4);
    debugDraw.SetLineThickness(5.0);

    debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
    obj.get('world').SetDebugDraw(debugDraw);
  });

  proto.tick = function() {
    this.get('world').Step(1/60, 10, 10);
    this.get('world').DrawDebugData();
  };

  proto.addBody = function(node) {
    var fixDef = new b2FixtureDef;
    fixDef.density = node.get('density');
    fixDef.friction = node.get('friction') || 0;
    fixDef.restitution = node.get('restitution') || 0;

    var bodyDef = new b2BodyDef;
    bodyDef.type = node.get('type') || b2Body.b2_dynamicBody;
    fixDef.shape = node.get('physicalShape');

    bodyDef.position.Set(node.get('x')/RATIO, node.get('y')/RATIO);
    var body = this.get('world').CreateBody(bodyDef).CreateFixture(fixDef);
    body.GetBody().SetAngle(0);
    node.set('body', body);
  };
});
