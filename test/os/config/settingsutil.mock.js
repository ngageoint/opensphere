goog.module('test.os.config.SettingsUtil');

const {default: Settings} = goog.requireType('os.config.Settings');


/**
 * Test utility for init and load of settings
 * @param {!Settings} s
 */
const initAndLoad = function(s) {
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

exports = {
  initAndLoad
};
