goog.provide('os.xt.MockHandler');

goog.require('os.xt.Peer');
goog.require('os.xt.events');



/**
 * @constructor
 */
os.xt.MockHandler = function() {
};


/**
 * @type {number}
 */
os.xt.MockHandler.value = 0;


/**
 * @return {Array.<!string>}
 */
os.xt.MockHandler.prototype.getTypes = function() {
  return ['test'];
};


/**
 * @param {*} data
 */
os.xt.MockHandler.prototype.process = function(data) {
  os.xt.MockHandler.value += data;
};


describe('os.xt.Peer', function() {
  // mock storage
  var storage = function() {
    var storageImpl = Object.defineProperties({}, new (function() {
      var keys = [];
      var values = {};
      var eventsSuspended = false;
      var fireStorage = function(key, oldValue, newValue) {
        if (eventsSuspended) {
          return;
        }
        var event = new Event('storage');
        event.key = key;
        event.oldValue = oldValue;
        event.newValue = newValue;
        event.storageArea = storageImpl;
        event.url = window.location.href;
        window.dispatchEvent(event);
      };
      this.key = {
        configurable: false,
        enumerable: false,
        writable: false,
        value: function(index) {
          return keys[index] || null;
        }
      };
      this.setItem = {
        configurable: false,
        enumerable: false,
        writable: false,
        value: function(key, value) {
          value = String(value);
          var oldValue = values[key] || null;
          var keyIndex = keys.indexOf(key);
          if (keyIndex < 0) {
            keys.push(key);
          }
          values[key] = value;
          if (oldValue !== value) {
            fireStorage(key, oldValue, value);
          }
        }
      };
      this.getItem = {
        configurable: false,
        enumerable: false,
        writable: false,
        value: function(key) {
          return values[key];
        }
      };
      this.removeItem = {
        configurable: false,
        enumerable: false,
        writable: false,
        value: function(key) {
          var keyIndex = keys.indexOf(key);
          if (keyIndex > -1) {
            keys.splice(keyIndex, 1);
          }
          var oldValue = values[key] || null;
          if (oldValue) {
            delete values[key];
            fireStorage(key, oldValue, null);
          }
        }
      };
      this.clear = {
        configurable: false,
        enumerable: false,
        writable: false,
        value: function() {
          keys = [];
          values = {};
          fireStorage(null, null, null);
        }
      };
      this.length = {
        configurable: false,
        enumerable: false,
        get: function() {
          return keys.length;
        }
      };
      this.suspendEvents = {
        configurable: false,
        enumerable: false,
        writable: false,
        value: function() {
          eventsSuspended = true;
        }
      };
      this.resumeEvents = {
        configurable: false,
        enumerable: false,
        writable: false,
        value: function() {
          eventsSuspended = false;
        }
      };
    })());
    return storageImpl;
  }();

  var stringifyStorage = function() {
    var str = '';
    for (var cursor = 0, len = storage.length; cursor < len; cursor++) {
      var key = storage.key(cursor);
      str += '\n  ' + key + ': ' + storage.getItem(key);
    }
    return 'storage: {' + str + (str.length ? '\n' : '') + '}';
  };

  describe('mock storage', function() {
    it('adds a key and sets the value', function() {
      storage.setItem('test_key', 'test_value');
      expect(storage.length).toBe(1);
      expect(storage.key(0)).toBe('test_key');
      expect(storage.getItem('test_key')).toBe('test_value');
    });

    it('has length 0 after clear', function() {
      storage.clear();
      expect(storage.length).toBe(0);
    });
  });

  var enforceStrictStorageAPIForIE9Compatibility = function(storage) {
    var keys = [];
    var keyCount = storage.length;
    for (var cursor = 0; cursor < keyCount; cursor++) {
      keys.push(storage.key(cursor));
    }
    for (var invalidKey in storage) {
      if (storage.hasOwnProperty(invalidKey) && keys.indexOf(invalidKey) < 0) {
        throw new Error('found invalid dynamic storage key: ' + invalidKey);
      }
    }
  };

  afterEach(function() {
    enforceStrictStorageAPIForIE9Compatibility(storage);
    enforceStrictStorageAPIForIE9Compatibility(window.localStorage);
    storage.clear();
    os.xt.Peer.PING_INTERVAL = 500;
    os.xt.MockHandler.value = 0;
  });

  // for the purposes of this test, let's ping faster

  it('should have the correct default values', function() {
    var p = new os.xt.Peer();
    expect(p.getId()).not.toBe(null);
    expect(p.getGroup()).toBe('default');
    expect(p.getTitle()).not.toBe(null);
    expect(p.getDetails()).toBe('');
    p.cleanup_();
  });

  it('should persist itself and become the master on init with no other peers', function() {
    var p = new os.xt.Peer(storage);

    runs(function() {
      p.setId('a');
      p.setTitle('alice');
      p.setDetails('of Underland.');
      p.init();

      expect(storage.getItem('xt.default.a.title')).toBe('alice');
      expect(storage.getItem('xt.default.a.details')).toBe('of Underland.');
      expect(storage.getItem('xt.default.a.types')).toBe('[]');
      expect(storage.getItem('xt.default.a.ping')).not.toBeFalsy();
    });

    waitsFor(function() {
      return storage.getItem('xt.default.master') == 'a';
    }, 'the peer to become master');

    runs(function() {
      expect(p.isMaster()).toBe(true);
      p.cleanup_();
    });
  });

  it('should find all other peers in its group correctly', function() {
    var a = new os.xt.Peer();
    a.setId('a');
    a.setGroup('good');
    a.setTitle('alice');
    a.init();

    var b = new os.xt.Peer();
    b.setId('b');
    b.setGroup('good');
    b.setTitle('bob');
    b.init();

    var e = new os.xt.Peer();
    e.setId('e');
    e.setGroup('evil');
    e.setTitle('eve');
    e.init();

    expect(a.getPeers()).not.toContain('a');
    expect(a.getPeers()).toContain('b');
    expect(a.getPeers()).not.toContain('e');

    expect(b.getPeers()).toContain('a');
    expect(b.getPeers()).not.toContain('b');
    expect(b.getPeers()).not.toContain('e');

    expect(e.getPeers()).not.toContain('e');
    expect(e.getPeers()).not.toContain('a');
    expect(e.getPeers()).not.toContain('b');

    a.cleanup_();
    b.cleanup_();
    e.cleanup_();
  });

  it('should find other peers in its group, respecting the dead flag.', function() {
    var mockPing = function(id) {
      var id = id || this.getId();
      switch (id) {
        case 'a':
          return 45005;
        case 'b':
          return 45006;
        case 'c':
          return 1;
      }
    };

    var a = new os.xt.Peer();
    a.setId('a');
    a.setGroup('good');
    a.setTitle('a');
    a.init();
    spyOn(a, 'getLastPing_').andCallFake(mockPing);

    var b = new os.xt.Peer();
    b.setId('b');
    b.setGroup('good');
    b.setTitle('b');
    b.init();
    spyOn(b, 'getLastPing_').andCallFake(mockPing);

    var c = new os.xt.Peer();
    c.setId('c');
    c.setGroup('good');
    c.setTitle('c');
    c.init();
    spyOn(c, 'getLastPing_').andCallFake(mockPing);

    // default: don't find dead peers
    expect(a.getPeers()).not.toContain('a');
    expect(a.getPeers()).toContain('b');
    expect(a.getPeers()).not.toContain('c');

    expect(b.getPeers()).toContain('a');
    expect(b.getPeers()).not.toContain('b');
    expect(b.getPeers()).not.toContain('c');

    // optional: include dead peers
    expect(a.getPeers(undefined, true)).not.toContain('a');
    expect(a.getPeers(undefined, true)).toContain('b');
    expect(a.getPeers(undefined, true)).toContain('c');

    expect(b.getPeers(undefined, true)).toContain('a');
    expect(b.getPeers(undefined, true)).not.toContain('b');
    expect(b.getPeers(undefined, true)).toContain('c');

    a.cleanup_();
    b.cleanup_();
    c.cleanup_();
  });

  it('does not find peers until they are initialized', function() {
    var a = new os.xt.Peer();
    a.setId('a');
    a.setGroup('good');
    a.setTitle('alice');
    a.init();

    var b = new os.xt.Peer();
    b.setId('b');
    b.setGroup('good');
    b.setTitle('bob');

    expect(a.getPeers().length).toBe(0);
    expect(goog.array.find(a.getPeerInfo(), function(maybeB) {
      return maybeB.id === b.getId();
    })).toBeNull();

    b.init();

    expect(a.getPeers()).toContain(b.getId());
    expect(goog.array.find(a.getPeerInfo(), function(maybeB) {
      return maybeB.id === b.getId();
    })).toBeTruthy();

    a.cleanup_();
    b.cleanup_();
  });

  it('should find all other peers in its group with support for a given message type', function() {
    var a = new os.xt.Peer(storage);
    a.setId('a');
    a.setTitle('alice');
    a.init();
    storage.setItem('xt.default.a.types', '["test1", "test2"]');

    var b = new os.xt.Peer(storage);
    b.setId('b');
    b.setTitle('bob');
    b.init();
    storage.setItem('xt.default.b.types', '["test1"]');

    var c = new os.xt.Peer(storage);
    c.setId('c');
    c.setTitle('charlie');
    c.init();
    storage.setItem('xt.default.c.types', '["test2"]');

    expect(a.getPeers('test1')).toContain('b');
    expect(a.getPeers('test1')).not.toContain('c');

    expect(a.getPeers('test2')).toContain('c');
    expect(a.getPeers('test2')).not.toContain('b');

    a.cleanup_();
    b.cleanup_();
    c.cleanup_();
  });

  it('should deliver messages only to handlers that support the message type', function() {
    var storage = window.localStorage;
    var a = new os.xt.Peer(storage);
    a.setId('a');
    a.setTitle('a');
    var skipHandler = new os.xt.MockHandler();
    spyOn(skipHandler, 'process');
    a.addHandler(skipHandler);
    var targetHandler = new os.xt.MockHandler();
    spyOn(targetHandler, 'getTypes').andReturn(['passTest']);
    spyOn(targetHandler, 'process');
    a.addHandler(targetHandler);
    a.init();

    var e = {
      key: 'xt.default.public.testAuthor',
      oldValue: '',
      newValue: JSON.stringify({type: 'passTest', data: 'whatever', time: new Date().getTime()})
    };

    storage.setItem(e.key, e.newValue);
    a.onStorage_(e);

    expect(skipHandler.process).not.toHaveBeenCalled();
    expect(targetHandler.process.calls.length).toBe(1);

    a.cleanup_();
  });

  it('should properly set the ping or keep-alive', function() {
    var a = new os.xt.Peer(storage);

    var target = new Date().getTime() + 1000;

    runs(function() {
      a.setId('a');
      a.setTitle('alice');
      a.init();
    });

    waitsFor(function() {
      return parseInt(storage.getItem('xt.default.a.ping'), 10) > target;
    }, 'ping to occur until it is past the target');

    runs(function() {
      a.cleanup_();
    });
  });

  it('should become master when the current master is shut down properly', function() {
    var a = new os.xt.Peer(storage);
    var b = new os.xt.Peer(storage);
    var notified = false;

    runs(function() {
      a.setId('a');
      a.setTitle('alice');
      a.init();
      b.setId('b');
      b.setTitle('bob');
      b.init();
    });

    waitsFor(function() {
      return storage.getItem('xt.default.master');
    }, 'master to be set');

    runs(function() {
      var master = a.isMaster() ? a : b;
      os.xt.events.DISPATCHER.listenOnce(
          os.xt.events.EventType.forGroup(os.xt.events.EventType.MASTER_APPOINTED, 'default'),
          function() {
            notified = true;
          });

      // shut down the master
      master.cleanup_();
    });

    waitsFor(function() {
      return storage.getItem('xt.default.master');
    }, 'peer to become master');

    runs(function() {
      expect(notified).toBe(true);

      a.cleanup_();
      b.cleanup_();
    });
  });

  it('should become master when the current master dies an unclean death', function() {
    var a = new os.xt.Peer(storage);
    var b = new os.xt.Peer(storage);
    var m = null;

    runs(function() {
      a.setId('a');
      a.setTitle('alice');
      a.init();
      b.setId('b');
      b.setTitle('bob');
      b.init();
    });

    waitsFor(function() {
      m = storage.getItem('xt.default.master');
      return Boolean(m);
    }, 'master to be set');

    runs(function() {
      var master = a.isMaster() ? a : b;

      // stop master updates (not shut down properly)
      master.pingTimer_.stop();
    });

    waitsFor(function() {
      return storage.getItem('xt.default.master') != m;
    }, 'peer to become master');

    runs(function() {
      a.cleanup_();
      b.cleanup_();
    });
  });

  it('should fail gracefully if it does not support a message type', function() {
    var a = new os.xt.Peer();
    a.setId('a');
    a.setTitle('alice');
    a.init();

    var b = new os.xt.Peer();
    b.setId('b');
    b.setTitle('bob');
    b.init();

    // fake a storage event
    var e = {
      key: 'xt.default.a.b',
      oldValue: '',
      newValue: '{"type":"test","data":1234}'
    };

    window.localStorage.setItem(e.key, e.newValue);
    a.onStorage_(e);

    // verify that the message was not handled
    expect(window.localStorage.getItem(e.key)).toBe(e.newValue);

    a.cleanup_();
    b.cleanup_();
    window.localStorage.clear();
  });

  it('should handle messages sent to a specific peer if a handler for the message type exists', function() {
    var storage = window.localStorage;

    var a = new os.xt.Peer(storage);
    a.setId('a');
    a.setTitle('alice');
    a.addHandler(new os.xt.MockHandler());
    a.init();

    var b = new os.xt.Peer(storage);
    b.setId('b');
    b.setTitle('bob');
    b.init();

    b.send('test', 2, 'a');

    // verify that the send worked
    var msg = JSON.parse(storage.getItem('xt.default.a.b'));
    expect(msg.type).toBe('test');
    expect(msg.data).toBe(2);

    // fake a storage event
    var e = {
      key: 'xt.default.a.b',
      oldValue: ''
    };

    e.newValue = storage.getItem(e.key);
    a.onStorage_(e);

    // verify that the message was handled
    expect(os.xt.MockHandler.value).toBe(2);
    // verify that the message was cleaned up
    expect(storage.getItem(e.key)).toBeFalsy();

    // clean up
    os.xt.MockHandler.value = 0;
    a.cleanup_();
    b.cleanup_();
  });

  it('should fail gracefully if it does not support a message type on the public channel', function() {
    // suspend storage events by using actual localStorage
    var a = new os.xt.Peer(window.localStorage);
    a.setId('a');
    a.setTitle('alice');
    a.init();

    var b = new os.xt.Peer(window.localStorage);
    b.setId('b');
    b.setTitle('bob');
    b.init();

    // fake a storage event
    var e = {
      key: 'xt.default.public.b',
      oldValue: '',
      newValue: '{"type":"test","data":1234}'
    };

    window.localStorage.setItem(e.key, e.newValue);
    a.onStorage_(e);

    // verify that the message was not handled
    expect(window.localStorage.getItem(e.key)).toBe(e.newValue);

    a.cleanup_();
    b.cleanup_();
  });

  it('should handle messages sent to the public channel if a handler for the message type exists', function() {
    var storage = window.localStorage;
    storage.clear();

    var a = new os.xt.Peer(storage);
    a.setId('a');
    a.setTitle('alice');
    a.addHandler(new os.xt.MockHandler());
    a.init();

    var b = new os.xt.Peer(storage);
    b.setId('b');
    b.setTitle('bob');
    b.init();

    b.send('test', 2);

    // verify that the send worked
    var msg = JSON.parse(storage.getItem('xt.default.public.b'));
    expect(msg.type).toBe('test');
    expect(msg.data).toBe(2);

    // fake a storage event
    var e = {
      key: 'xt.default.public.b',
      oldValue: ''
    };

    e.newValue = storage.getItem(e.key);
    a.onStorage_(e);

    // verify that the message was handled
    expect(os.xt.MockHandler.value).toBe(2);

    a.cleanup_();
    b.cleanup_();
  });

  it('should handle messages on init', function() {
    var b = new os.xt.Peer(storage);
    b.setId('b');
    b.setTitle('bob');
    b.init();
    b.send('test', 2);

    var a = new os.xt.Peer(storage);
    a.setId('a');
    a.setTitle('alice');
    a.addHandler(new os.xt.MockHandler());
    a.init();

    // verify that the message was handled
    expect(os.xt.MockHandler.value).toBe(2);

    a.cleanup_();
    b.cleanup_();
  });

  it('supports waiting for a peer by ID', function() {
    var a = new os.xt.Peer(storage);
    a.setId('a');
    a.setTitle('Peer A');
    a.init();

    var b = new os.xt.Peer(storage);
    b.setId('b');
    b.setTitle('Peer B');

    var bIsReady = jasmine.createSpy('bIsReady');
    var deferred = null;

    runs(function() {
      deferred = a.waitForPeer('b', null, os.xt.Peer.PING_INTERVAL).addCallback(bIsReady);
      b.init();
    });

    waitsFor(function() {
      return bIsReady.calls.length > 0;
    }, 'peer to become available');

    runs(function() {
      expect(bIsReady.calls.length).toBe(1);
      var bInfo = os.xt.PeerInfo.load(b.getGroup(), b.getId(), storage);
      expect(bInfo).toBeDefined();
      expect(bInfo).not.toBeNull();
      expect(bIsReady.calls[0].args[0]).toEqual(bInfo);
      a.cleanup_();
      b.cleanup_();
    });
  });

  it('supports waiting for a peer by ID and message type', function() {
    var a = new os.xt.Peer(storage);
    a.setId('a');
    a.setTitle('Peer A');
    a.init();

    var b = new os.xt.Peer(storage);
    b.setId('b');
    b.setTitle('Peer B');

    var bIsReady = jasmine.createSpy('bIsReady');
    var twoPings = Date.now() + 2 * os.xt.Peer.PING_INTERVAL;
    var deferred = null;

    runs(function() {
      deferred = a.waitForPeer('b', 'messageFromA', 6 * os.xt.Peer.PING_INTERVAL).addCallback(bIsReady);
      b.init();
    });

    waitsFor(function() {
      return Date.now() > twoPings;
    }, 'two pings');

    runs(function() {
      expect(bIsReady.calls.length).toBe(0);
      b.addHandler({
        getTypes: function() {
          return ['messageFromA'];
        },
        process: function() {}
      });
    });

    waitsFor(function() {
      return deferred.hasFired();
    }, 'deferred object to fire');

    runs(function() {
      expect(bIsReady.calls.length).toBe(1);
      var bInfo = os.xt.PeerInfo.load(b.getGroup(), b.getId(), storage);
      expect(bInfo).toBeDefined();
      expect(bInfo).not.toBeNull();
      expect(bIsReady.calls[0].args[0]).toEqual(bInfo);
      a.cleanup_();
      b.cleanup_();
    });
  });

  it('calls back quickly when the peer of interest can handle the message type', function() {
    var origPing = os.xt.Peer.PING_INTERVAL;
    os.xt.Peer.PING_INTERVAL = 60000;

    var a = new os.xt.Peer(storage);
    a.setId('a');
    a.setTitle('Peer A');
    a.init();

    var bIsReady = jasmine.createSpy('bIsReady');
    var deferred = a.waitForPeer('b', 'messageFromA').addCallback(bIsReady);

    var b = new os.xt.Peer(storage);
    b.setId('b');
    b.setTitle('Peer B');
    b.init();

    var halfSecond = Date.now() + 500;
    waitsFor(function() {
      return Date.now() > halfSecond;
    }, 'half second');

    runs(function() {
      expect(bIsReady).not.toHaveBeenCalled();
      b.addHandler({
        getTypes: function() {
          return ['messageFromA'];
        },
        process: function() {}
      });
    });

    waitsFor(function() {
      return deferred.hasFired();
    }, 'deferred object to fire');

    runs(function() {
      expect(bIsReady.calls.length).toBe(1);
      var bInfo = os.xt.PeerInfo.load(b.getGroup(), b.getId(), storage);
      expect(bInfo).toBeDefined();
      expect(bInfo).not.toBeNull();
      expect(bIsReady.calls[0].args[0]).toEqual(bInfo);
      a.cleanup_();
      b.cleanup_();
      os.xt.Peer.PING_INTERVAL = origPing;
    });
  });

  it('times out waiting for a peer by ID to become available', function() {
    var a = new os.xt.Peer(storage);
    a.setId('a');
    a.setTitle('Peer A');
    a.init();

    var bIsReady = jasmine.createSpy('bIsReady');
    var timedOut = jasmine.createSpy('timedOut');
    var deferred = null;

    runs(function() {
      deferred = a.waitForPeer('b', null, os.xt.Peer.PING_INTERVAL).addCallback(bIsReady).addErrback(timedOut);
    });

    waitsFor(function() {
      return deferred.hasFired();
    }, 'deferred object to fire');

    runs(function() {
      expect(bIsReady.calls.length).toBe(0);
      expect(timedOut.calls.length).toBe(1);
      a.cleanup_();
    });
  });

  it('times out waiting for a peer by ID and message type', function() {
    var a = new os.xt.Peer(storage);
    a.setId('a');
    a.setTitle('Peer A');
    a.init();

    var b = new os.xt.Peer(storage);
    b.setId('b');
    b.setTitle('Peer B');

    var bIsReady = jasmine.createSpy('bIsReady');
    var timedOut = jasmine.createSpy('timedOut');
    var deferred = null;

    runs(function() {
      deferred = a.waitForPeer('b', 'neverHandled', os.xt.Peer.PING_INTERVAL)
          .addCallback(bIsReady)
          .addErrback(timedOut);
      b.init();
    });

    waitsFor(function() {
      return deferred.hasFired();
    }, 'deferred object to fire');

    runs(function() {
      expect(bIsReady.calls.length).toBe(0);
      expect(timedOut.calls.length).toBe(1);
      a.cleanup_();
      b.cleanup_();
    });
  });

  it('times out waiting for peer when ping interval is longer than wait timeout', function() {
    var origInterval = os.xt.Peer.PING_INTERVAL;
    os.xt.Peer.PING_INTERVAL = 60000;

    var a = new os.xt.Peer(storage);
    a.setId('a');
    a.setTitle('Peer A');
    a.init();

    var bIsReady = jasmine.createSpy('bIsReady');
    var timedOut = jasmine.createSpy('timedOut');
    var deferred = null;

    runs(function() {
      deferred = a.waitForPeer('b', null, 100).addCallback(bIsReady).addErrback(timedOut);
    });

    waitsFor(function() {
      return deferred.hasFired();
    }, 'wait to expire');

    runs(function() {
      expect(timedOut.calls.length).toBe(1);
      expect(bIsReady.calls.length).toBe(0);
      os.xt.Peer.PING_INTERVAL = origInterval;
      a.cleanup_();
    });
  });

  it('supports waiting for multiple peers by ID', function() {
    var a = new os.xt.Peer(storage);
    a.setId('a');
    a.setTitle('alice');
    a.init();
    var peerIsReady = jasmine.createSpy('peerIsReady');
    a.waitForPeer('b').addCallback(peerIsReady);
    a.waitForPeer('c').addCallback(peerIsReady);

    var b = new os.xt.Peer(storage);
    b.setId('b');
    b.setTitle('bob');

    var c = new os.xt.Peer(storage);
    c.setId('c');
    c.setTitle('charlie');

    var start = Date.now();

    waitsFor(function() {
      return Date.now() > start + os.xt.Peer.PING_INTERVAL + 100;
    }, 'ping');

    runs(function() {
      b.init();
    });

    waitsFor(function() {
      return peerIsReady.calls.length === 1;
    }, 'peer to become available', os.xt.Peer.PING_INTERVAL);

    runs(function() {
      expect(peerIsReady.calls.length).toBe(1);
      expect(peerIsReady.calls[0].args[0].id).toBe(b.getId());
      start = Date.now();
    });

    waitsFor(function() {
      return Date.now() > start + os.xt.Peer.PING_INTERVAL + 100;
    }, 'ping');

    runs(function() {
      c.init();
    });

    waitsFor(function() {
      return peerIsReady.calls.length === 2;
    }, 'peer to become available');

    runs(function() {
      expect(peerIsReady.calls.length).toBe(2);
      expect(peerIsReady.calls[1].args[0].id).toBe(c.getId());
      a.cleanup_();
      b.cleanup_();
      c.cleanup_();
    });
  });

  it('does not leave lingering timers running', function() {
    expect(storage.length).toBe(0);

    var p = new os.xt.Peer(storage);
    p.setId('lingerer');
    p.setGroup('lingering');
    p.init();

    runs(function() {
      p.cleanup_();
    });

    var start = null;
    waitsFor(function() {
      if (!start) {
        start = Date.now();
      }
      return start + os.xt.Peer.PING_INTERVAL * 4 < Date.now();
    }, 'three pings');

    runs(function() {
      expect(storage.length).toBe(0);
      if (storage.length > 0) {
        console.log('freakin\' lingerers, man:\n' + stringifyStorage());
      }
    });
  });

  it('should not explode when sending a very, very fat string via xt', function() {
    var storage = window.localStorage;

    var a = new os.xt.Peer(storage);
    a.setId('a');
    a.setTitle('alice');
    a.addHandler(new os.xt.MockHandler());
    a.init();

    var fatString = 'asdfg'.repeat(1e7);
    var sendBinding = a.send.bind(undefined, 'test', fatString);
    expect(a.send).not.toThrow();

    // clean up
    os.xt.MockHandler.value = 0;
    a.cleanup_();
  });
});
