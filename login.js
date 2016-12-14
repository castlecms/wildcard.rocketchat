FlowRouter.route('/plone/:cookie/:username/:email', {
    action: function() {
        var options = {
            cookie: FlowRouter.getParam('cookie'),
            user: {
                id: FlowRouter.getParam('username'),
                email: FlowRouter.getParam('email')
            }
        };
        

        Accounts.callLoginMethod({
            methodArguments: [options],
            userCallback: function(err, res) {
                FlowRouter.go('/');
            }
        });
    }
});
