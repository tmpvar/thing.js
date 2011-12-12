var when = Thing.when;
var Value = Thing.Value;
var RATIO = 200;
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
var b2ContactListener = Box2D.Dynamics.b2ContactListener;
var b2Transform = Box2D.Common.Math.b2Transform

var Player = Thing.class(['game.actor']);


var human = new Player();
human.set('name', 'human');
var ai = new Player();
ai.set('name', 'ai');

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
  y : Thing.constant(6),
  x : 190,
  width : Thing.constant(80),
  height: Thing.constant(10),
  color : '#ff0000',
  density : 100,
  restitution: 0,
  friction : .1
});

human.set('paddle', playerPaddle);

var playerPaddle = new Paddle({
  y: Thing.constant(594),
  x : 190,
  width : Thing.constant(80),
  height: Thing.constant(10),
  color : 'blue',
  density : 100,
  restitution: 0,
  friction : .1
});

ai.set('paddle', aiPaddle);

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

var wallcolor = "#94654A"
var topw = new Wall({
  x : Thing.constant(200),
  y : Thing.constant(-5),
  width : Thing.constant(400),
  height : Thing.constant(10),
  color : wallcolor,
  density : 100000000,
  restitution : 0,
  friction: 0
});

var leftw = new Wall({
  x : Thing.constant(-5),
  y : Thing.constant(299),
  width : Thing.constant(10),
  height : Thing.constant(599),
  color : wallcolor,
  density : 100000000,
  restitution : 0,
  friction: 0
});

var rightw = new Wall({
  x : Thing.constant(405),
  y : Thing.constant(300),
  width : Thing.constant(10),
  height : Thing.constant(599),
  color : wallcolor,
  density : 100000000,
  restitution : 0,
  friction: 0
});

var bottomw = new Wall({
  x : Thing.constant(200),
  y : Thing.constant(605),
  width : Thing.constant(400),
  height : Thing.constant(10),
  color : wallcolor,
  density : 100000000,
  restitution : 0,
  friction: 0
});

bottomw.set('player', ai);
topw.set('player', human);

Thing.trait('pong.puck', [
  'pong.physics.object',
  'game.solid.circular',
  'object.physics.static'
], function(proto) {

  proto.init.push(function(obj, options) {
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

      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.arc(
        0, // center on the x
        0, // center on the y
        (this.get('width')/2)*.75,
        0,
        Math.PI*2,
        true
      );


      ctx.closePath();
      ctx.fill();

      ctx.save();
        ctx.rotate(-this.get('rotation') || 0);
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.arc(
          2, // center on the x
          2, // center on the y
          (this.get('width')/2)*1.05,
          0,
          Math.PI*2,
          true
        );


        ctx.closePath();
        ctx.fill();
      ctx.restore();
    });
  });

});


var puck = Thing.create(['pong.puck'], {
  x : 200,
  y : 250,
  width : 20,
  height : 20,
  reset : function() {
    // TODO: reset the puck to 0 and randomly choose a direction
  },
  color : '#28D371',
  friction : 1,
  restitution : 1.001,
  density : 0
});

// TODO: this should live inside of the ai player
var updateAI = function() {
  var
  puckX = puck.get('x'),
  puckY = puck.get('y'),
  aiX   = aiPaddle.get('x'),
  aiY   = aiPaddle.get('y'),
  impulse = 100;


  if (puckX < aiX) {
    impulse = -impulse;
  } else if (puckX === aiX) {
    impulse = 0;
  }

  impulse = (Math.abs(puckX-aiX)/400) * impulse * (1-Math.abs(puckY-aiY)/600);

  aiPaddle.get('body').GetBody().ApplyImpulse({x: impulse, y: 0 }, {
    x : aiPaddle.get('x')/RATIO,
    y : aiPaddle.get('y')/RATIO
  });


};
puck.ref('x').on(updateAI);


Thing.trait('dom.binding', function(proto) {
  proto.init.push(function(obj, options) {
    var el = obj.el = options.el;
    options.target.on(function(value) {
      // TODO: don't hardcode zero padding
      if (value < 10) {
        value = "0" + value;
      }
      el.innerHTML = value;
    });
  });
});

var DOMValue = Thing.class(['dom.binding']);


Thing.trait('pong.physics.world', ['game.scene'], function(proto) {
  proto.init.push(function(obj, options) {
    options.gravity = options.gravity || { x : 0, y : 0};
    var gravity = new b2Vec2(options.gravity.x || 0, options.gravity.y || 0);

    // TODO: externalize gravity with Thing.Value
    Box2D.Common.b2Settings.b2_velocityThreshold = 0;
    obj.set('world', new b2World(gravity, true));
    if (obj.get('children')) {
      obj.ref('children').on(function(node) {
        obj.addBody(node);
      })
    }

    var debugDraw = new Box2D.Dynamics.b2DebugDraw;

    debugDraw.SetSprite(ctx);
    debugDraw.SetDrawScale(RATIO);
    debugDraw.SetFillAlpha(0.1);
    debugDraw.SetLineThickness(5.0);
    debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);

    obj.get('world').SetDebugDraw(debugDraw);
    obj.set('contactListener', new b2ContactListener());

    obj.set('contacts', Thing.createCollection([]));

    obj.get('contactListener').BeginContact = function(contact) {
      obj.ref('contacts').add({
        a : contact.GetFixtureA().GetBody().thing,
        b : contact.GetFixtureB().GetBody().thing
      });
    };

    obj.get('contactListener').EndContact = function(contact) {
      var thingA = contact.GetFixtureA().GetBody().thing,
          thingB = contact.GetFixtureB().GetBody().thing;
      obj.ref('contacts').filter(function(item) {
        if (item.a === thingA && item.b === thingB) {
          return false;
        }
        return true;
      });
    };

    obj.get('world').SetContactListener(obj.get('contactListener'));
    obj.set('collisionActions', Thing.createCollection([]));

    obj.ref('contacts').on(function() {
      obj.ref('collisionActions').each(function(action) {
        action.test(obj.get('contacts'));
      });
    });


    obj.get('whenActions').prototype.init.push(function(actions) {

      obj.ref('collisionActions').add(actions);
      actions.addStep('collidesWith', function() {
        var args = Array.prototype.slice.call(arguments,0);

        var
        current = args.length,
        source = actions.get('source'),
        sourceId = source.meta('id').value,
        cache = {};

        while (current--) {
          cache[args[current].meta('id').value] = true;
        }

        actions.ref('conditions').add(function() {
          var found = false;
          obj.ref('contacts').each(function(contact) {
            if (contact.handled) { return; }

            if (contact.a === source &&
                cache[contact.b.meta('id').value] === true)
            {
              found = contact.b;

            } else if (contact.b === source &&
                       cache[contact.a.meta('id').value] === true)
            {
              found = contact.a;
            }
            contact.handled = true;
            if (found) {
              return false;
            }
          });
          return found;
        });
      });
    });
  });

  proto.tick = function() {
    this.get('world').Step(1/60, 10, 10);
    //if (this.get('debug.physics')) {
      this.get('world').DrawDebugData();
    //}
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
    body.GetBody().thing = node; // backref on the fixture
    node.set('body', body);

  };
});
