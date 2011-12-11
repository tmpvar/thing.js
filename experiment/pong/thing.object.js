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
  return ret;
}

Thing.trait('object', function(proto) {
  proto.init.push(function(obj) {
    obj._store = {};
  });

  proto.set = function set(k, v) {
    if (this._store[k] && typeof this._store[k].set === 'function') {
      if (v.set && v.current) {
        this._store[k].set(v.current);
      } else{
        this._store[k].set(v);
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
        ret[a] = this.get(a);
        // TODO: deep copy
      }
    }
    return ret;
  },

  proto.reference = function(k) {
    return Thing.createReference(this, k, this._store[k]);
  }
});


Thing.trait('object.value', function(proto) {
  proto.init.push(function(obj, options) {
    obj._observers = [];
    obj.current = options

    if (options && options.update) {
      obj.update = options.update;
      obj.update();
    }
  });

  proto.on = function(fn) {
    this._observers.push(fn);
  };

  proto.notify = function(value) {
    for (var i=0, l=this._observers.length; i<l; i++) {
      this._observers[i](value);
    }
  };

  proto.set = function(value) {
    this.current = value;
    this.notify(value);
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

Thing.Value = Thing.class(['object.value']);

Thing.constant = function(val) {
  var ret = Thing.wrap(val);
  ret.set = function() {};
  return ret;
};

Thing.when = function(value) {
  // TODO: enforce CPS
  return value;
}