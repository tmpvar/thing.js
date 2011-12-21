if (typeof require !== 'undefined') {
  var Thing = require('../../../lib/thing');
  require('./thing.object');
  require('./thing.game');
  require('./thing.physical');
  require('./thing.network');
  var Box2D = require('./box2d')
} else {
  Thing = window.Thing;
  Box2D = window.Box2D;
}

var times = [];
var values = {};

Thing.Value.prototype.init(function(options) {
  console.log(this.meta('id').value);

  var _set = this.set;
  this.set = function(k, v, options) {

    return _set.apply(this, arguments);
  };

});

Thing.trait('object.networked', function(proto) {
  proto.init(function(options) {
    this.set('network.tick.rate', options.tickRate || 1000/30);


  });
});
