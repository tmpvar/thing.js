// # Thing.js
// flexible metaobjects with trait driven behavior
// MIT licensed, copyright Elijah Insua <tmpvar@gmail.com> 2011
;(function() {
  // Internal namespace
  // this gets exposed as Thing externally
  var out = {},

  // Each thing has an index, this keeps track of the
  // next thing id
  thingId = 0,

  toString = out.toString = Object.prototype.toString;
  isArray = out.isArray = Array.isArray || function(a) { return a.push && ('length' in a) };

  function TraitManager(proto, traits) {
    traits = traits || [];
    this._proto = proto;
    this._traits = {};

    var current = traits.length || 0;
    while(current--) {
      this._traits[traits[current]] = true;
    }
  }

  TraitManager.prototype = {

    // Determine if this object has a trait
    has : function(name) {
      return !!this._traits[name];
    },

    // Add a trait to the prototype.  `name` can be an array or a string.
    //
    //
    // __note__: if a trait is not found an exception is thrown, potentially
    // in the middle of creation.  Best practice is to stop and fix this before
    // continuing to avoid undefined behavior.
    add : function (name) {
      var registry = Thing.traits;

      if (isArray(name)) {
        var
        current   = name.length,
        proto     = this._proto,
        trait, currentName;

        while(current--) {
          var currentName = name[current];
          if (registry[currentName]) {
            this._traits[currentName] = true;
            registry[currentName](this._proto);
          } else {
            throw new Error('trait "' + name + '" does not exist');
          }
        }
      } else {
        if (registry[name]) {
          this._traits[name] = true;
          registry[name](this._proto);
        } else {
          throw new Error('trait "' + name + '" does not exist');
        }
      }
    },

    // Remove a trait from the prototype.
    remove : function(name) {

      // unregister the incoming trait so
      // new creations and #has will work
      delete this._traits[name];

      // setup a temporary prototype to calculate which
      // members need to be removed
      var tmpproto = {};
      Thing.traits[name](tmpproto);

      // remove the memebers
      for (var i in tmpproto) {
        if (tmpproto.hasOwnProperty(i)) {
          delete this._proto[i];
        }
      }
    }
  };

  // Expose as Thing.TraitManager.  This is mostly for testing purposes.
  out.TraitManager = TraitManager;

  // Constructor for all Thing instances
  function Thing(options) {
    var meta = {};

    // Getter/Setter for Thing metadata
    this.meta = function(key, value, options) {
      // Setter mode
      if (key && value) {
        if (meta[key]) {
          if (!meta[key].frozen) {
            meta[key].value = value;
          }
        } else {
          meta[key] = { value : value };
        }

        // Lock the meta key from future modifications
        if (options && options.freeze) {
          meta[key].frozen = true;
        }

        // Return the current value
        return meta[key].value;

      // Getter mode
      } else if (meta[key]) {
        return meta[key].value || null;
      }

      return null;
    }

    // Allow the incoming options.id to override the id of this Thing
    var id;
    if (options && options.id) {
      id = options.id;
    } else {
      id = thingId++;
    }

    // Every Thing is tagged with an integer id by default.
    this.meta('id', id, {
      freeze : true
    });
  }

  Thing.prototype = {};

  out.traits = Thing.traits = {};
  out.createClass = function(traits) {
    traits = traits || [];
    var fn = function Class(options) {
      Thing.apply(this, arguments);
      var steps = this.init._steps, current = steps.length;
      options = (typeof options === 'undefined') ? {} : options;
      while(current--) {
        steps[current].call(this, options);
      }
    };

    fn.prototype = new Thing();
    fn.prototype.init = function(fn) {
      this.init._steps.push(fn)
    };
    fn.prototype.init._steps = [];

    fn.traits = new TraitManager(fn.prototype, traits);
    fn.traits.add(traits);

    return fn;
  };

  out.trait = Thing.trait = function(name, required, action) {
    if (arguments.length === 2) {
      action = required;
    }

    var traits = Thing.traits;
    if (!action) {
      return traits[name] || null;
    } else {
      if (!isArray(required)) {
        required = [name];
      } else {
        required.push(name);
      }

      traits[name] = function traitWrapper(proto) {
        var current = required.length, trait;
        while (current--) {
          var traitName = required[current];
          trait = traits[traitName];

          if (traitName === name) {
            if (typeof action === 'function') {
              action(proto);
            } else {
              for (var key in action) {
                proto[key] = action[key];
              }
            }
          } else if (typeof trait === 'function') {
            trait(proto);
          } else if (trait) {

            for (var key in trait) {
              proto[key] = trait[key];
            }
          } else {
            throw new Error('Trait (' + traitName + ') not found');
          }
        }
      };
    }
  };

  out.create = function(traits, options) {
    // TODO: consider caching the classes
    var Class = out.createClass(traits);
    return new Class(options);
  };

  out.wrap = function(value) {
    if (value && value.wrapped) {
      return value;
    } else {
      var ret = new (out.Value)(value);
      ret.wrapped = true;
      return ret;
    }
  }

  out.createReference = function(context, key, value) {
    var ret = out.wrap(value);
    ret.meta('owner', context);
    ret.meta('name', key);
    return ret;
  }

  out.trait('object', function(proto) {
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
        this._store[k] = out.createReference(this, k, v);
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
      return out.createReference(this, k, this._store[k]);
    }
  });

  out.Object = out.createClass(['object']);

  out.trait('object.value', function(proto) {
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

  out.Value = out.createClass(['object.value']);


  //
  //
  out.trait('object.collection', ['object.value'], function(proto) {

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

  out.Collection = out.createClass(['object.collection']);

  out.constant = function(val) {
    var ret = out.wrap(val);
    ret.set = function() {};
    return ret;
  };

  if (typeof module !== 'undefined') {
    module.exports = out;
  } else {
    window.Thing = out;
  }
})();
