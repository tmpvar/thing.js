// TODO:
//  Async synchronization
//  Set a property equal to an entity and special case getter/setter access
//  Keep a record of where data came from

// Getter stuff
//  object.get('key')
//  object.get(['a','b','c','d']).toJSON([shallow=false])
//  object.toJSON() // returns an object suitable for JSON.stringify

// Setter stuff
//  object.set('key', 'value')
//  object.set({ key : 'value' })
//  object.set({ key : 'value'}, function() { })
//  object.set('key', 'value', { silent : true, source : this }, function() {});
//  object.set({
//    values : {
//      key : 'value'
//    },
//    silent : true,
//    source : this,
//    done : function() {}
//  });

;(function(ns) {
  var
  uid = 0,
  store = {};

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

    set : function(key, value, options) {
      options = options || {};

      var
      loc = store[this._uid],
      values = loc.values,
      time = this.time(),
      old;

      if (typeof values[key] === 'undefined') {
        values[key] = {
          value : value,
          meta : {
            created : time,
            modified : time
          }
        };
      } else if (values[key].set && typeof values[key].set === 'function') {
        values[key].set(value, options);
      } else {
        old = values[key].value;
        values[key].value = value;
        values[key].meta.modified = time;
      }

      this.notify('set', {
        key : key,
        old : old,
        val : value
      });

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
