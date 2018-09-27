function requireAll(context) {
    context.keys().forEach(function(key) {
      context(key);
    });
  }

  require('../menu.html');
  requireAll(require.context('../community', true, /\.html$/));
  //requireAll(require.context('../forum', true, /\.html$/));
  requireAll(require.context('../groupAdmin', true, /\.html$/));
  requireAll(require.context('../groupCodePrompt', true, /\.html$/));
  requireAll(require.context('../login', true, /\.html$/));
  //requireAll(require.context('../map', true, /\.html$/));
  requireAll(require.context('../navigation/views', true, /\.html$/));
  requireAll(require.context('../offerRedirect', true, /\.html$/));
  requireAll(require.context('../profile', true, /\.html$/));
  requireAll(require.context('../teams', true, /\.html$/));
  requireAll(require.context('../groupCodePrompt', true, /\.html$/));