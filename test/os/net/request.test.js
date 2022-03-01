goog.require('goog.Uri');
goog.require('goog.array');
goog.require('goog.net.EventType');
goog.require('os.net');
goog.require('os.net.ExtDomainHandler');
goog.require('os.net.MockModifier');
goog.require('os.net.Request');
goog.require('os.net.RequestHandlerFactory');
goog.require('os.net.SameDomainHandler');


describe('os.net.Request', function() {
  const Uri = goog.module.get('goog.Uri');
  const EventType = goog.module.get('goog.net.EventType');
  const net = goog.module.get('os.net');
  const {default: ExtDomainHandler} = goog.module.get('os.net.ExtDomainHandler');
  const MockModifier = goog.module.get('os.net.MockModifier');
  const {default: Request} = goog.module.get('os.net.Request');
  const RequestHandlerFactory = goog.module.get('os.net.RequestHandlerFactory');
  const {default: SameDomainHandler} = goog.module.get('os.net.SameDomainHandler');

  RequestHandlerFactory.addHandler(SameDomainHandler);

  it('should optionally handle the uri in the constructor', function() {
    var r = new Request(window.location.toString());
    expect(r.getUri().toString()).toBe(window.location.toString());
    expect(r.getMethod()).toBe(Request.METHOD_GET);
  });

  it('should optionally handle the method in the constructor', function() {
    var r = new Request(
        window.location.toString(), Request.METHOD_POST);
    expect(r.getUri().toString()).toBe(window.location.toString());
    expect(r.getMethod()).toBe(Request.METHOD_POST);
  });

  it('should successfully execute a request', function() {
    var r = new Request(window.location.toString());
    var fired = false;
    var listener = function(e) {
      fired = true;
    };

    runs(function() {
      r.listen(EventType.SUCCESS, listener);
      r.load();
    });

    waitsFor(function() {
      return fired;
    }, 'valid response');

    runs(function() {
      r.unlisten(EventType.SUCCESS, listener);
      expect(r.getResponse()).not.toBe(null);
    });
  });

  it('should be able to defeat the browser cache', function() {
    var r = new Request(window.location.toString());
    var fired = false;
    var listener = function(e) {
      expect(r.modUri_.getParameterValue('_cd')).not.toBeNull();
      fired = true;
    };

    runs(function() {
      r.listen(EventType.SUCCESS, listener);
      r.load(true);
    });

    waitsFor(function() {
      return fired;
    }, 'valid response');

    runs(function() {
      r.unlisten(EventType.SUCCESS, listener);
      expect(r.getResponse()).not.toBe(null);
    });
  });

  it('should throw an error when trying to load a URL that cannot be handled', function() {
    var r = new Request('https://bogus.local');
    var fn = function() {
      r.load();
    };

    RequestHandlerFactory.removeHandler(ExtDomainHandler);
    expect(fn).toThrow();
  });

  it('should properly handle request errors', function() {
    var r = new Request();
    var fired = false;
    var listener = function(e) {
      fired = true;
    };

    runs(function() {
      var uri = new Uri(window.location.toString());
      uri.setPath('/' + (new Date().getTime()) + '.xml');
      r.setUri(uri);
      r.listen(EventType.ERROR, listener);
      r.load();
    });

    waitsFor(function() {
      return fired;
    }, 'error response');

    runs(function() {
      r.unlisten(EventType.ERROR, listener);
      expect(r.getErrors().length).not.toBe(0);
      expect(r.getErrors()[0].length).not.toBe(0);
    });
  });

  it('should keep modifiers sorted by <Priority, ID>  as they are added', function() {
    var r = new Request(window.location.toString());
    var m = new MockModifier();
    var m2 = new MockModifier();

    m2.setId('mock2');
    m2.setPriority(2);

    r.addModifier(m);
    r.addModifier(m2);

    expect(r.modifiers_.indexOf(m2)).toBe(0);
    expect(r.modifiers_.indexOf(m)).toBe(1);
  });

  it('should be able to remove modifiers', function() {
    var r = new Request(window.location.toString());
    var m = new MockModifier();
    var m2 = new MockModifier();

    m2.setId('mock2');
    m2.setPriority(2);

    var startCount = r.modifiers_.length;

    r.addModifier(m);
    r.addModifier(m2);

    r.removeModifier(m2);

    expect(r.modifiers_.length).toBe(startCount + 1);
    expect(r.modifiers_).toContain(m);
  });

  it('should prevent the addition of modifiers with the same id', function() {
    var r = new Request(window.location.toString());
    var m = new MockModifier();


    r.addModifier(m);

    var fn = function() {
      r.addModifier(m);
    };

    expect(fn).toThrow();
  });

  it('should run the modifiers on the URI before making the request', function() {
    var r = new Request(window.location.toString());
    var m = new MockModifier();
    var m2 = new MockModifier();

    m2.setId('mock2');
    m2.setPriority(2);

    r.addModifier(m);
    r.addModifier(m2);

    var fired = false;
    var listener = function(e) {
      expect(r.modUri_.getParameterValue('mock1')).toBe('1');
      expect(r.modUri_.getParameterValue('mock2')).toBe('2');
      fired = true;
    };

    runs(function() {
      r.listen(EventType.SUCCESS, listener);
      r.load();
    });

    waitsFor(function() {
      return fired;
    }, 'valid response');

    runs(function() {
      r.unlisten(EventType.SUCCESS, listener);
      expect(r.getResponse()).not.toBeNull();
    });
  });

  it('should throw an error when trying to modify a read-only URI', function() {
    var r = new Request(window.location.toString());
    var m = new MockModifier();

    r.addModifier(m);
    r.getUri().setReadOnly(true);

    var fn = function() {
      r.load();
    };

    expect(fn).toThrow();
  });

  it('should be able to make multiple requests', function() {
    var r = new Request(window.location.toString());
    var count = 0;
    var listener = function(e) {
      if (count === 0) {
        r.load(true);
      }
      count++;
    };

    runs(function() {
      r.listen(EventType.SUCCESS, listener);
      r.load();
    });

    waitsFor(function() {
      return count == 2;
    }, 'valid response');

    runs(function() {
      r.unlisten(EventType.SUCCESS, listener);
      expect(r.getResponse()).not.toBe(null);
    });
  });

  it('should validate the response', function() {
    var r = new Request(window.location.toString());
    r.setValidator(function(value) {
      return 'Error!';
    });

    var count = 0;
    var listener = function() {
      count++;
    };

    r.listen(EventType.ERROR, listener);

    runs(function() {
      r.load();
    });

    waitsFor(function() {
      return count === 1;
    }, 'request to error out');

    runs(function() {
      expect(r.getErrors()).toContain('Error!');
    });
  });

  it('should not use default validators when not enabled', function() {
    net.registerDefaultValidator((value) => 'Error!');

    var r = new Request(window.location.toString());

    var count = 0;
    var listener = function() {
      count++;
    };

    r.listen(EventType.SUCCESS, listener);

    runs(function() {
      r.load();
    });

    waitsFor(function() {
      return count === 1;
    }, 'request to succeed');

    runs(function() {
      expect(r.getErrors()).toBeNull();
    });
  });

  it('should use default validators when enabled', function() {
    net.registerDefaultValidator((value) => 'Error!');

    var r = new Request(window.location.toString());
    r.setUseDefaultValidators(true);

    var count = 0;
    var listener = function() {
      count++;
    };

    r.listen(EventType.ERROR, listener);

    runs(function() {
      r.load();
    });

    waitsFor(function() {
      return count === 1;
    }, 'request to error out');

    runs(function() {
      expect(r.getErrors()).toContain('Error!');
    });
  });

  describe('promise', function() {
    it('should load a request and resolve to the response', function() {
      var r = new Request(window.location.toString());
      var count = 0;

      runs(function() {
        r.getPromise().then(function(response) {
          count++;
          expect(response).toContain('Karma');
        });
      });

      waitsFor(function() {
        return count === 1;
      }, 'request to complete');

      // verify it cleans up properly
      runs(function() {
        expect(r.eventTargetListeners_.typeCount_).toBe(0);
      });
    });

    it('should load a request and reject on errors', function() {
      var r = new Request('http://localhost/doesnotexist.html');
      var count = 0;

      runs(function() {
        r.getPromise().thenCatch(function(err) {
          count++;
          expect(err.length).toBe(1);
        });
      });

      waitsFor(function() {
        return count > 0;
      }, 'request to error out');

      // verify it cleans up properly
      runs(function() {
        expect(r.eventTargetListeners_.typeCount_).toBe(0);
      });
    });

    it('should abort the request when the promise is cancelled', function() {
      var r = new Request(window.location.toString());
      spyOn(r, 'abort').andCallThrough();

      var count = 0;

      runs(function() {
        var p = r.getPromise().thenCatch(function(err) {
          count++;
          expect(r.abort).toHaveBeenCalled();
        });
        p.cancel();
      });

      waitsFor(function() {
        return count > 0;
      }, 'request to error out');

      // verify it cleans up properly
      runs(function() {
        expect(r.eventTargetListeners_.typeCount_).toBe(0);
      });
    });

    it('should reject the promise when the request is aborted', function() {
      var r = new Request(window.location.toString());
      var count = 0;

      runs(function() {
        r.getPromise().thenCatch(function(err) {
          count++;
        });
        r.abort();
      });

      waitsFor(function() {
        return count > 0;
      }, 'request to abort');

      // verify it cleans up properly
      runs(function() {
        expect(r.eventTargetListeners_.typeCount_).toBe(0);
      });
    });
  });
});
