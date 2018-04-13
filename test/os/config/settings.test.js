goog.require('goog.async.Deferred');
goog.require('os.config.Settings');
goog.require('os.config.storage.SettingsFile');
goog.require('os.config.storage.SettingsLocalStorage');
goog.require('os.config.storage.SettingsObjectStorage');
goog.require('os.config.storage.SettingsWritableStorageType');
goog.require('os.net.RequestHandlerFactory');
goog.require('os.net.SameDomainHandler');
goog.require('test.os.config.SettingsUtil');


describe('os.config.Settings', function() {
  window.localStorage.clear();
  os.net.RequestHandlerFactory.addHandler(os.net.SameDomainHandler);

  beforeEach(function() {
    window.localStorage.clear();
  });

  it('should not return a config until initialized', function() {
    var settings = new os.config.Settings();
    test.os.config.SettingsUtil.initAndLoad(settings);

    runs(function() {
      expect(settings.get()).toBeUndefined();
    });
  });

  it('should load settings without overrides', function() {
    var settings = new os.config.Settings();
    var registry = settings.getStorageRegistry();
    registry.addStorage(new os.config.storage.SettingsFile(
        '/base/test/os/config/files/settings_noOverrides.json'));

    test.os.config.SettingsUtil.initAndLoad(settings);

    runs(function() {
      expect(settings.get(['a', 'adminField'])).toBe('a');
      expect(settings.get(['a', 'userField'])).toBe('a');
      expect(settings.get(['b', 'doesnotexist'])).toBeUndefined();
      expect(settings.get(['b', 'doesnotexist'], 'default')).toBe('default');
    });
  });

  it('should load settings with overrides', function() {
    var settings = new os.config.Settings();
    var registry = settings.getStorageRegistry();
    registry.addStorage(new os.config.storage.SettingsFile(
        '/base/test/os/config/files/settings_twoOverrides.json'));

    test.os.config.SettingsUtil.initAndLoad(settings);

    runs(function() {
      expect(settings.get(['a', 'adminField'])).toBe('B');
      expect(settings.get(['a', 'userField'])).toBe('B');
      expect(settings.get(['A', 'adminField'])).toBe('A');
      expect(settings.get(['A', 'userField'])).toBe('A');
      expect(settings.get(['B', 'adminField'])).toBe('B');
      expect(settings.get(['a', 'otherAdminField'])).toBe('BB');
      expect(settings.get(['B', 'userField'])).toBe('B');
      expect(settings.get(['c', 'doesnotexist'])).toBeUndefined();
      expect(settings.get(['c', 'doesnotexist'], 'default')).toBe('default');
    });
  });

  it('should load settings with overrides', function() {
    var settings = new os.config.Settings();
    var registry = settings.getStorageRegistry();
    registry.addStorage(new os.config.storage.SettingsFile(
        '/base/test/os/config/files/settings_overrides.json'));
    test.os.config.SettingsUtil.initAndLoad(settings);

    runs(function() {
      expect(settings.get(['a', 'adminField'])).toBe('B');
      expect(settings.get(['a', 'userField'])).toBe('B');
      expect(settings.get(['A', 'adminField'])).toBe('A');
      expect(settings.get(['A', 'userField'])).toBe('A');
      expect(settings.get(['B', 'adminField'])).toBe('B');
      expect(settings.get(['a', 'otherAdminField'])).toBe('BB');
      expect(settings.get(['B', 'userField'])).toBe('B');
      expect(settings.get(['c', 'doesnotexist'])).toBeUndefined();
      expect(settings.get(['c', 'doesnotexist'], 'default')).toBe('default');
    });
  });

  it('should load settings with overrides and localStorage values', function() {
    var lsJson = {
      'a': {
        'userField': 'localStorage',
        'localStorageField': 'localStorage'
      },
      'localStorage': 'localStorage'
    };
    window.localStorage.setItem('unittest::settings', JSON.stringify(lsJson));

    var settings = new os.config.Settings();
    var registry = settings.getStorageRegistry();

    registry.addStorage(new os.config.storage.SettingsFile(
        '/base/test/os/config/files/settings_overrides.json'));
    registry.addStorage(new os.config.storage.SettingsLocalStorage(
        'unittest', [os.config.coreNs, os.config.appNs]));
    test.os.config.SettingsUtil.initAndLoad(settings);

    runs(function() {
      expect(settings.get(['a', 'adminField'])).toBe('B');
      expect(settings.get(['a', 'userField'])).toBe('localStorage');
      expect(settings.get(['A', 'adminField'])).toBe('A');
      expect(settings.get(['A', 'userField'])).toBe('A');
      expect(settings.get(['B', 'adminField'])).toBe('B');
      expect(settings.get(['a', 'otherAdminField'])).toBe('BB');
      expect(settings.get(['B', 'userField'])).toBe('B');
      expect(settings.get(['a', 'localStorageField'])).toBe('localStorage');
      expect(settings.get(['localStorage'])).toBe('localStorage');
      expect(settings.get(['c', 'doesnotexist'])).toBeUndefined();
      expect(settings.get(['c', 'doesnotexist'], 'default')).toBe('default');
      expect(window.localStorage.getItem('unittest::settings')).toBe(null);

      window.localStorage.removeItem('unittest::settings');
    });
  });

  it('should merge core settings arrays, not overwrite them', function() {
    var lsJson = {'favorite': ['seeded'], 'other': 'otherVal'};
    window.localStorage.setItem('unittest::settings', JSON.stringify(lsJson));

    var settings = new os.config.Settings();
    var registry = settings.getStorageRegistry();

    registry.addStorage(
        new os.config.storage.SettingsLocalStorage(
            'unittest', [os.config.coreNs, os.config.appNs]));
    registry.addStorage(
        new os.config.storage.SettingsObjectStorage(
            [os.config.coreNs, os.config.appNs], {'core': {'favorite': ['stored']}}));

    test.os.config.SettingsUtil.initAndLoad(settings);

    runs(function() {
      var favorites = settings.get('favorite');
      expect(favorites).toBeDefined();
      expect(favorites.length).toBe(2);
      var orderDontMatter = favorites[0] + favorites[1];
      expect(orderDontMatter.indexOf('stored')).toBeGreaterThan(-1);
      expect(orderDontMatter.indexOf('seeded')).toBeGreaterThan(-1);
    });
  });

  it('should not persist changes to admin keys', function() {
    var settings = new os.config.Settings();
    var registry = settings.getStorageRegistry();
    var fileStorage = new os.config.storage.SettingsFile('/base/test/os/config/files/settings_noOverrides.json');
    registry.addStorage(fileStorage);
    var objectStorage = new os.config.storage.SettingsObjectStorage([os.config.appNs]);
    registry.addStorage(objectStorage);

    var delayedSave = false;

    test.os.config.SettingsUtil.initAndLoad(settings);

    runs(function() {
      spyOn(objectStorage, 'setSettings').andCallThrough();
      settings.set('a.adminField', 'changedAdminField');

      setTimeout(function() {
        delayedSave = true;
        // Quick work around for settings service changes.
        // As this is not really testing the auto/delayed save
        // this test could be refactored to be sync.
        settings.save();
      }, 1100);
    });

    waitsFor(function() {
      return delayedSave;
    }, 'Settings to save');

    runs(function() {
      expect(settings.get('a.adminField')).toBe('changedAdminField');
      expect(objectStorage.setSettings.mostRecentCall.args[0].unittest.a.adminField).toBeUndefined();
      expect(objectStorage.setSettings.mostRecentCall.args[0].unittest.a.userField).toBeDefined();
    });
  });

  it('should send an event when value changes', function() {
    var settings = new os.config.Settings();
    var registry = settings.getStorageRegistry();
    registry.addStorage(new os.config.storage.SettingsFile(
        '/base/test/os/config/files/settings_noOverrides.json'));
    test.os.config.SettingsUtil.initAndLoad(settings);

    runs(function() {
      var changeEvent;
      var changedSpy = {
        onChange: function(e) {
          changeEvent = e;
        }
      };
      spyOn(changedSpy, 'onChange').andCallThrough();
      settings.listenOnce('a.userField', changedSpy.onChange);

      settings.set(['a', 'userField'], 'aa');

      expect(changedSpy.onChange).toHaveBeenCalled();
      expect(changeEvent.type).toBe('a.userField');
      expect(changeEvent.newVal).toBe('aa');
      expect(changeEvent.oldVal).toBe('a');
    });
  });

  it('should send an event on update', function() {
    var settings = new os.config.Settings();
    settings.init('whocares', 'test.os.config.with');

    var count = 0;
    var listener = function(e) {
      count++;
    };

    settings.listenOnce(os.config.EventType.UPDATED, listener);

    runs(function() {
      settings.update();
    });

    waitsFor(function() {
      return count == 1;
    }, 'update event to fire');

    runs(function() {
      expect(count).toBe(1);
    });
  });

  describe('delete keys', function() {
    it('should include keys to delete when value is mutated', function() {
      var settings = new os.config.Settings();
      var objectStorage = new os.config.storage.SettingsObjectStorage([os.config.appNs]);
      settings.getStorageRegistry().addStorage(objectStorage);
      test.os.config.SettingsUtil.initAndLoad(settings);

      var delayedSave = false;

      runs(function() {
        // store a value
        var val = {'a': {'b': {'c': {'c1': 'c1Val', 'c2': 'c2Val'}}}};
        settings.set('x.y.z', val);

        spyOn(objectStorage, 'setSettings').andCallThrough();

        // update the value and store it again
        settings.set('x.y.z.a', null);

        setTimeout(function() {
          delayedSave = true;
          settings.save();
        }, 1100);
      });

      waitsFor(function() {
        return delayedSave;
      }, 'Settings to save');

      runs(function() {
        expect(objectStorage.setSettings).toHaveBeenCalled();
        expect(objectStorage.setSettings.mostRecentCall.args[1].length).toBe(2);
        // NOTE: Not sure if this is the expected behavior.
        expect(objectStorage.setSettings.mostRecentCall.args[1][0]).toBe('unittest.x.y.z.a.b.c.c1');
        expect(objectStorage.setSettings.mostRecentCall.args[1][1]).toBe('unittest.x.y.z.a.b.c.c2');
      });
    });

    it('should delete keys of an object', function() {
      var settings = new os.config.Settings();
      var objectStorage = new os.config.storage.SettingsObjectStorage([os.config.appNs]);
      settings.getStorageRegistry().addStorage(objectStorage);
      test.os.config.SettingsUtil.initAndLoad(settings);

      var delayedSave = false;
      var eventFired = false;

      runs(function() {
        settings.listenOnce('x.y.z', function() {
          eventFired = true;
        });

        // store a value
        var val = {'a': {'b': {'c': {'c1': 'c1Val', 'c2': 'c2Val'}}}};
        settings.set('x.y.z', val);

        spyOn(objectStorage, 'setSettings').andCallThrough();

        // update the value and store it again
        val = settings.delete('x.y.z.a');

        setTimeout(function() {
          delayedSave = true;
          settings.save();
        }, 1100);
      });

      waitsFor(function() {
        return delayedSave;
      }, 'Settings to save');

      runs(function() {
        expect(objectStorage.setSettings).toHaveBeenCalled();
        expect(objectStorage.setSettings.mostRecentCall.args[1].length).toBe(2);
        // NOTE: Not sure if this is the expected behavior.
        expect(objectStorage.setSettings.mostRecentCall.args[1][0]).toBe('unittest.x.y.z.a.b.c.c1');
        expect(objectStorage.setSettings.mostRecentCall.args[1][1]).toBe('unittest.x.y.z.a.b.c.c2');

        expect(eventFired).toBe(true);
      });
    });

    it('should delete keys of an array', function() {
      var settings = new os.config.Settings();
      var objectStorage = new os.config.storage.SettingsObjectStorage([os.config.appNs]);
      settings.getStorageRegistry().addStorage(objectStorage);
      test.os.config.SettingsUtil.initAndLoad(settings);

      var delayedSave = false;
      var eventFired = false;

      runs(function() {
        settings.listenOnce('x.y.z', function() {
          eventFired = true;
        });

        // store a value
        var val = {'a': ['b', 'c', 'd']};
        settings.set('x.y.z', val);

        spyOn(objectStorage, 'setSettings').andCallThrough();

        // update the value and store it again
        val = settings.delete('x.y.z');

        setTimeout(function() {
          delayedSave = true;
          settings.save();
        }, 1100);
      });

      waitsFor(function() {
        return delayedSave;
      }, 'Settings to save');

      runs(function() {
        expect(objectStorage.setSettings).toHaveBeenCalled();
        expect(objectStorage.setSettings.mostRecentCall.args[1].length).toBe(1);
        expect(objectStorage.setSettings.mostRecentCall.args[1][0]).toBe('unittest.x.y.z.a');

        expect(eventFired).toBe(true);
      });
    });
  });

  it('should continue without persistence when server request fails', function() {
    var lsJson = {
      'a': {
        'userField': 'localStorage',
        'localStorageField': 'localStorage'
      },
      'localStorage': 'localStorage'
    };
    window.localStorage.setItem('unittest::settings', JSON.stringify(lsJson));

    var settings = new os.config.Settings();
    var registry = settings.getStorageRegistry();
    registry.addStorage(new os.config.storage.SettingsFile(
        '/base/test/os/config/files/settings_twoOverrides.json'));
    registry.addStorage(new os.config.storage.SettingsLocalStorage(
        'unittest', [os.config.coreNs, os.config.appNs]));
    test.os.config.SettingsUtil.initAndLoad(settings);

    runs(function() {
      expect(settings.get(['a', 'adminField'])).toBe('B');
      expect(settings.get(['a', 'userField'])).toBe('localStorage');
      expect(settings.get(['a', 'localStorageField'])).toBe('localStorage');
      expect(settings.get(['A', 'adminField'])).toBe('A');
      expect(settings.get(['A', 'userField'])).toBe('A');
      expect(settings.get(['B', 'adminField'])).toBe('B');
      expect(settings.get(['a', 'otherAdminField'])).toBe('BB');
      expect(settings.get(['B', 'userField'])).toBe('B');
      expect(settings.get(['localStorage'])).toBe('localStorage');
      expect(settings.get(['c', 'doesnotexist'])).toBeUndefined();
      expect(settings.get(['c', 'doesnotexist'], 'default')).toBe('default');
      expect(window.localStorage.getItem('unittest::settings')).toBeDefined();

      window.localStorage.removeItem('unittest::settings');
    });
  });

  it('should continue with settings disabled if no storages are registered', function() {
    var settings = new os.config.Settings();
    test.os.config.SettingsUtil.initAndLoad(settings);

    runs(function() {
      expect(settings.isInitialized()).toBe(true);
      expect(settings.isLoaded()).toBe(true);
      expect(settings.getPersistenceEnabled()).toBe(false);
    });
  });

  it('should continue with settings disabled if no writable storages are registered', function() {
    var settings = new os.config.Settings();
    settings.getStorageRegistry().addStorage(new os.config.storage.SettingsFile(
        '/base/test/os/config/files/settings_noOverrides.json'));
    test.os.config.SettingsUtil.initAndLoad(settings);

    runs(function() {
      expect(settings.isInitialized()).toBe(true);
      expect(settings.isLoaded()).toBe(true);
      expect(settings.getPersistenceEnabled()).toBe(false);
    });
  });

  it('should disable persistence of no storage of given type is registered', function() {
    var settings = new os.config.Settings();

    // register a file and a local object store
    settings.getStorageRegistry().addStorage(new os.config.storage.SettingsFile(
        '/base/test/os/config/files/settings_noOverrides.json'));
    settings.getStorageRegistry().addStorage(new os.config.storage.SettingsObjectStorage([os.config.appNs]));
    test.os.config.SettingsUtil.initAndLoad(settings);

    runs(function() {
      // defaults to local
      expect(settings.getPersistenceEnabled()).toBe(true);
      // change it to remote
      settings.setWriteStorageType(os.config.storage.SettingsWritableStorageType.REMOTE);
      // can't find it, should disable
      expect(settings.getPersistenceEnabled()).toBe(false);
      // change it back
      settings.setWriteStorageType(os.config.storage.SettingsWritableStorageType.LOCAL);
      // should be back on
      expect(settings.getPersistenceEnabled()).toBe(true);
    });
  });

  it('should disable persistence when the all local storages fail to init, and local is the preferred storage type',
      function() {
        var settings = new os.config.Settings();

        var ls = new os.config.storage.SettingsObjectStorage([os.config.appNs]);
        ls.init = function() {
          return goog.async.Deferred.fail('failed to init');
        };
        var ls2 = new os.config.storage.SettingsObjectStorage([os.config.appNs]);
        ls2.init = function() {
          return goog.async.Deferred.fail('failed to init');
        };

        settings.getStorageRegistry().addStorage(ls);
        settings.getStorageRegistry().addStorage(ls2);

        test.os.config.SettingsUtil.initAndLoad(settings);

        runs(function() {
          expect(settings.getPersistenceEnabled()).toBe(false);
        });
      });

  it('should disable persistence when all remote storages fail to init, and remote is the preferred storage type',
      function() {
        var settings = new os.config.Settings();

        var ls = new os.config.storage.SettingsObjectStorage([os.config.appNs]);
        settings.getStorageRegistry().addStorage(ls);

        test.os.config.SettingsUtil.initAndLoad(settings);

        runs(function() {
          // defaults to local
          expect(settings.getPersistenceEnabled()).toBe(true);
          // switch to remote
          settings.setWriteStorageType(os.config.storage.SettingsWritableStorageType.REMOTE);
          // should disable
          expect(settings.getPersistenceEnabled()).toBe(false);
        });
      });

  it('should disable persistence when all local storages fail to load, and local is the preferred storage type',
      function() {
        var settings = new os.config.Settings();

        var ls = new os.config.storage.SettingsObjectStorage([os.config.appNs]);
        ls.init = function() {
          return goog.async.Deferred.fail('failed to init');
        };
        var ls2 = new os.config.storage.SettingsObjectStorage([os.config.appNs]);
        ls2.init = function() {
          return goog.async.Deferred.fail('failed to init');
        };

        settings.getStorageRegistry().addStorage(ls);
        settings.getStorageRegistry().addStorage(ls2);

        test.os.config.SettingsUtil.initAndLoad(settings);

        runs(function() {
          expect(settings.getPersistenceEnabled()).toBe(false);
        });
      });

  it('should disable persistence when all remote storages fail to load, and remote is the preferred storage type',
      function() {
        var settings = new os.config.Settings();

        var ls = new os.config.storage.SettingsObjectStorage([os.config.coreNs, os.config.appNs],
            {'core': {'storage': {'writeType': 'remote'}}});

        settings.getStorageRegistry().addStorage(ls);
        test.os.config.SettingsUtil.initAndLoad(settings);

        runs(function() {
          expect(settings.getPersistenceEnabled()).toBe(false);
        });
      });

  it('should failover to an available local storage if another fails to init, and local is the preferred storage type',
      function() {
        var settings = new os.config.Settings();

        var ls = new os.config.storage.SettingsObjectStorage([os.config.appNs]);
        ls.init = function() {
          return goog.async.Deferred.fail('failed to init');
        };
        var ls2 = new os.config.storage.SettingsObjectStorage([os.config.appNs]);

        settings.getStorageRegistry().addStorage(ls);
        settings.getStorageRegistry().addStorage(ls2);

        test.os.config.SettingsUtil.initAndLoad(settings);

        runs(function() {
          expect(settings.getStorageRegistry().getWriteStorageType()).toBe('local');
          expect(settings.getPersistenceEnabled()).toBe(true);
        });
      });

  it('should not save when persistence is not enabled', function() {
    var ls = new os.config.storage.SettingsObjectStorage([os.config.appNs]);

    var settings = new os.config.Settings();
    settings.getStorageRegistry().addStorage(ls);

    test.os.config.SettingsUtil.initAndLoad(settings);

    runs(function() {
      spyOn(ls, 'setSettings');
      settings.setPersistenceEnabled(false);
      settings.set(['doesnt', 'matter'], 'shouldnt save');
      expect(ls.setSettings).not.toHaveBeenCalled();
    });
  });

  it('should default to local when preferred storage type is not specified and no backup is present', function() {
    var settings = new os.config.Settings();
    settings.getStorageRegistry().addStorage(
        new os.config.storage.SettingsObjectStorage([os.config.coreNs, os.config.appNs]));

    test.os.config.SettingsUtil.initAndLoad(settings);

    runs(function() {
      expect(settings.getPersistenceEnabled()).toBe(true);
      expect(settings.getStorageRegistry().getWriteStorageType()).toBe('local');
    });
  });

  xit('should default to the backup key when storage type is not specified', function() {
    window.localStorage.setItem('com.bitsys.os.config.storage.writeType', 'remote');

    var settings = new os.config.Settings();
    settings.getStorageRegistry().addStorage(
        new os.config.storage.SettingsObjectStorage([os.config.coreNs, os.config.appNs]));

    test.os.config.SettingsUtil.initAndLoad(settings);

    runs(function() {
      expect(settings.getPersistenceEnabled()).toBe(false);
      expect(settings.getStorageRegistry().getWriteStorageType()).toBe('remote');
    });
  });

  it('should use preferred storage type when specified', function() {
    var settings = new os.config.Settings();
    var ls = new os.config.storage.SettingsObjectStorage([os.config.coreNs, os.config.appNs],
        {'core': {'storage': {'writeType': 'remote'}}});
    ls.writeType = 'remote';

    settings.getStorageRegistry().addStorage(ls);

    test.os.config.SettingsUtil.initAndLoad(settings);

    runs(function() {
      expect(settings.getPersistenceEnabled()).toBe(true);
      expect(settings.getStorageRegistry().getWriteStorageType()).toBe('remote');
    });
  });

  it('should dispatch internal notification events on reloading', function() {
    var event = null;
    var settings = new os.config.Settings();
    var registry = settings.getStorageRegistry();
    registry.addStorage(new os.config.storage.SettingsFile('/base/test/os/config/files/settings_noOverrides.json'));

    test.os.config.SettingsUtil.initAndLoad(settings);

    runs(function() {
      settings.toNotifyInternal_.push({
        namespace: 'space1',
        keys: ['key1', 'key2'],
        oldValue: 'facepalm'
      });

      settings.listenOnce('key1.key2', function(e) {
        event = e;
      });
      settings.reload();
    });

    waitsFor(function() {
      return settings.toNotifyInternal_.length == 0;
    }, 'the queue to be emptied');

    runs(function() {
      expect(event).not.toBe(null);
      expect(event.oldVal).toBe('facepalm');
      expect(event.newVal).toBe('doubleFacepalm');
    });
  });

  it('should process storage.writeType messages', function() {
    var settings = new os.config.Settings();
    var ls = new os.config.storage.SettingsObjectStorage([os.config.coreNs, os.config.appNs],
        {'core': {'storage': {'writeType': 'remote'}}});

    settings.getStorageRegistry().addStorage(ls);

    test.os.config.SettingsUtil.initAndLoad(settings);

    runs(function() {
      spyOn(settings, 'setWriteStorageType').andCallThrough();

      var data = {
        keys: ['storage', 'writeType'],
        newValue: 'local'
      };

      // the other arguments to this function don't matter
      settings.process(data);

      expect(settings.setWriteStorageType.mostRecentCall.args[0]).toBe('local');
      expect(settings.get('storage.writeType')).toBe('local');
    });
  });

  it('should process other messages by building the internal queue', function() {
    var obj = {
      'core': {
        'storage': {
          'writeType': 'remote'
        },
        'key1': {
          'key2': 'hello'
        }
      }
    };
    var settings = new os.config.Settings();
    var objectStorage = new os.config.storage.SettingsObjectStorage([os.config.coreNs, os.config.appNs], obj);

    settings.getStorageRegistry().addStorage(objectStorage);

    test.os.config.SettingsUtil.initAndLoad(settings);

    runs(function() {
      var data = {
        keys: ['key1', 'key2'],
        newValue: 'wut'
      };

      // the other arguments to this function don't matter
      settings.process(data);

      var msg = settings.toNotifyInternal_[0];
      expect(msg.keys).toEqual(['key1', 'key2']);
      expect(msg.oldValue).toBe('hello');
    });
  });

  it('should dispatch external messages after saving', function() {
    var settings = new os.config.Settings();
    var objectStorage = new os.config.storage.SettingsObjectStorage([os.config.appNs]);

    settings.getStorageRegistry().addStorage(objectStorage);

    test.os.config.SettingsUtil.initAndLoad(settings);

    runs(function() {
      spyOn(settings, 'onSaveSuccess_').andCallThrough();
      spyOn(settings.peer_, 'send').andCallThrough();
      settings.set('a.adminField', 'changedAdminField');

      expect(settings.toNotifyExternal_.length).toBe(1);
      expect(settings.toNotifyExternal_[0].keys).toEqual(['a', 'adminField']);
    });

    waitsFor(function() {
      return settings.onSaveSuccess_.calls.length === 1;
    }, 'Settings to save');

    runs(function() {
      expect(settings.peer_.send.mostRecentCall.args[0]).toBe('unittest');
      expect(settings.peer_.send.mostRecentCall.args[1]).toEqual({namespace: 'unittest', 'keys': ['a', 'adminField']});
    });
  });
});
