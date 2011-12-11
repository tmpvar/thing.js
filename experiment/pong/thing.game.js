(function() {
  var Value = Thing.Value;

  Thing.trait('game.node', ['object'], function(proto) {
    proto.init.push(function(obj, options) {
      obj.set('x', Thing.wrap(options.x || 0));
      obj.set('y', Thing.wrap(options.y || 0));
      obj.set('parent', Thing.wrap(options.parent || null));
      // TODO: create an array value
      obj.set('children', Thing.wrap(options.children || []));
    });

    proto.add = function(node) {
      this.get('children').push(node);
      this._store.children.notify(node);
    };

  });


  Thing.trait('game.solid', ['game.node'], function(proto) {
    proto.init.push(function(obj, options) {
      obj.set('width', Thing.wrap(options.width || 0));
      obj.set('height', Thing.wrap(options.height || 0));
    });
  });

  Thing.trait('game.actor', ['object'], function() {

  });

  Thing.trait('game.box2d.node', ['game.solid'], function() {

  });

  Thing.trait('game.camera', ['object'], function() {

  });

  Thing.trait('game.scene', ['game.node'], function(proto) {
    proto.render = function(ctx) {
      var nodes = this.get('children'), l = nodes.length, i=0;
      var now = Date.now();
      for (i; i<l; i++) {
        if (nodes[i].render) {
          nodes[i].set('tick', now);
          nodes[i].render(ctx);
        }
      }
    }
  });

})();