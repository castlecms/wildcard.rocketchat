Package.describe({
  name: 'wildcard:rocketchat-api-endpoints',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.0');
  api.use('accounts-base');
  api.use('nimble:restivus');
  api.use('kadira:flow-router');
  api.use('rocketchat:lib');
  api.use('miktam:server-cache');
  api.addFiles('endpoints.js');
  api.addFiles('authentication.js');
  api.addFiles('settings.js');
  api.addFiles('login.js');

  api.export('Api');
});

Package.onTest(function(api) {
});
