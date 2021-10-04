goog.require('os.alert.AlertManager');
goog.require('os.auth');
goog.require('os.config.Settings');
goog.require('os.data.RecordField');
goog.require('os.mock');


describe('plugin.imagery.menu', () => {
  const {
    SettingKey,
    initAuth,
    getAuth,
    alertAuth
  } = goog.module.get('os.auth');
  const {default: Settings} = goog.module.get('os.config.Settings');
  const {default: AlertManager} = goog.module.get('os.alert.AlertManager');

  const settingsAuth = {
    'test': {
      'title': 'My Test Auth',
      'tooltip': 'Test Tooltip',
      'message': 'Go here to authenticate with the test server.',
      'pattern': '(http://my.test.url|Test Name)',
      'link': 'http://my.test.url/login'
    }
  };

  it('should initialize from settings', () => {
    // check before adding anything to settings
    let testAuth = getAuth('http://my.test.url');
    expect(testAuth).toBe(null);

    // add the test object and check that we get something
    Settings.getInstance().set(SettingKey, settingsAuth);
    initAuth();

    testAuth = getAuth('http://my.test.url');
    expect(testAuth.title).toBe('My Test Auth');
    expect(testAuth.tooltip).toBe('Test Tooltip');
    expect(testAuth.message).toBe('Go here to authenticate with the test server.');
    expect(testAuth.pattern instanceof RegExp).toBe(true);
    expect(testAuth.link).toBe('http://my.test.url/login');
  });

  it('should get auth objects from settings by URL or name', () => {
    Settings.getInstance().set(SettingKey, settingsAuth);
    initAuth();

    testAuth = getAuth('http://my.test.url');
    expect(testAuth.title).toBe('My Test Auth');
    expect(testAuth.tooltip).toBe('Test Tooltip');
    expect(testAuth.message).toBe('Go here to authenticate with the test server.');
    expect(testAuth.pattern instanceof RegExp).toBe(true);
    expect(testAuth.link).toBe('http://my.test.url/login');

    testAuth = null;

    // test it with a name
    testAuth = getAuth('Test Name');
    expect(testAuth.title).toBe('My Test Auth');
    expect(testAuth.tooltip).toBe('Test Tooltip');
    expect(testAuth.message).toBe('Go here to authenticate with the test server.');
    expect(testAuth.pattern instanceof RegExp).toBe(true);
    expect(testAuth.link).toBe('http://my.test.url/login');
  });

  it('should send alerts exactly once per auth entry', () => {
    Settings.getInstance().set(SettingKey, settingsAuth);
    initAuth();
    spyOn(AlertManager.getInstance(), 'sendAlert').andCallThrough();

    // verify that we attempt to fire an alert
    alertAuth('http://my.test.url');

    const calls = AlertManager.getInstance().sendAlert.calls;
    expect(calls.length).toBe(1);
    expect(calls[0].args[0]).toContain(`Go here to authenticate with the test server.`);
  });
});
