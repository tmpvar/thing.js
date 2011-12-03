;(function() {
  var out = {},
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
    has : function(name) {
      return !!this._traits[name];
    },
    add : function(name) {
      if (isArray(name)) {
        var
        current   = name.length,
        registry  = Thing.traits,
        proto     = this._proto,
        trait;

        while(current--) {
          this._traits[name[current]] = true;
          trait = registry[name[current]];
          if (trait) {
            trait(proto);
          }
        }
      } else {
        this._traits[name] = true;
        Thing.traits[name](this._proto);
      }
    },
    remove : function(name) {
      // TODO: what if this is already created?
      delete this._traits[name];
    }
  };

  function Thing() {
    var meta = {};
    this.meta = function(key, value, options) {
      if (key && value) {
        if (meta[key]) {
          if (!meta[key].frozen) {
            meta[key].value = value;
          }
        } else {
          meta[key] = { value : value };
        }

        if (options && options.freeze) {
          meta[key].frozen = true;
        }
        return meta[key].value;
      } else if (meta[key]) {
        return meta[key].value || null;
      }
      return null;
    }
  }

  Thing.prototype = {
    init : []
  };

  out.traits = Thing.traits = {};
  out.class = Thing.class = function(traits) {
    traits = traits || [];
    var fn = function Class(options) {
      Thing.apply(this, arguments);
      var current = this.init.length;
      options = options || {};
      while(current--) {
        this.init[current](this, options);
      }
    };

    fn.prototype = new Thing();
    fn.prototype.init = fn.prototype.init.concat([]);
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
            action(proto);
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
    var Class = out.class(traits);
    return new Class(options);
  };

  if (typeof module !== 'undefined') {
    module.exports = out;
  } else {
    window.Thing = out;
  }
})();
