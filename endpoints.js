if( Meteor.isServer ) {
  api = new Restivus({
    useDefaultAuth: true,
    prettyJson: true
  });


  Meteor.startup(function() {
    Future = Npm.require('fibers/future');
  });

  api.addRoute('messageWaiting', {authRequired: false}, {
    post: {
      action: function() {
        if( this.bodyParams.user === undefined ) {
          return false;
        }

        var messageFuture = new Future();
        var user = this.bodyParams.user.name;

        //Since there's no connection open to a client, we can't actually properly "log in"
        Meteor.call('plone.login', this.bodyParams.cookie, this.bodyParams.user.name, function(err, res) {
          if( err ) {
            messageFuture.return(false);
          }else if( res.userId ){
            messageFuture.return(getMessages(user));
          }
        });

        return messageFuture.wait();
      }
    }
  });
}

var getMessages = function(username) {
  var id = Accounts.findUserByUsername(username);

  if( id === undefined ) {
    return false;
  }

  var rooms = RocketChat.models.Subscriptions.findByType(['c']).fetch();
  var roommap = {};

  for( var room in rooms ) {
    roommap[ rooms[room].rid ] = rooms[room].name;
  }

  var missed = {};
  var count = 0;

  var messages = RocketChat.models.Messages.findVisibleCreatedOrEditedAfterTimestamp(id.lastLogin).fetch();

  for( var msg in messages ) {
    if( messages[msg].u.username === username ) {
        continue;
    }
    count += 1;
    var message = messages[msg];
    var rid = message.rid;
    message.name = roommap[rid];

    var name = message.name;

    if( missed[name] === undefined ) {
        missed[name] = [];
    }

    missed[name].push(message);
  }

  if( count > 0 ) {
      return missed;
  }

  return false;
};

  //api.addRoute('removeperson/:id', {authRequired: false}, {
  //  get: function() {
  //    Meteor.users.remove(this.urlParams.id);
  //    var user = Accounts.findUserByUsername(this.urlParams.id);
  //    RocketChat.deleteUser(user._id);
  //    return true;
  //  }
  //});
