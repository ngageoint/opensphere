goog.require('goog.Uri');
goog.require('goog.array');
goog.require('os.net.ExtDomainHandler');
goog.require('os.net.Request');
goog.require('os.net.RequestHandlerFactory');
goog.require('os.net.SameDomainHandler');


// simple modifier implementations
os.net.MockModifier = function() {
  this.id_ = 'mock1';
  this.priority_ = 1;
};

os.net.MockModifier.prototype.getId = function() {
  return this.id_;
};

os.net.MockModifier.prototype.setId = function(id) {
  this.id_ = id;
};

os.net.MockModifier.prototype.getPriority = function() {
  return this.priority_;
};

os.net.MockModifier.prototype.setPriority = function(p) {
  this.priority_ = p;
};

os.net.MockModifier.prototype.modify = function(uri) {
  uri.setParameterValue(this.getId(), this.getPriority());
};

describe('os.net.Request', function() {
  os.net.RequestHandlerFactory.addHandler(os.net.SameDomainHandler);

  it('should optionally handle the uri in the constructor', function() {
    var r = new os.net.Request(window.location.toString());
    expect(r.getUri().toString()).toBe(window.location.toString());
    expect(r.getMethod()).toBe(os.net.Request.METHOD_GET);
  });

  it('should optionally handle the method in the constructor', function() {
    var r = new os.net.Request(
        window.location.toString(), os.net.Request.METHOD_POST);
    expect(r.getUri().toString()).toBe(window.location.toString());
    expect(r.getMethod()).toBe(os.net.Request.METHOD_POST);
  });

  it('should successfully execute a request', function() {
    var r = new os.net.Request(window.location.toString());
    var fired = false;
    var listener = function(e) {
      fired = true;
    };

    runs(function() {
      r.listen(goog.net.EventType.SUCCESS, listener);
      r.load();
    });

    waitsFor(function() {
      return fired;
    }, 'valid response');

    runs(function() {
      r.unlisten(goog.net.EventType.SUCCESS, listener);
      expect(r.getResponse()).not.toBe(null);
    });
  });

  it('should be able to defeat the browser cache', function() {
    var r = new os.net.Request(window.location.toString());
    var fired = false;
    var listener = function(e) {
      expect(r.modUri_.getParameterValue('_cd')).not.toBeNull();
      fired = true;
    };

    runs(function() {
      r.listen(goog.net.EventType.SUCCESS, listener);
      r.load(true);
    });

    waitsFor(function() {
      return fired;
    }, 'valid response');

    runs(function() {
      r.unlisten(goog.net.EventType.SUCCESS, listener);
      expect(r.getResponse()).not.toBe(null);
    });
  });

  it('should throw an error when trying to load a URL that cannot be handled', function() {
    var r = new os.net.Request('https://bogus.local');
    var fn = function() {
      r.load();
    };

    goog.array.remove(os.net.RequestHandlerFactory.list_, os.net.ExtDomainHandler);
    expect(fn).toThrow();
  });

  it('should properly handle request errors', function() {
    var r = new os.net.Request();
    var fired = false;
    var listener = function(e) {
      fired = true;
    };

    runs(function() {
      var uri = new goog.Uri(window.location.toString());
      uri.setPath('/' + (new Date().getTime()) + '.xml');
      r.setUri(uri);
      r.listen(goog.net.EventType.ERROR, listener);
      r.load();
    });

    waitsFor(function() {
      return fired;
    }, 'error response');

    runs(function() {
      r.unlisten(goog.net.EventType.ERROR, listener);
      expect(r.getErrors().length).not.toBe(0);
      expect(r.getErrors()[0].length).not.toBe(0);
    });
  });

  it('should keep modifiers sorted by <Priority, ID>  as they are added', function() {
    var r = new os.net.Request(window.location.toString());
    var m = new os.net.MockModifier();
    var m2 = new os.net.MockModifier();

    m2.setId('mock2');
    m2.setPriority(2);

    r.addModifier(m);
    r.addModifier(m2);

    expect(r.modifiers_.indexOf(m2)).toBe(0);
    expect(r.modifiers_.indexOf(m)).toBe(1);
  });

  it('should be able to remove modifiers', function() {
    var r = new os.net.Request(window.location.toString());
    var m = new os.net.MockModifier();
    var m2 = new os.net.MockModifier();

    m2.setId('mock2');
    m2.setPriority(2);

    r.addModifier(m);
    r.addModifier(m2);

    r.removeModifier(m2);

    // there's a VariableReplacer modifier and a URL modifier added by default, so 3
    expect(r.modifiers_.length).toBe(3);
    expect(r.modifiers_).toContain(m);
  });

  it('should prevent the addition of modifiers with the same id', function() {
    var r = new os.net.Request(window.location.toString());
    var m = new os.net.MockModifier();


    r.addModifier(m);

    var fn = function() {
      r.addModifier(m);
    };

    expect(fn).toThrow();
  });

  it('should run the modifiers on the URI before making the request', function() {
    var r = new os.net.Request(window.location.toString());
    var m = new os.net.MockModifier();
    var m2 = new os.net.MockModifier();

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
      r.listen(goog.net.EventType.SUCCESS, listener);
      r.load();
    });

    waitsFor(function() {
      return fired;
    }, 'valid response');

    runs(function() {
      r.unlisten(goog.net.EventType.SUCCESS, listener);
      expect(r.getResponse()).not.toBeNull();
    });
  });

  it('should throw an error when trying to modify a read-only URI', function() {
    var r = new os.net.Request(window.location.toString());
    var m = new os.net.MockModifier();

    r.addModifier(m);
    r.getUri().setReadOnly(true);

    var fn = function() {
      r.load();
    };

    expect(fn).toThrow();
  });

  it('should be able to make multiple requests', function() {
    var r = new os.net.Request(window.location.toString());
    var count = 0;
    var listener = function(e) {
      if (count === 0) {
        r.load(true);
      }
      count++;
    };

    runs(function() {
      r.listen(goog.net.EventType.SUCCESS, listener);
      r.load();
    });

    waitsFor(function() {
      return count == 2;
    }, 'valid response');

    runs(function() {
      r.unlisten(goog.net.EventType.SUCCESS, listener);
      expect(r.getResponse()).not.toBe(null);
    });
  });

  it('should validate the response', function() {
    var r = new os.net.Request(window.location.toString());
    r.setValidator(function(value) {
      return 'Error!';
    });

    var count = 0;
    var listener = function() {
      count++;
    };

    r.listen(goog.net.EventType.ERROR, listener);

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
      var r = new os.net.Request(window.location.toString());
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
      var r = new os.net.Request('http://bogus.local');
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
      var r = new os.net.Request(window.location.toString());
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
      var r = new os.net.Request(window.location.toString());
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
