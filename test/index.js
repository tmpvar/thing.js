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

  'thing initialization' : function(t) {
    Thing.trait('trait1', function(proto) {
      proto.init.push(function(obj, options) {
        obj.options = options
      });
    });

    Thing.trait('trait2', function(proto) {
      proto.init.push(function(obj, options) {
        obj.b = true;
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

if (typeof module !== 'undefined') {
  var Thing = require('../lib/thing');
  module.exports = tests;
} else {
  window.tests = tests;
}