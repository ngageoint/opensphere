goog.provide('test.os.config.SettingsUtil');


/**
 * Test utility for init and load of settings
 * @param {!os.config.Settings} s
 */
test.os.config.SettingsUtil.initAndLoad = function(s) {
  runs(function() {
    s.init();
  });

  waitsFor(function() {
    return s.isInitialized();
  }, 'settings to init');

  runs(function() {
    s.load();
  });

  waitsFor(function() {
    return s.isLoaded();
  }, 'settings to load');
};
