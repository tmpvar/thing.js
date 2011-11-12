var
ok = function(a, msg) {
  if (!a) {
    throw new Error(msg);
  }
},
equal = function(a, b, msg) {
  if (a !== b) {
    throw new Error('"' + a + '" !== "' + b + '"\n Expected: ' + msg);
  }
},
less = function(a, b, msg) {
  if (a >= b) {
    throw new Error(msg + ' (' + a + ' is not less than ' + b + ')');
  }
},
fail = function(msg) {
  throw new Error(msg);
},
Entity = (typeof Entity === 'undefined') ?
          require('../').Entity            :
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

  function ensure_setter_argument_config_object(e, f) {
    e.notify = function() {
      fail('notify should not be called when silent:true');
    };

    e.set({
      values : {
        key : 'value'
      },
      silent : true,
      source : 'abc123',
      done : function() {
        ok(e.get('key') === 'value', 'should set as expected');
        ok(e.get('key', 'source') === 'abc123', 'the source of this key should be stored in the metadata');
        f();
      }
    });

    return false;
  },

  function ensure_setter_accepts_multiple_values(e) {
    e.set({ abc : '1', def : 2 });
    equal(e.get('abc'), '1', 'key:abc === value:1');
    equal(e.get('def'), 2, 'key:def === value:2');
  },

  function ensure_setter_calls_back(e, f) {
    e.set('abc', 123, function() {
      equal(e.get('abc'), 123, 'key:abc === value:123');
      f();
    });
    return false;
  },

  function ensure_setter_key_value_options_callback_are_mixedin_properly(e, f) {
    e.notify = function() {
      fail('notify should not be called when silent:true');
    };

    var context = {
      test : 1
    };

    e.set('key', 'value', {
      silent : true,
      source : context,
    }, function() {
      equal(e.get('key', 'source'), context, 'keep a record of where the value came from');
      equal(e.get('key'), 'value', 'ensure the correct value is stored');
      f();
    });
    return false;
  },

  function ensure_getter_returns_null_for_undefined(e) {
    ok(e.get('noop') === null, 'undefined keys are returned as null');
  },

  function ensure_setting_multiple_properties_multiple_times(e) {
    e.set({ a : 1, b: 2 });
    equal(e.get(['a', 'b']).join(','), '1,2', 'both a and b should consist of the appropriate values');

    e.set({ a : 1, b: 2 });
    equal(e.get(['a', 'b']).join(','), '1,2', 'both a and b should consist of the appropriate values');
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
    e.mount(a.address());

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

  function ensure_subscribers_do_not_get_stale_data_on_subsequent_sets(e) {
    e.notify = function(op, event) {
      equal(op, 'set', 'set expected');
      equal(typeof event.old, 'undefined', 'on first set, old should be undefined');
      equal(event.val, 1);
    };

    e.set({ a : 1 });

    e.notify = function(op, event) {
      equal(op, 'set', 'set expected');
      equal(typeof event.old, 'number', 'on first set, old should be undefined');
      equal(event.old, 1, 'on subsequent sets old should contain the previous value');
      equal(event.val, 2, 'on sets the event.val should be the current value');
    };

    e.set({ a : 2 });
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
  },

  function ensure_global_sequence_id_generation_can_be_overriden(e) {

    e.notify = function(op, event) {
      equal(event.sid, 'monkey', 'should be overridable');
    };

    var orig = Entity.nextSequenceId;

    Entity.nextSequenceId = function() {
      return 'monkey';
    };

    e.set({ a : 1 });

    Entity.nextSequenceId = orig;
  },

  function ensure_events_contain_a_unique_sequence_id(e) {

    // by default sids are just incrementing ints
    var current = false;
    e.notify = function(op, event) {
      if (current === false) {
        current = event.sid;
        return;
      }
      equal(event.sid, current+1, 'the next sid should be +1');
    }

    e.set('a', 1);
    e.set('a', 2);
  },

  function ensure_get_supports_an_array_of_keys(e) {
    e.set({
      a : 1,
      b : 2,
      c : 3
    });

    equal(
      e.get(['a','c']).join(','), '1,3',
    'should support collection of multiple properties'
    )

    var times = e.get(['a','b', 'c'], 'created');
    ok(times[0] === times[1] && times[0] === times[2], 'all keys created at the same time');
    ok(times[0] > 0, 'should be numbers by default');
  },

  function ensure_simple_trait_creation() {
    Entity.trait('hello', {
      hello : function() {
        return 'world';
      }
    });

    var e = Entity.create({ traits : ['hello'] });
    equal(e.hello(), 'world', 'traits append properties to the prototype')

    var e2 = new Entity({ traits : ['hello'] });
    equal(e2.hello(), 'world', 'traits append properties to the prototype')
  },

  function ensure_attributes_can_be_calculated() {
    Entity.trait('calculated-attributes', {
      attribute : {
        get : function() {
          return 'hello there: ' + Entity.prototype.get.apply(this, attributes);
        },
        value : ''
      }
    });

    var e = Entity.create({ traits : ['calculated-attributes']});
    e.set('attribute', 'monkey');

    equal(e.get('attribute'), 'hello there: monkey',
      'since attribute has a set method that should be used instead of value directly'
    );

  }
],
failed = 0, passed = 0, keys = Object.keys(specs), i = 0, l = keys.length;

function next() {
  if (i>=l) { return; }

  var test = specs[keys[i]], name = test.name.replace(/_/g, ' '), timeout = null, called = false;
  process.stdout.write(name + ' ... ');
  var done = function(e) {
    clearTimeout(timeout);
    if (!called) {
      called = true;
    } else {
      e = new Error('USER ERROR: done called multiple times in ' + test.name);
    }

    if (e) {
      console.log('FAIL\n\n', e.stack, '\n');
    } else {
      console.log('PASS');
    }
    i++;
    process.nextTick(next);

  };

  try {
    var entity = new Entity();
    if (test(entity, done) !== false) {
      done();
    } else {
      timeout = setTimeout(function() {
        done(new Error(test.name + ' timed out'));
      }, 500);
    }
  } catch (e) {
    done(e);
  }
};

next();
