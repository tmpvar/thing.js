;(function() {
  var toString = Object.prototype.toString, out = {};

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
    var fn = function Class() {
      Thing.apply(this, arguments);
      var current = this.init.length;
      while(current--) {
        this.init[current](this);
      }
    };

    fn.prototype = new Thing();
    fn.prototype.init = fn.prototype.init.concat([]);

    var
    current   = traits.length,
    registry  = Thing.traits,
    proto     = fn.prototype,
    trait;

    while(current--) {
      trait = registry[traits[current]];
      if (trait) {
        trait(proto);
      }
    }

    return fn;
  };

  out.trait = Thing.trait = function(name, action) {
    var traits = Thing.traits;
    if (!action) {
      return traits[name] || null;
    } else {
      traits[name] = function(proto) {
        if (toString.call(action) == '[object Function]') {
          action(proto);
        } else {
          for (var key in action) {
            proto[key] = action[key];
          }
        }
      };
    }
  };

  if (typeof module !== 'undefined') {
    module.exports = out;
  } else {
    window.Thing = out;
  }
})();
