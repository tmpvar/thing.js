var when = Thing.when;


// TODO: this should live inside of the ai player
/*var updateAI = function() {
  var
  puckX = puck.get('x'),
  puckY = puck.get('y'),
  aiX   = aiPaddle.get('x'),
  aiY   = aiPaddle.get('y'),
  impulse = 40;


  if (puckX < aiX) {
    impulse = -impulse;
  } else if (puckX === aiX) {
    impulse = 0;
  }

  impulse = (Math.abs(puckX-aiX)/400) * impulse * (1-(Math.abs(puckY-aiY)/1200));

  aiPaddle.get('body').GetBody().ApplyImpulse({x: impulse, y: 0 }, {
    x : aiPaddle.get('x')/RATIO,
    y : aiPaddle.get('y')/RATIO
  });


};
puck.ref('x').on(updateAI);
*/


Thing.trait('dom.binding', function(proto) {
  proto.init(function(options) {
    var el = this.el = options.el;
    options.target.on(function(value) {
      // TODO: don't hardcode zero padding
      if (value < 10) {
        value = "0" + value;
      }
      el.innerHTML = value;
    });
  });
});

var DOMValue = Thing.class(['dom.binding']);
