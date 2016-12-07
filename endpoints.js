if( Meteor.isServer ) {
  api = new Restivus({
    useDefaultAuth: true,
    prettyJson: true,
    enableCors: false
  });

  api.addRoute('messageWaiting/:username', {authRequired: false}, {
    get: function() {
      var username = this.urlParams.username;
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
    }
  });

  api.addRoute('removeperson/:id', {authRequired: false}, {
    get: function() {
      Meteor.users.remove(this.urlsParams.id);
      var user = Accounts.findUserByUsername(this.urlParams.id);
      RocketChat.deleteUser(user._id);
      return true;
    }
  });
}
