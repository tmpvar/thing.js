(function() {
  var Value = Thing.Value;

  Thing.trait('game.node', ['object'], function(proto) {
    proto.init.push(function(obj, options) {
      obj.set('x', Thing.wrap(options.x || 0));
      obj.set('y', Thing.wrap(options.y || 0));
      obj.set('parent', Thing.wrap(options.parent || null));
      // TODO: create an array value
      obj.set('children', Thing.createCollection(options.children || []));
    });

    proto.add = function(node) {
      this.ref('children').add(node);
    };

  });


  Thing.trait('game.solid', ['game.node'], function(proto) {
    proto.init.push(function(obj, options) {
      obj.set('width', Thing.wrap(options.width || 0));
      obj.set('height', Thing.wrap(options.height || 0));
    });
  });

  Thing.trait('game.actor', ['object'], function(proto) {
    proto.init.push(function(obj) {
      obj.set('score', 0);
    })
  });

  Thing.trait('game.box2d.node', ['game.solid'], function() {

  });

  Thing.trait('game.camera', ['object'], function() {

  });

  Thing.trait(['logic.chain'], function(proto) {
    proto.init.push(function(obj) {
      obj.set('conditions', Thing.createCollection([]));
      obj.set('reaction', Thing.createCollection([]));
    });

    proto.addStep = function(name, fn) {
      var that = this;
      this[name] = function() {
        fn.apply(this, arguments);
        return that;
      }
    };

    proto.then = function(fn) {
      this.get('reaction').push(fn);
    }

    proto.test = function() {
      var ok = false;

      this.ref('conditions').each(function(condition) {
        // TODO: the way the conditional works here may be wrong
        //       basically it's a logical OR, when infact it should
        //       be a logical AND.  Unfortunately we need a way
        //       to pass the result into the reaction below
        var ret = condition();
        if (ret) {
          ok = ret;
          return false;
        }
      });

      if (ok) {
        this.ref('reaction').each(function(reaction) {
          reaction(ok);
        });
      }
    }
  });

  Thing.trait('game.scene', ['game.node'], function(proto) {
    proto.init.push(function(obj, options) {
      // TODO: allow the logic chain instance to be extended
      //       via options
      obj.set('whenActions', Thing.class(['object', 'logic.chain']));
    });

    proto.render = function(ctx) {
      var nodes = this.get('children'), l = nodes.length, i=0;
      var now = Date.now();
      for (i; i<l; i++) {
        if (nodes[i].render) {
          nodes[i].set('tick', now);
          nodes[i].render(ctx);
        }
      }
    };

    proto.when = function(chainSource) {
      var ret = new (this.get('whenActions'))();;
      ret.set('source', chainSource);
      return ret;
    };
  });
})();