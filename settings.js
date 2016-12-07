Meteor.startup(function() {
    if( Meteor.isServer ) {

        RocketChat.settings.addGroup('Plone', function() {
            this.add('Allow Plone authentication', false, {type:'boolean', public: true });
            this.add('Plone authentication endpoint', 'http://localhost:3000/', { type: 'string', public: true });
        });
    }
});
