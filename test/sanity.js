var
ok = function(a, msg) {
  if (!a) {
    throw new Error(msg);
  }
},
Entity = (typeof Entity === 'undefined') ?
          require('../')            :
          Entity,

specs = [
  function sanity(){
    var e = new Entity(), f = Entity();
    ok(e instanceof Entity, 'e is an instance of Entity');
    ok(f instanceof Entity, 'f is an instance of Entity');
    ok(f._uid !== e._uid, 'e and f do not share a uid');
  },

  function ensure_getter_setter_works(e) {
    e.set('a', 123);
    ok(e.get('a') === 123, 'retain value');
  },

  function ensure_setter_sets_created_metadata(e) {
    e.set('a', 123);

    ok(
      e.get('a', 'created') === e.get('a', 'modified'),
      'expect the same date on creation'
    )
  },

  function ensure_getter_returns_null_for_undefined(e) {
    ok(e.get('noop') === null, 'undefined keys are returned as null');
  },

  function ensure_setter_sets_modified_metadata(e, f) {
    e.set('a', 123);

    setTimeout(function() {
      e.set('a', 1234);
      ok(
        e.get('a', 'created') < e.get('a', 'modified'),
        'expect a modified date to change on update'
      );
      f();
    }, 200);

    return false;
  },

  function ensure_the_time_function_is_configurable(nop, f) {
    var e = Entity({
      time : function() {
        return -1;
      }
    });

    e.set('a', 123);
    ok(e.get('a', 'created') === -1, 'use the overriden time function');
  },


  function ensure_entities_can_jump_data_slots(e) {
    var a  = Entity();
    a.set('a', 123);
    e.set('b', 'test');

    var eAddress = e.address();
    e.point(a.address());

    ok(e.get('a') === a.get('a'), 'e is pointing at a');
    ok(e.get('b') === null, 'e.b is not defined');
  },

  function ensure_subscribers_are_notified_when_prop_created(e) {
    var called = false
    e.notify = function(type, data) {
      called = true;
      ok(typeof data.old === 'undefined', 'old is undefined');
    };

    e.set('a', 123);
    ok(called, 'notify should have been called');
  },

  function ensure_subscribers_are_notified_when_prop_updated(e) {
    e.set('a', 123);
    var called = false

    e.notify = function(type, data) {
      called = true;
      ok(data.old === 123, 'old is 123');
      ok(data.val === 12, 'new value is 12');
    };

    e.set('a', 12);
    ok(called, 'notify should have been called');
  }


],
failed = 0, passed = 0;

specs.forEach(function(test) {
  var name = test.name.replace(/_/g, ' ');

  var done = function(e) {
    if (e) {
      console.log('FAIL:', name, '(' + e.message + ')', e.stack);
    } else {
      console.log('PASS:', name);
    }
  };

  try {
    var entity = new Entity();
    if (test(entity, done) !== false) {
      done();
    }
  } catch (e) {
    done(e);
  }
});
