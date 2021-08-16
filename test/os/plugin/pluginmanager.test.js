goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('os.config.Settings');
goog.require('os.plugin.MockErrorPlugin');
goog.require('os.plugin.MockPlugin');
goog.require('os.plugin.PluginManager');

describe('os.plugin.PluginManager', function() {
  const GoogEventType = goog.module.get('goog.events.EventType');
  const Settings = goog.module.get('os.config.Settings');
  const PluginManager = goog.module.get('os.plugin.PluginManager');

  const MockErrorPlugin = goog.module.get('os.plugin.MockErrorPlugin');
  const MockPlugin = goog.module.get('os.plugin.MockPlugin');

  var pm = null;

  beforeEach(function() {
    Settings.getInstance().init();
    pm = new PluginManager();
  });

  it('should add plugins', function() {
    pm.addPlugin(new MockPlugin());
    expect(pm.plugins_.length).toBe(1);
  });

  it('should add more plugins', function() {
    pm.addPlugin(new MockPlugin());
    expect(pm.plugins_.length).toBe(1);
    pm.addPlugin(new MockPlugin());
    expect(pm.plugins_.length).toBe(2);
  });

  it('should initialize plugins', function() {
    pm.addPlugin(new MockPlugin());

    var count = 0;
    var listener = function(e) {
      count++;
    };

    runs(function() {
      pm.listenOnce(GoogEventType.LOAD, listener);
      pm.init();
    });

    waitsFor(function() {
      return count == 1;
    }, 'to finish initing');

    runs(function() {
      expect(pm.ready).toBe(true);
    });
  });

  it('should read init timeout interval from settings', function() {
    // spy on setTimeout calls, but don't actually call them since initialzation doesn't matter for this test
    spyOn(window, 'setTimeout');

    // disable the setTimeout call in the mock plugin so the spy doesn't pick it up
    pm.addPlugin(new MockPlugin({
      initTimeout: 0
    }));

    // initialize the plugin manager
    pm.init();

    expect(window.setTimeout.mostRecentCall.args[1]).toBe(PluginManager.INIT_TIMEOUT);

    // change the value in settings
    var expectedTimeout = 50;
    Settings.getInstance().set('plugin.initTimeout', expectedTimeout);

    // recreate the plugin manager so it uses the spy value
    pm = new PluginManager();

    // disable the setTimeout call in the mock plugin so the spy doesn't pick it up
    pm.addPlugin(new MockPlugin({
      initTimeout: 0
    }));

    // initialize the plugin manager
    pm.init();

    expect(window.setTimeout.mostRecentCall.args[1]).toBe(expectedTimeout);

    // clear the value for future tests
    Settings.getInstance().set('plugin.initTimeout', undefined);
  });

  it('should time out when init takes too long', function() {
    // set a low timeout value for this test
    Settings.getInstance().set('plugin.initTimeout', 50);

    // create a plugin that takes longer than the timeout to init
    var slowPlugin = new MockPlugin({
      initTimeout: 500
    });
    pm.addPlugin(slowPlugin);

    spyOn(pm, 'dispatchEvent').andCallThrough();
    spyOn(pm, 'finish_').andCallThrough();
    spyOn(pm, 'onInitTimeout_').andCallThrough();

    runs(function() {
      pm.init();
    });

    waitsFor(function() {
      return pm.dispatchEvent.calls.length > 0;
    }, 'plugin manager to give up hope');

    runs(function() {
      // finish called and dispatched load event
      expect(pm.dispatchEvent).toHaveBeenCalledWith(GoogEventType.LOAD);
      expect(pm.onInitTimeout_).toHaveBeenCalled();
      expect(pm.finish_.calls.length).toBe(1);

      // plugin hasn't loaded yet
      expect(pm.initMap_[slowPlugin.getId()]).toBe(false);
    });

    waitsFor(function() {
      return pm.initMap_[slowPlugin.getId()];
    }, 'plugin to catch up');

    runs(function() {
      // finish should be called again but should not fire another event
      expect(pm.dispatchEvent.calls.length).toBe(1);
      expect(pm.finish_.calls.length).toBe(2);

      // clear the value for future tests
      Settings.getInstance().set('plugin.initTimeout', undefined);
    });
  });

  it('should recognize when plugins are disabled', function() {
    var settings = Settings.getInstance();
    settings.set(['plugins', 'unitTest_enabled'], true);
    settings.set(['plugins', 'unitTest_disabled'], false);

    expect(pm.isPluginEnabled('unitTest_unspecified')).toBe(true);
    expect(pm.isPluginEnabled('unitTest_enabled')).toBe(true);
    expect(pm.isPluginEnabled('unitTest_disabled')).toBe(false);
  });

  it('should fire the load event without plugins', function() {
    var count = 0;
    var listener = function(e) {
      count++;
    };

    runs(function() {
      pm.listenOnce(GoogEventType.LOAD, listener);
      pm.init();
    });

    waitsFor(function() {
      return count == 1;
    }, 'to finish initing');

    runs(function() {
      expect(pm.ready).toBe(true);
      expect(pm.plugins_.length).toBe(0);
    });
  });

  it('should get a plugin', function() {
    expect(pm.getPlugin('mock')).toBe(null);
    pm.addPlugin(new MockPlugin());
    expect(pm.getPlugin('mock').id).toBe('mock');
  });

  it('should filter out disabled plugins on init', function() {
    pm.addPlugin(new MockPlugin());

    var settings = Settings.getInstance();
    settings.set(['plugins', 'unitTest_disabled'], false);
    var p = new MockPlugin();
    p.id = 'unitTest_disabled';

    pm.addPlugin(p);

    var count = 0;
    var listener = function(e) {
      count++;
    };

    runs(function() {
      pm.listenOnce(GoogEventType.LOAD, listener);
      pm.init();
    });

    waitsFor(function() {
      return count == 1;
    }, 'to finish initing');

    runs(function() {
      expect(pm.ready).toBe(true);
      expect(pm.getPlugin('mock')).not.toBe(null);
      expect(pm.getPlugin(p.id)).toBe(null);
    });
  });

  it('should support adding plugins after init', function() {
    pm.addPlugin(new MockPlugin());

    var count = 0;
    var listener = function(e) {
      count++;
    };

    runs(function() {
      pm.listenOnce(GoogEventType.LOAD, listener);
      pm.init();
    });

    waitsFor(function() {
      return count == 1;
    }, 'manager to init');

    var p = new MockPlugin();
    runs(function() {
      p.id = 'mock2';
      pm.addPlugin(p);
    });

    waitsFor(function() {
      return pm.initMap_['mock2'];
    }, 'plugin to add');

    runs(function() {
      expect(pm.getPlugin('mock2')).not.toBe(null);
    });
  });

  it('should not add disabled plugins after init', function() {
    pm.addPlugin(new MockPlugin());
    pm.init();

    var settings = Settings.getInstance();
    settings.set(['plugins', 'unitTest_disabled'], false);

    var p = new MockPlugin();
    p.id = 'unitTest_disabled';

    pm.addPlugin(p);
    expect(p.isDisposed()).toBe(true);
    expect(pm.getPlugin(p.id)).toBe(null);
  });

  it('should dispose properly', function() {
    var p = new MockPlugin();
    pm.addPlugin(p);

    pm.dispose();
    expect(pm.isDisposed()).toBe(true);
    expect(p.isDisposed()).toBe(true);
    expect(pm.getPlugin('mock')).toBe(null);
  });

  it('should handle plugins that report errors', function() {
    pm.addPlugin(new MockErrorPlugin());

    var count = 0;
    var listener = function(e) {
      count++;
    };

    runs(function() {
      pm.listenOnce(GoogEventType.LOAD, listener);
      pm.init();
    });

    waitsFor(function() {
      return count == 1;
    }, 'to finish initing');

    runs(function() {
      expect(pm.ready).toBe(true);
    });
  });

  it('should handle plugins that throw errors', function() {
    var mock = new MockErrorPlugin({
      shouldThrow: true
    });

    pm.addPlugin(mock);

    spyOn(pm, 'markPlugin_').andCallThrough();
    pm.init();

    expect(pm.markPlugin_).toHaveBeenCalledWith(mock);
    expect(pm.ready).toBe(true);
  });
});
