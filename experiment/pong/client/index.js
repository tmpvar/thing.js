$(function() {


    twttr.anywhere(function (T) {
      if (!T.isConnected()) {
        $('.state.registration').show();
        T("#login").connectButton({
          size: "large",
          authComplete: function(user) {
            $('.state.registration').hide();
            createLobby(user);
          }
        });
      } else {
        createLobby(T.currentUser);
      }
    });

    function joinRoom(room) {
      var name = window.location.protocol + "//" + window.location.host + room;
      console.log('joining', name);
      return io.connect(name);
    }


    function createLobby(currentUser) {
      var ctx = $('.state.lobby');
      ctx.find('.connecting').show();
      ctx.find('.connected').hide();
      ctx.show();

      ctx.find('.currentUser .avatar').attr('src', currentUser.profileImageUrl);
      ctx.find('.currentUser .handle').text(currentUser.screenName);

      var lobby = joinRoom('/lobby');
      lobby.on('connect', function(conn) {
        lobby.emit('joined', {
          avatar : currentUser.profileImageUrl,
          handle : currentUser.screenName,
        });

        ctx.find('.chatInput').focus().keydown(function(e) {

          var val = $(this).val();

          if (e.keyCode === 13 && val !== '') {
            lobby.emit('msg', {
              avatar : currentUser.profileImageUrl,
              handle : currentUser.screenName,
              text : val
            });
            $(this).val('');
          }
        });

        ctx.find('.connecting').hide();
        ctx.find('.connected').show();

        var template =  $('ul.chat .template');
        lobby.on('msg', function(msg) {
          addMessage(msg);
        });

        function addMessage(msg) {
          var next = template.clone();
          next.attr('id', msg.id);

          next.find('.avatar').attr('src', msg.avatar).attr('alt', msg.handle);
          switch (msg.type) {
            case 'join':
              next.find('.message').text('has joined the lobby');
              if (msg.handle === currentUser.screenName) {
                next.find('.challenge').remove();
              }
              next.addClass('join');
            break

            case 'leave':
              next.find('.message').text('has left the lobby');
              next.addClass('leave');
            break;

            case 'message':
              next.find('.message').text(msg.text);
              if (msg.handle === currentUser.screenName) {
                next.find('.challenge').remove();
              }
            break;

            case 'challenge':
              if (msg.handle2 === currentUser.screenName) {
                next.find('.message').text('has challenged you!');
                next.find('.message').append('<a href="#" class="accept">accept</a>');
              } else {
                next.find('.message').html('has challenged <img src="' + msg.avatar2 + '" />');
              }

              next.find('.challenge').remove();
              next.addClass('leave');
            break;

            case 'accept':
              next.find('.message').html('has accepted <img src="' + msg.avatar2 + '" /> \'s challenge!');
              next.find('.challenge').remove();
              next.addClass('leave');
            break;

          }

          $('ul.chat').append(next);
          next.removeClass('template');
          $('ul.chat')[0].scrollTop = $('ul.chat')[0].scrollHeight;
        }

        $('.challenge').live('click', function(e) {
          e.preventDefault();

          var target = $(this).parent().find('img').attr('alt');
          if (target === currentUser.screenName) {
            return false;
          }

          lobby.emit('msg', {
            type : 'challenge',
            avatar : currentUser.profileImageUrl,
            handle : currentUser.screenName,
            handle2 : target,
            avatar2 : $(this).parent().find('img').attr('src')
          });
          return false;
        });

        $('.accept').live('click', function(e) {
          e.preventDefault();

          lobby.emit('msg', {
            type : 'accept',
            avatar : currentUser.profileImageUrl,
            handle : currentUser.screenName,
            handle2 : $(this).parents('li').find('img').attr('alt'),
            avatar2 : $(this).parents('li').find('img').attr('src')
          });
          return false;
        });

        lobby.on('joined', function(msg) {
          addMessage(msg);
          //addUser(msg);
        });


        lobby.on('history', function(data) {
          var
          messages = data.messages,
          current = messages.length,
          message;
          while(current--) {
            message = messages[current];
            if ($('#' + message.id).length === 0) {
              addMessage(message);
            }
          }
        });

        lobby.on('game.created', function(room) {
          var game = joinRoom(room);


          game.on('connect', function(conn) {
            $('.state').hide();
            $('.state.ingame').show();
            createGame()

          });

          game.on('disconnect', function() {
            // kill off the game
            $('.state').hide();
            $('.state.lobby').show();
          });


        });
      });
    }
});