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
      })
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

var tests = {

  'trait creation' : function(t) {
    Thing.trait('test_trait', function() {});
    t.ok(Thing.traits.test_trait, 'test trait exists');
    t.done();
  },

  'composite traits' : function(t) {
    Thing.trait('child', {
      child : true
    });

    Thing.trait('child2', {
      child2 : true
    });

    Thing.trait('parent', ['child', 'child2'], {
      parent : true
    });

    var Parent = Thing.class(['parent']);
    var p = new Parent();
    t.ok(p.child, 'child trait was applied');
    t.ok(p.child2, 'child2 trait was applied');
    t.ok(p.parent, 'parent trait was applied');
    t.done();
  },

  'basic thing creation' : function(t) {
    var baseThing = Thing.create();
    t.ok(baseThing.meta, 'this is an empty thing');
    t.done();
  },

  'thing creation with traits' : function(t) {
    Thing.trait('first', { first : true });
    Thing.trait('second', { second : true });
    var instance = Thing.create(['first', 'second']);

    t.ok(instance.first, 'first trait was applied');
    t.ok(instance.second, 'second trait was applied');
    t.done();
  },

  'expose traits on class' : function(t) {
    Thing.trait('a trait', {});
    var Class = Thing.class(['a trait']);
    t.ok(Class.traits.has('a trait'), 'it has a trait');
    t.done()
  },

  'init list should be unique to classes of objects' : function(t) {
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

    var Both = Thing.class(['first', 'second']);
    var First = Thing.class(['first']);
    var Second = Thing.class(['second']);

    var both = new Both();
    t.ok(both.first && both.second, 'should contain both first and second properties');

    var first = new First();
    t.ok(first.first, 'first has first');
    t.ok(!first.second, 'first does not have second');

    var second = new Second();
    t.ok(!second.first, 'second does not have first');
    t.ok(second.second, 'second has second');
    t.done();

  },

  'thing initialization' : function(t) {
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
    t.ok(thing.options.a, 'options should be appended');
    t.ok(thing.b, 'b should be appended');
    t.done();
  },

  'remove traits before creation' : function(t) {
    Thing.trait('trait', {});
    var Class = Thing.class(['trait']);
    t.ok(Class.traits.has('trait'), 'it has a trait');
    Class.traits.remove('trait');
    t.equals(Class.traits.has('trait'), false, 'it no longer has a trait');
    t.done();
  },

  'class extension' : function(t) {
    Thing.trait('base', { base : true });
    Thing.trait('extension', { extension : true });

    var Class = Thing.class(['base']);
    Class.traits.add('extension');

    var instance = new Class();
    t.ok(instance.base, 'base was defined');
    t.ok(instance.extension, 'extension was defined');

    t.done();
  },

  'class creation' : function(t) {
    Thing.trait('hello', {
      hello : function() { return 'world'; }
    });

    Thing.trait('bye', function(proto) {
      proto.bye = true;
    });

    var Hello = Thing.class(['hello', 'bye']);
    var instance = new Hello();
    t.equals(instance.hello(), 'world');
    t.equals(instance.bye, true);
    t.done();
  },

  'metadata' : function(t) {
    var Obj = Thing.class();
    var obj = new Obj();

    t.equals(obj.meta('a', 1), 1);
    t.equals(obj.meta('a'), 1);

    t.done();
  },

  'metadata locking' : function(t) {
    var Obj = Thing.class();
    var obj = new Obj();

    t.equals(obj.meta('a', 1, { freeze : true }), 1);
    t.equals(obj.meta('a', 2), 1);
    t.equals(obj.meta('a'), 1);

    t.done();
  }
};
