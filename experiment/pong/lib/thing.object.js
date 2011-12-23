if (typeof require !== 'undefined') {
  var Thing = require('../../../lib/thing');
}

Thing.wrap = function(value) {
  if (value && value.wrapped) {
    return value;
  } else {
    var ret = new (Thing.Value)(value);
    ret.wrapped = true;
    return ret;
  }
}

Thing.createReference = function(context, key, value) {
  var ret = Thing.wrap(value);
  ret.meta('owner', context);
  return ret;
}

Thing.trait('object', function(proto) {
  proto.init(function(options) {
    this._store = this._store || {};

    // TODO: safety
    for (var key in options) {
      this.set(key, options[key]);
    }
  });

  proto.set = function set(k, v, options) {
    if (!this._store) {
      this._store = {};
    }

    if (!v && isNaN(v)) {
      throw new Error('attempted to set ' + k + ' to NaN!;' + v);
    }

    if (this._store[k] && typeof this._store[k].set === 'function') {
      if (v && v.set && v.current) {
        this._store[k].set(v.current, options);
      } else {
        this._store[k].set(v, options);
      }
    } else {
      this._store[k] = Thing.createReference(this, k, v);
    }
  };

  proto.get = function get(k) {
    if (this._store[k]) {
      var val = this._store[k];
      if (val.get && typeof val.get === 'function') {
        return val.get();
      } else {
        return val;
      }
    } else {
      return null;
    }
  };

  proto.toJSON = function() {
    var ret = {};
    for (var a in this._store) {
      if (this._store.hasOwnProperty(a)) {
        var val = this._store[a];
        if (val && val.toJSON()) {
          ret[a] = val.toJSON();
        } else {
          ret[a] = val;
        }
      }
    }
    return ret;
  },

  proto.reference = proto.ref = function(k) {
    return Thing.createReference(this, k, this._store[k]);
  }
});


Thing.trait('object.value', function(proto) {
  proto.init(function(options) {
    this._observers = [];
    this.current = options

    if (options && options.update) {
      this.update = options.update;
      this.update();
    }
  });

  proto.on = function(fn) {
    this._observers.push(fn);
  };

  proto.notify = function(value) {
    // There is potential here where observers are setup
    // after default values if that is the case, then
    // wait until the next tick before notifying them.
    if (!this._observers) {
      var that = this;
      setTimeout(function() {
        that.notify(value);
      }, 16);
    } else {
      for (var i=0, l=this._observers.length; i<l; i++) {
        this._observers[i](value, this);
      }
    }
  };

  proto.set = function(value, options) {
    this.current = value;
    if (!options || !options.silent) {
      this.notify(value);
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
  };

  proto.toJSON = function() {
    return (this.current && this.current.toJSON) ? this.current.toJSON() : this.current;
  };
});

Thing.Value = Thing.class(['object.value']);

Thing.trait('object.collection', ['object.value'], function(proto) {

  proto.init(function(options) {
    this.meta('contains', {});
  });

  proto.add = function ObjectAdd(obj) {
    this.current.push(obj);
    if (obj && obj.meta) {
      this.meta('contains')[obj.meta('id')] = true;
    }
    this.notify(obj);
  };

  proto.wrapped = true;

  proto.length = function() {
    return this.current.length || 0
  };

  proto.remove = function(obj) {
    var current = this.current.length;
    while(current--) {
      if (this.current[current] === obj) {
        this.current.splice(current, 1);
      }
    }
    delete this.meta('contains')[obj.meta('id')];
    this.notify(obj);
  };

  proto.filter = function (fn) {
    var current = this.current.length;
    while(current--) {
      if (!fn(this.current[current])) {
        this.current.splice(current, 1);
      }
    }
  };

  proto.each = function(fn) {
    var i = 0, l=this.current.length;
    for (i; i<l; i++) {
      if (fn(this.current[i]) === false) {
        break;
      }
    }
  };

  proto.intersect = function(collection) {
    console.log('contains', this.meta('contains'));
  };
});

Thing.Collection = Thing.class(['object.collection']);
Thing.createCollection = function(array) {
  return new (Thing.Collection)(array);
};

Thing.constant = function(val) {
  var ret = Thing.wrap(val);
  ret.set = function() {};
  return ret;
};