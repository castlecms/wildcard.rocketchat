if( Meteor.isServer ) { 


  Meteor.startup(function () {
    Future = Npm.require('fibers/future');
    cache = new ApiCache('rest', 60);

    Meteor.methods({
      'plone.login': function(cookie, id) {

          var future = new Future();
      
          var ploneAuthEnabled = RocketChat.settings.get('Allow Plone authentication');

          if( !ploneAuthEnabled ) {
            return;
          }

          var plonesite = RocketChat.settings.get('Plone authentication endpoint');
          
          if( plonesite.lastIndexOf('/') !== plonesite.length - 1 ) {
              plonesite += '/';
          }

          var url = plonesite + '@@verify-cookie?cookie=' + cookie + '&user=' + id;
          var cacheId = cache.get(url);

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
                future.return();
              }else{
                var contents = JSON.parse(res.content);
 
                if( contents.status === "failure" ) {
                    console.log(contents);
                    future.return(false);
                }

                var id = Accounts.findUserByUsername(contents.user);

                if( id === undefined ) {
                  future.return();
                }else{
                  id = id._id;
                  cache.set(url, id);
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

    var account = Accounts.findUserByUsername(loginRequest.user.id);
    if( account === undefined ) {
      var id = Accounts.createUser({
        email: loginRequest.user.email,
        password: Random.id(),
        username: loginRequest.user.id
      });

      //var rooms = RocketChat.models.Rooms.findByType('c').fetch();
      //var user = RocketChat.models.Users.findOneById(id);

      return {
        userId: id,
        type: 'plone'
      };
    }else{
        var future = new Future();

        Meteor.call('plone.login', loginRequest.cookie, account.username, function(err, res) {
            future.return(res);
        }.bind(future));

        return future.wait();
    }
  });
}
