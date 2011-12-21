;(function() {
  var Thing;
  if (typeof require !== 'undefined') {
    var Thing = require('../../../lib/thing');
  } else {
    Thing = window.Thing;
  }

  Thing.RATIO = 200;
  var Value = Thing.Value;

  if (typeof window !== 'undefined') {
    // shim layer with setTimeout fallback
    window.requestAnimFrame = (function(){
      return  window.requestAnimationFrame       ||
              window.webkitRequestAnimationFrame ||
              window.mozRequestAnimationFrame    ||
              window.oRequestAnimationFrame      ||
              window.msRequestAnimationFrame     ||
              function(/* function */ callback, /* DOMElement */ element){
                window.setTimeout(callback, 1000 / 60);
              };
    })();
  }

  Thing.trait('game.node', ['object'], function(proto) {
    proto.init(function(options) {
      this.set('x', Thing.wrap(options.x || 0));
      this.set('y', Thing.wrap(options.y || 0));
      this.set('parent', Thing.wrap(options.parent || null));
      // TODO: create an array value
      this.set('children', Thing.createCollection(options.children || []));
    });

    proto.add = function SceneAdd(node) {
      this.ref('children').add(node);
    };
  });

  Thing.trait('game.solid', ['game.node'], function(proto) {
    proto.init(function(options) {
      this.set('width', Thing.wrap(options.width || 0));
      this.set('height', Thing.wrap(options.height || 0));
    });
  });

  Thing.trait('game.actor', ['object'], function(proto) {
    proto.init(function(options) {
      this.set('score', 0);
    })
  });

  Thing.trait(['logic.chain'], function(proto) {
    proto.init(function(options) {
      this.set('conditions', Thing.createCollection([]));
      this.set('reaction', Thing.createCollection([]));
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
    proto.init(function(options) {
      // TODO: allow the logic chain instance to be extended
      //       via options
      this.set('whenActions', Thing.class(['object', 'logic.chain']));
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

  Thing.trait('game.solid.rectangular', ['game.renderable'], function(proto) {
    proto.init(function(options) {
      var that = this;
      var w=this.get('width'), h=this.get('height'), whalf=w/2, hhalf=h/2, colorRef = this.ref('color');

      this.ref('width').on(function(v) {
        w = v;
        whalf = Math.round(v/2);
      });

      this.ref('height').on(function(v) {
        h = v;
        hhalf = Math.round(v/2);
      });

      this.get('renderSteps').push(function(ctx) {
        ctx.fillStyle = colorRef.current;
        ctx.fillRect(
          -(whalf), // center on the x
          -(hhalf), // center on the y
          w,
          h
        );
      });
    });
  });

  Thing.trait('game.solid.circular', ['game.renderable'], function(proto) {
    proto.init(function(options) {
      var w = this.get('width');
      var whalf = this.get('width')/2;
      this.ref('width').on(function(v) {
        w = v;
        whalf = Math.round(v/2);
      });
      var PI2 = Math.PI*2;

      this.get('renderSteps').push(function(ctx) {
        ctx.fillStyle = this.get('color');
        ctx.beginPath();
        ctx.arc(
          0, // center on the x
          0, // center on the y
          whalf,
          0,
          PI2,
          true
        );

        ctx.closePath();
        ctx.fill();
      });
    });
  });

  Thing.trait('game.renderable', ['game.solid'], function(proto) {
    proto.init(function(options) {
      this.set('color', options.color || '#FF00FF');
      this.set('renderSteps', []);
    });

    proto.beginRender = function(ctx) {
      ctx.save();
      // TODO: move getting the world center out of here
      var center = this.get('body').GetBody().GetWorldCenter()
      ctx.translate(center.x*Thing.RATIO, center.y*Thing.RATIO);
      ctx.rotate(this.get('rotation') || 0);
    };

    proto.render = function(ctx) {
      this.beginRender(ctx);
      var steps = this.get('renderSteps');

      for (var i=0, l=steps.length; i<l; i++) {
        steps[i].call(this, ctx);
      }

      this.endRender(ctx);
    };

    proto.endRender = function(ctx) {
      ctx.restore();
    }
  });
})();