;(function() {
  var Thing, Box2D;
  if (typeof require !== 'undefined') {
    var Thing = require('../../../lib/thing');
    require('./thing.object');
    require('./thing.game');
    require('./thing.physical');
    require('./thing.network');
    var Box2D = require('./box2d')
  } else {
    Thing = window.Thing;
    Box2D = window.Box2D;
  }

  var Value = Thing.Value;
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

  Thing.trait('pong.physics.object', ['game.solid'], function(proto) {
    proto.collidesWith = function() {
      return {
        then : function() {}
      }
    };
  });

  Thing.trait('pong.puck', [
    'pong.physics.object',
    'game.solid.circular',
    'physics.shape.circular',
    'object.physics.static'
  ], function(proto) {
    proto.init(function(options) {
      this.set('body', null);
      var that = this;
      this.ref('body').on(function() {
        that.get('body').GetBody().SetFixedRotation(true);
        that.get('body').GetBody().SetBullet(true);
        that.get('body').GetBody().SetLinearDamping(25.0);
      });

    });

    proto.impulse = function(x, y) {
      this.get('body').GetBody().ApplyImpulse({ x : x, y : y}, {
        x : this.get('x')/Thing.RATIO,
        y : this.get('y')/Thing.RATIO
      });
    }
  });

  Thing.trait('pong.physics.world', ['game.scene'], function(proto) {
    proto.init(function(options) {
      options.gravity = options.gravity || { x : 0, y : 0};
      var gravity = new b2Vec2(options.gravity.x || 0, options.gravity.y || 0);
      var that = this;
      // TODO: externalize gravity with Thing.Value
      Box2D.Common.b2Settings.b2_velocityThreshold = 0;
      this.set('world', new b2World(gravity, true));
      if (this.get('children')) {
        this.ref('children').on(function(node) {
          that.addBody(node);
        });
      }

      this.set('contactListener', new b2ContactListener());

      this.set('contacts', Thing.createCollection([]));

      this.get('contactListener').BeginContact = function(contact) {
        that.ref('contacts').add({
          a : contact.GetFixtureA().GetBody().thing,
          b : contact.GetFixtureB().GetBody().thing
        });
      };

      this.get('contactListener').EndContact = function(contact) {
        var thingA = contact.GetFixtureA().GetBody().thing,
            thingB = contact.GetFixtureB().GetBody().thing;

        that.ref('contacts').filter(function(item) {
          if (item.a === thingA && item.b === thingB) {
            return false;
          }
          return true;
        });
      };

      this.get('world').SetContactListener(this.get('contactListener'));
      this.set('collisionActions', Thing.createCollection([]));

      this.ref('contacts').on(function() {
        that.ref('collisionActions').each(function(action) {
          action.test(that.get('contacts'));
        });
      });


      this.get('whenActions').prototype.init(function(actions) {
        var actions = this;
        that.ref('collisionActions').add(actions);
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
            that.ref('contacts').each(function(contact) {
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
    };

    proto.addBody = function(node) {
      var fixDef = new b2FixtureDef;
      fixDef.density = node.get('density');
      fixDef.friction = node.get('friction') || 0;
      fixDef.restitution = node.get('restitution') || 0;

      var bodyDef = new b2BodyDef;
      bodyDef.type = node.get('type') || b2Body.b2_dynamicBody;
      fixDef.shape = node.get('physicalShape');

      bodyDef.position.Set(node.get('x')/Thing.RATIO, node.get('y')/Thing.RATIO);
      var body = this.get('world').CreateBody(bodyDef).CreateFixture(fixDef);
      body.GetBody().SetAngle(0);
      body.GetBody().thing = node; // backref on the fixture
      node.set('body', body);
    };
  });

  Thing.trait('pong.scene', ['game.scene', 'pong.physics.world'], function(proto) {
    proto.init(function(options) {
      this.add(options.player1.get('paddle'));
      this.add(options.player2.get('paddle'));

      var puck = new Puck({
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
        density : 1
      });


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

      this.add(puck);
      this.add(topw);
      this.add(leftw);
      this.add(rightw);
      this.add(bottomw);

      bottomw.set('player', options.player2);
      topw.set('player', options.player1);

      // Scorekeeping
      // TODO: link to scoreboard object
      this.when(puck).collidesWith(bottomw, topw).then(function(wall) {
        var score = wall.get('player').get('score') + 1;
        wall.get('player').set('score', score);

        var body = puck.get('body').GetBody();
        setTimeout(function() {
          body.ResetMassData();
          body.SetLinearVelocity({ x : 0, y : 0 });
          body.SetAngularVelocity(0);
          body.SetPosition({ x : (width/2)/Thing.RATIO, y : (height/2)/Thing.RATIO });
          var impulse = puckImpulse;
          // Refactor this for use with 2 players!
          if (wall.get('player').get('name') === 'human') {
            impulse = -impulse;
          }
          body.ApplyImpulse({x:0, y: impulse }, {
            x : puck.get('x')/Thing.RATIO,
            y : puck.get('y')/Thing.RATIO
          });
        }, 10);

        if (score > 14) {
          // TODO: end the game
        }
      });
    });
  });

  var Paddle = Thing.class([
    'game.solid.rectangular',
    'physics.shape.rectangular'
  ]);

  var Scene = Thing.class(['pong.scene']);
  var Wall = Thing.class([
    'pong.physics.object',
    'game.solid.rectangular',
    'physics.shape.rectangular',
    'object.physics.static'
  ]);
  var Player = Thing.class(['game.actor']);
  var Puck = Thing.class(['pong.puck', 'physics.shape.circular']);

  if (typeof module !== 'undefined') {
    module.exports = {
      Scene  : Scene,
      Paddle : Paddle,
      Wall   : Wall,
      Player : Player
    };

  // Expose to the window directly
  } else {
    window.Scene = Scene;
  }
})();