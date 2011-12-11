var Thing = require('../');

Thing.trait('getter setter', function(proto) {
  proto._store = {};

  proto.set = function set(k, v) {
    if (this._store[k] && typeof this._store[k].set === 'function') {
      this._store[k].set(v);
    } else {
      this._store[k] = v;
    }
  };

  proto.get = function get(k) {
    return  this._store[k] || null;
  };
});

Thing.trait('value.stream', function(proto) {
  proto.init.push(function(obj, options) {
    obj._observers = [];
    obj.current = options.current || null

    if (options.update) {
      obj.update = options.update;
      obj.update();
    }
  });

  proto.on = function(fn) {
    this._observers.push(fn);
  };

  proto.set = function(value) {
    // TODO: keep a history
    this.current = value;
    for (var i=0, l=this._observers.length; i<l; i++) {
      this._observers[i]();
    }
  };

  proto.resolve = function(obj, slotName, returnObject) {
    var slot = obj.get(slotName);
    var that = this;
    slot.on(function() {
      that.update();
    });
    return (returnObject) ? slot : slot.current;
  };

  proto.get = function() {
    return this.current;
  }
});

var Value = Thing.class(['value.stream']);

Thing.trait('rectangle', ['getter setter'], function(proto) {
  proto.init.push(function(obj) {
    obj.set('width', new Value({ current : 0 }));
    obj.set('height', new Value({ current : 0 }));
    obj.set('area', new Value({
      update : function() {
        this.set(this.resolve(obj, 'width') * this.resolve(obj, 'height'));
      },
      current : 0
    }));
  });
});

var e = Thing.create(['rectangle']);
console.log('get height', e.get('height'))

console.log(e.get('area').current); // 0

e.set('width', 10);
e.set('height', 20);

console.log(e.get('area').current); // 200
