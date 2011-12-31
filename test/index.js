var Thing;
if (typeof window === 'undefined') {
  Thing = require('../lib/thing');
} else {
  thing = window.Thing;
}

function ok(v, msg) {
  if (!v) {
    throw new Error(msg || 'expected "' + v + '" to be truthy');
  }
}

describe('Thing.js', function() {
  describe('utilities', function() {
    describe('toString', function() {
      it('should stringify objects', function() {
        ok(Thing.toString({}) === '[object Object]');
      });
    });

    describe('isArray', function() {
      it('should return true if the incoming is an array', function() {
        ok(Thing.isArray([]));
        ok(Thing.isArray(new Array()));
      });
      it('should return false if the incoming is not an array', function() {
        ok(!Thing.isArray({}));
        ok(!Thing.isArray("hello"));
        ok(!Thing.isArray(1));
      });
    });
  });

  describe('TraitManager', function() {
    var TraitManager = Thing.TraitManager;

    describe('constructor', function() {
      it('should store a reference to a prototype in _proto', function() {
        var p  = {}, tm = new TraitManager(p);
        ok(p === tm._proto);
      });

      it('should populate _traits', function() {
        var tm = new TraitManager({}, ['some', 'traits']);

        ok(tm._traits.some);
        ok(tm._traits.traits);
        ok(!tm._traits.object);
      });
    });

    describe('#has', function() {
      it('should return true if it contains the specified trait', function() {
        var tm = new TraitManager({}, ['bird']);
        ok(tm.has('bird'));
      });

      it('should return true if it contains the specified trait', function() {
        var tm = new TraitManager({}, ['bird']);
        ok(!tm.has('undefined'));
      });
    });

    describe('#add', function() {
      it('should evaluate a trait against the current prototoype', function() {
        Thing.trait('exists', function(proto) {
          proto.executed = true;
        });

        var p = {}, tm = new TraitManager(p);

        tm.add('exists');
        ok(p.executed);
      });

      it('should error if the trait does not exist', function() {
        var p = {}, tm = new TraitManager(p), e;

        try {
          tm.add('non-existant');
        } catch (error) {
          e = error
        }

        ok(e);
        ok(e.message.indexOf('does not exist') > -1);
      });
    });

    describe('#remove', function() {
      Thing.trait('removal-test', function(proto) {
        proto.one = 1;
        proto.two = 2;
      });

      it('should remove members created by the #add function', function() {
        var p = { untouched : true }, tm = new TraitManager(p);
        tm.add('removal-test');

        ok(p.one === 1);
        ok(p.two === 2);

        tm.remove('removal-test');

        ok(!p.one)
        ok(!p.two);
        ok(p.untouched);
      });

      it('should remove (unmodified) members from created objects', function() {
        var A = function() {};

        var tm = new TraitManager(A.prototype);

        tm.add('removal-test');

        var a = new A();
        ok(a.one === 1);
        ok(a.two === 2);

        tm.remove('removal-test');
        ok(!a.one)
        ok(!a.two);
      });
    });
  });

  describe('Thing', function() {
    describe('#trait', function() {
      it('should allow a user to register a trait (function)', function() {
        Thing.trait('test_trait', function() {});
        ok(Thing.traits.test_trait);
      });

      it('should allow a user to register a trait (object)', function() {
        Thing.trait('test_trait2', {});
        ok(Thing.traits.test_trait2);
      });

      it('should not allow a user to register a falsy trait', function() {
        Thing.trait('invalid', false);
        ok(!Thing.traits.invalid);
      });

      it('should be able to define initialization step(s)', function() {
        Thing.trait('trait1', function(proto) {
          proto.init(function(options) {
            this.options = options
          });
        });

        Thing.trait('trait2', function(proto) {
          proto.init(function(options) {
            this.b = true;
          });
        });

        var thing = Thing.create(['trait1', 'trait2'], { a : true });
        ok(thing.options.a, 'options should be appended');
        ok(thing.b, 'b should be appended');
      });

      it('should copy the initialization list so classes do not step on each other', function() {
        Thing.trait('first', function(proto) {
          proto.init(function() {
            this.first = true;
          });
        });

        Thing.trait('second', function(proto) {
          proto.init(function() {
            this.second = true;
          });
        });

        var Both = Thing.createClass(['first', 'second']);
        var First = Thing.createClass(['first']);
        var Second = Thing.createClass(['second']);

        var both = new Both();
        ok(both.first && both.second, 'should contain both first and second properties');

        var first = new First();
        ok(first.first, 'first has first');
        ok(!first.second, 'first does not have second');

        var second = new Second();
        ok(!second.first, 'second does not have first');
        ok(second.second, 'second has second');
      });
    });

    describe('#create', function() {
      it('should create things with traits', function() {
        Thing.trait('first', { first : true });
        Thing.trait('second', { second : true });
        var instance = Thing.create(['first', 'second']);

        ok(instance.first, 'first trait was applied');
        ok(instance.second, 'second trait was applied');
      })
    });

    describe('#createClass', function() {
      it('should create a ctor+prototype that contains expected traits', function() {
        Thing.trait('create-class-test', function(proto) {
          proto.createClassTest = true;
        });

        var p = Thing.createClass(['create-class-test']);
        ok(p.prototype.createClassTest);
      });

      it('should handle composite traits like a boss', function() {
        Thing.trait('child', {
          child : true
        });

        Thing.trait('child2', {
          child2 : true
        });

        Thing.trait('parent', ['child', 'child2'], {
          parent : true
        });

        var Parent = Thing.createClass(['parent']);
        var p = new Parent();
        ok(p.child, 'child trait was applied');
        ok(p.child2, 'child2 trait was applied');
        ok(p.parent, 'parent trait was applied');
      });

      it('should instantiate and expose a traits manager on the class', function() {
        Thing.trait('a trait', {});
        var Class = Thing.createClass(['a trait']);
        ok(Class.traits.has('a trait'), 'it has a trait');
      });

      it('should be extendable via the traits manager', function() {
        Thing.trait('base', { base : true });
        Thing.trait('extension', { extension : true });

        var Class = Thing.createClass(['base']);
        Class.traits.add('extension');

        var instance = new Class();
        ok(instance.base, 'base was defined');
        ok(instance.extension, 'extension was defined');
      });

      it('should be managable via the exposed trait manager', function() {
        Thing.trait('trait', {});
        var Class = Thing.createClass(['trait']);
        ok(Class.traits.has('trait'), 'it has a trait');

        Class.traits.remove('trait');
        ok(Class.traits.has('trait') === false);
      });
    });

    describe('#meta', function() {
      var t;
      beforeEach(function() {
        var Ctor = Thing.createClass();
        t = new Ctor();
      });

      it('should return null when getting a non-existant key', function() {
        ok(null === t.meta('undefined'));
      });

      it('should return the current value when set', function() {
        ok(1 === t.meta('a', 1));
      });

      it('should act as a getter/setter', function() {
        t.meta('a', 1);
        ok(1 === t.meta('a'));
      });

      it('should allow metadata to be frozen', function() {
        t.meta('a', 1, { freeze : true });
        ok(1 === t.meta('a', 2));
        ok(1 === t.meta('a'));
      });
    });

    describe('constructor', function() {
      it('should generate a locally unique id', function() {
        var t = Thing.create(), t2 = Thing.create();
        ok(t.meta('id') < t2.meta('id'));
      });

      it('should accept an id', function() {
        var t = Thing.create([], {
          id : 'abc123'
        });

        ok(t.meta('id') === 'abc123');
      });
    });

    describe('#create', function() {
      it('should create a traitless Things', function() {
        ok(Thing.create().meta);
      });

      it('should apply traits, instiate, and return a new Thing', function() {
        Thing.trait('some-trait', function(proto) {
          proto.used = true
        });

        ok(Thing.create(['some-trait']).used);
      });
    });
  });

  describe('natives', function() {
    describe('Object', function() {

    });

    describe('Value', function() {

    });

    describe('Collection', function() {

    });
  });

  describe('events', function() {

  });
});