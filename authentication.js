if( Meteor.isServer ) {


  Meteor.startup(function () {
    Future = Npm.require('fibers/future');
    cache = new ApiCache('rest', 600);

    Meteor.methods({
      'plone.login': function(token, id) {

          var ploneFuture = new Future();

          var ploneAuthEnabled = RocketChat.settings.get('Allow Plone authentication');

          if( !ploneAuthEnabled ) {
            return;
          }

          var plonesite = RocketChat.settings.get('Plone authentication endpoint');

          if( plonesite.lastIndexOf('/') !== plonesite.length - 1 ) {
              plonesite += '/';
          }

          var url = plonesite + '@@verify-token?token=' + token + '&user=' + id;
          var cacheKey = plonesite + id;
          var cacheId = cache.get(cacheKey);

          if( cacheId ) {
            return {
              type: 'plone',
              userId: cacheId
            };
          }

          HTTP.call(
            'POST',
            url,
            function(Accounts, error, res) {
              if( res === null ) {
                ploneFuture.return();
              }else{
                var contents = JSON.parse(res.content);

                if( contents.status === "failure" ) {
                    ploneFuture.return(false);
                }

                var id = Accounts.findUserByUsername(contents.user);

                if( id === undefined ) {
                  ploneFuture.return();
                }else{
                  id = id._id;
                  cache.set(cacheKey, id);
                  ploneFuture.return(
                    {
                      type: 'plone',
                      userId: id
                    }
                  );
                }
              }
            }.bind(ploneFuture, Accounts)
          );

          return ploneFuture.wait();
      }
    });
  });

  Accounts.registerLoginHandler("plone", function(loginRequest) {

    if( loginRequest.token === undefined ) {
      return undefined;
    }

    var account = Accounts.findUserByUsername(loginRequest.user.name);
    if( account === undefined ) {
      var id = Accounts.createUser({
        email: loginRequest.user.email,
        password: Random.id(),
        username: loginRequest.user.name
      });

      //var rooms = RocketChat.models.Rooms.findByType('c').fetch();
      //var user = RocketChat.models.Users.findOneById(id);

      return {
        userId: id,
        type: 'plone'
      };
    }else{
        var future = new Future();

        Meteor.call('plone.login', loginRequest.token, account.username, function(err, res) {
            future.return(res);
        }.bind(future));

        return future.wait();
    }
  });
}
