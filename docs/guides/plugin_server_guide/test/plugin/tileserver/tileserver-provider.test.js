goog.require('goog.Promise');
goog.require('os.net.Request');
goog.require('plugin.tileserver');
goog.require('plugin.tileserver.Tileserver');

describe('plugin.tileserver.Tileserver', function() {
  const Promise = goog.module.get('goog.Promise');
  const {default: Request} = goog.module.get('os.net.Request');

  const {ID} = goog.module.get('plugin.tileserver');
  const {default: Tileserver} = goog.module.get('plugin.tileserver.Tileserver');

  it('should configure properly', function() {
    var p = new Tileserver();
    var conf = {
      type: ID,
      label: 'Test Server',
      url: 'http://localhost/doesnotexist.json'
    };

    p.configure(conf);

    expect(p.getLabel()).toBe(conf.label);
    expect(p.getUrl()).toBe(conf.url);
  });

  it('should load valid JSON', function() {
    var p = new Tileserver();
    p.setUrl('/something');

    // we're going to spy on the getPromise method and return a promise resolving
    // to valid JSON
    spyOn(Request.prototype, 'getPromise').andReturn(Promise.resolve('[]'));

    spyOn(p, 'onLoad').andCallThrough();
    spyOn(p, 'onError').andCallThrough();

    runs(function() {
      p.load();
    });

    waitsFor(function() {
      return p.onLoad.calls.length;
    });

    runs(function() {
      expect(p.onLoad).toHaveBeenCalled();
      expect(p.onError).not.toHaveBeenCalled();
    });
  });

  it('should error on invalid JSON', function() {
    var p = new Tileserver();
    p.setUrl('/something');

    // we're going to spy on the getPromise method and return a promise resolving
    // to invalid JSON
    spyOn(Request.prototype, 'getPromise').andReturn(Promise.resolve('[wut'));

    spyOn(p, 'onLoad').andCallThrough();
    spyOn(p, 'onError').andCallThrough();

    runs(function() {
      p.load();
    });

    waitsFor(function() {
      return p.onLoad.calls.length;
    });

    runs(function() {
      expect(p.onLoad).toHaveBeenCalled();
      expect(p.onError).toHaveBeenCalled();
    });
  });

  it('should error on request error', function() {
    var p = new Tileserver();
    p.setUrl('/something');

    // we're going to spy on the getPromise method and return a promise rejecting
    // with errors
    spyOn(Request.prototype, 'getPromise').andReturn(
        // request rejects with arrays of all errors that occurred
        Promise.reject(['something awful happend']));

    spyOn(p, 'onLoad').andCallThrough();
    spyOn(p, 'onError').andCallThrough();

    runs(function() {
      p.load();
    });

    waitsFor(function() {
      return p.onError.calls.length;
    });

    runs(function() {
      expect(p.onLoad).not.toHaveBeenCalled();
      expect(p.onError).toHaveBeenCalled();
    });
  });
});
