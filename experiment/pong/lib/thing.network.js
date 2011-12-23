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
var values = [];
var lastValues = {};

Thing.Value.prototype.init(function(options) {
  values.push(this);
});

Thing.trait('object.networked', function(proto) {
  proto.init(function(options) {
    this.set('network.tick.rate', options.tickRate || 1000/30);
  });

  proto.pack = function() {
    var current = values.length, packed = [];
    while(current--) {

      var value = values[current].current;
      var id = values[current].meta('id').value;
      var notransport =  values[current].meta('no transport');
      // TODO: this needs to be rethought
      if (typeof value !== 'object' &&
          (typeof lastValues[id] === 'undefined' || lastValues[id] !== value) &&
          !notransport)
      {
        packed.push({
          id    : id,
          value : value
        });

        lastValues[id] = value;
      }
    }

    return packed;
  };
});
