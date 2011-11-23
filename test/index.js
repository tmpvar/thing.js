

var tests = {

  'trait creation' : function(t) {
    Thing.trait('test_trait', function() {});
    t.ok(Thing.traits.test_trait, 'test trait exists');
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