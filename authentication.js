if( Meteor.isServer ) {

  Meteor.startup(function () {
    Future = Npm.require('fibers/future');

    Meteor.methods({
      'plone.login': function(cookie) {
        
          var future = new Future();
      
      
          var ploneAuthEnabled = RocketChat.settings.get('Allow Plone authentication');

          if( !ploneAuthEnabled ) {
            return;
          }

          var plonesite = RocketChat.settings.get('Plone authentication endpoint');
          
          if( plonesite.lastIndexOf('/') !== plonesite.length - 1 ) {
              plonesite += '/';
          }

          HTTP.call(
            'POST',
            plonesite + '@@verify-cookie?cookie=' + cookie,
            function(Accounts, error, res) {
              if( res === null ) {
                future.return();
              }else{
                var contents = JSON.parse(res.content);
                var id = Accounts.findUserByUsername(contents.user);

                if( id === undefined ) {
                  future.return();
                }else{
                  id = id._id;
                  future['return'](
                    {
                      type: 'plone',
                      userId: id
                    }
                  );
                }
              }
            }.bind(future, Accounts)
          );

          return future.wait();
      }
    });
  });

  Accounts.registerLoginHandler("plone", function(loginRequest) {

    if( loginRequest.cookie === undefined ) {
      return undefined;
    }


    if( Accounts.findUserByUsername(loginRequest.user.id) === undefined ) {
      var id = Accounts.createUser({
        email: loginRequest.user.email,
        password: Random.id(),
        username: loginRequest.user.id
      });

      var rooms = RocketChat.models.Rooms.findByType('c').fetch();
      var user = RocketChat.models.Users.findOneById(id);

      for( var item in rooms ) {
        var res = RocketChat.models.Subscriptions.createWithRoomAndUser(rooms[item], user);
      }

      return {
        userId: id,
        type: 'plone'
      };
    }else{
        var future = new Future();

        Meteor.call('plone.login', loginRequest.cookie, function(err, res) {
            future.return(res);
        }.bind(future));

        return future.wait();
    }
  });
}
