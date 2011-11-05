// TODO:
//  Async synchronization
//  Set a property equal to an entity and special case getter/setter access
//  Keep a record of where data came from

// Getter stuff
//  object.get('key')
//  object.get(['a','b','c','d']).toJSON([shallow=false])
//  object.toJSON() // returns an object suitable for JSON.stringify


;(function(ns) {
  var
  uid = 0,
  store = {},
  toString = Object.prototype.toString,
  extend = function(a, b) {
    for (var key in b) {
      a[key] = b[key];
    }
  },
  isString = function(a) {
    return toString.call(a) == '[object String]';
  },

  compactArray = function(array) {
    var v, ret = [];
    for (var k in array) {
      v = array[k];
      if (k >= 0 && typeof v !== 'undefined') {
        ret.push(v);
      }
    }
    return ret;
  };

  ns.Entity = function Entity(options) {
    if (!(this instanceof Entity)) {
      return new Entity(options);
    }
    uid += 1;
    this._uid = uid;
    this._options = options || {};

    if (!store[uid]) {
      store[uid] = {
        values  : {},
        meta    : {}
      };
    }

    if (this.init) {
      this.init();
    }

    this.time = this.time || this._options.time || Date.now;
    this.notifyOnSet = this._options.notifyOnSet || false;
    this.notifyOnGet = this._options.notifyOnGet || false;

    return this;
  };

  ns.Entity.prototype = {
    init      : false,
    notify    : function nop(){},

    meta : function(key, value, options) {
      var meta = store[this._uid].meta;

      // setter
      if (arguments.length === 2) {
        meta[key] = value;
        this.notify('meta.set', {
          key : key,
          val : val
        });

      // getter
      } else if (this.notifyOnGet) {
        this.notify('meta.get', {
          key : key,
          val : value
        });
      }

      return meta[key];
    },

    set : function(key, value, options, callback) {
      var l = arguments.length, args, event;

      // set(options), skip the following
      if (l > 1) {
        args = compactArray([key, value, options, callback]);
        event = {
          values : {}
        };
        l = args.length;

        // set(key, value, options, function() {})
        if (l === 4) {
          event = options;
          event.values = { key : value };
          event.done = callback;

        // set(key, value, function(){})
        // set({ key : value }, options, function() {})
        } else if (l === 3) {

          if (typeof options === 'function') {
            event.done = options
          } else {
            event = options;
          }

          if (isString(key)) {
            event.values[key] = value;
          } else {
            event.values = key;
          }

        // set(key, value)
        // set({ key : value }, options)
        // set({ key : value }, function(){})
        } else if (l == 2) {
          if (typeof options === 'function') {
            event.done = options;
          } else if (options) {
            event = options;
          }

          if (isString(key)) {
            event.values[key] = value;
          } else {
            event.values = key;
          }
        }

      // set({ key : value })
      } else if (!key.values) {
        event = {};
        event.values = key;
      } else {
        event = key;
      }

      var
      loc = store[this._uid],
      values = loc.values,
      time = this.time(),
      incoming = event.values,
      incomingValue,
      old;

      for (var incomingKey in incoming) {
        incomingValue = incoming[incomingKey];
        if (typeof values[incomingKey] === 'undefined') {
          values[incomingKey] = {
            value : incomingValue,
            meta : {
              created : time,
              modified : time,
              source : event.source || null
            }
          };
        } else if (values[incomingKey].set &&
                   typeof values[incomingKey].set === 'function')
        {
          values[incomingKey].set(incomingValue, options);
        } else {
          old = values[incomingKey].value;
          values[incomingKey].value = value;
          values[incomingKey].meta.modified = time;
        }

        if (!event.silent) {
          this.notify('set', {
            key : key,
            old : old,
            val : value
          });
        }
      }



      if (event.done) {
        process.nextTick(event.done);
      }

      return this;
    },

    get : function(key, metakey) {
      var
      slot = store[this._uid].values[key],
      ret = null;

      if (slot) {
        if (metakey) {
          ret = slot.meta[metakey];

        } else if (slot.get && typeof slot.get === 'function') {
          ret = slot.get();

        } else {
          ret = slot.value;
        }
      }

      if (this._options.notifyOnGet) {
        this.notify('get', {
          key : key,
          value : ret
        });
      }

      return ret;
    },
    address : function() {
      return {
        uid : this._uid
      };
    },
    mount : function(address) {
      this._uid = address.uid;
    }
  };

}(typeof module === 'undefined' ? window : module.exports));
