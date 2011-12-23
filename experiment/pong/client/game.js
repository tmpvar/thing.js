;(function() {
  window.createGame = function() {
    var stats = new Stats();

    // Align top-left
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';
    $('.state.ingame').append(stats.domElement);

    var canvas = document.getElementById('scene');
    var width = 400;
    var height = 600;
    var ctx = window.ctx = canvas.getContext('2d');
    var renderer = Thing.create(['game.renderer.canvas']);
    // TODO: collect the users
    var scene = setupScene({ handle : 'player1' }, { handle : 'player2' });
    // TODO: target should be source
    /*var scoreboard = Thing.create('object', {
      human : new DOMValue({
        target : null,//human.ref('score'),
        el : document.getElementById('human-score')
      }),
      ai : new DOMValue({
        target : null,//ai.ref('score'),
        el :document.getElementById('ai-score')
      })
    });*/


    var keys = {
      39 : false,
      37 : false
    };

    canvas.width = 0;
    canvas.width = width;
    canvas.height = height;
    var render = function render() {
      ctx.fillStyle = 'rgba(0,0,0,.3)';
      ctx.fillRect(0, 0, width, height);

      scene.render(ctx);
      stats.update();
      requestAnimFrame(render);
    };

    setInterval(function() {
      scene.step();
    }, 1000/60);

    setInterval(function() {
      var impulse = 10;
      if (keys[39]) { // right arrow
          playerPaddle.get('body').GetBody().ApplyImpulse({
            x : impulse,
            y : 0
          }, {
            x : playerPaddle.get('x')/RATIO,
            y : playerPaddle.get('y')/RATIO
          });
      }

      if (keys[37]) { // left arrow
        playerPaddle.get('body').GetBody().ApplyImpulse({
          x : -impulse,
          y : 0
        }, {
          x : playerPaddle.get('x')/RATIO,
          y : playerPaddle.get('y')/RATIO
        });
      }
    }, 1000/30);

    render();

    document.addEventListener('keydown', function(e) {

      keys[e.keyCode] = true;
    }, true);
    document.addEventListener('keyup', function(e) {
      keys[e.keyCode] = false;
    }, true);
  };

})();