;(function() {
  var Thing, Box2D;
  if (typeof require !== 'undefined') {
    Thing = require('../../../lib/thing');
    require('./thing.object');
    require('./thing.game');
    Box2D = require('./box2d')
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

  Thing.trait('object.physics.static', function(proto) {
    proto.init(function(options) {
      this.set('type', b2Body.b2_staticBody);
      this.set('density', options.density || 1.0);
      this.set('friction', options.friction || 0);
      this.set('restitution', options.restitution || 0);
      this.set('tick', 0);

      var that = this;
      this._store.tick.on(function() {
        var pos = that.get('body').GetBody().GetPosition();
        that.set('x', pos.x*RATIO, { silent : true });
        that.set('y', pos.y*RATIO, { silent : true });
        that.set('rotation', that.get('body').GetBody().GetAngle(), { silent : true });
      });
    });
  });

  Thing.trait('object.physics.dynamic', function(proto) {
    proto.init(function(options) {
      this.set('type', b2Body.b2_dynamicBody);
      this.set('density', 1);
      this.set('tick', 0);

      var that = this;
      this._store.tick.on(function() {
        var pos = that.get('body').GetBody().GetPosition();
        that.set('x', pos.x*RATIO, { silent : true });
        that.set('y', pos.y*RATIO, { silent : true });
        that.set('rotation', that.get('body').GetBody().GetAngle(), { silent : true });
      });
    });
  });

  Thing.trait('physics.shape.circular', function(proto) {
    proto.init(function() {
      this.set('physicalShape', new b2CircleShape);
      this.get('physicalShape').SetRadius(this.get('width')/Thing.RATIO/2);
    });
  });

  Thing.trait('physics.shape.rectangular', function(proto) {
    proto.init(function() {
      this.set('physicalShape', new b2PolygonShape);
      this.get('physicalShape').SetAsBox(
        this.get('width')/Thing.RATIO/2,
        this.get('height')/Thing.RATIO/2
      );
    });
  });

})();
