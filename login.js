FlowRouter.route('/plone/:token/:username/:email', {
    action: function() {
        var options = {
            token: FlowRouter.getParam('token'),
            user: {
                name: FlowRouter.getParam('username'),
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
