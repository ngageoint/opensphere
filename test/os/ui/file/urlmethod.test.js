goog.require('os.events.EventType');
goog.require('os.file.File');
goog.require('os.net.Request');
goog.require('os.net.RequestHandlerFactory');
goog.require('os.net.SameDomainHandler');
goog.require('os.ui.file.method.UrlMethod');

describe('os.ui.file.method.UrlMethod', function() {
  os.net.RequestHandlerFactory.addHandler(os.net.SameDomainHandler);
  var testUrl = '/base/test/resources/foo';

  it('gets the url', function() {
    var method = new os.ui.file.method.UrlMethod();
    expect(method.getUrl()).toBeNull();

    method.setUrl(testUrl);
    expect(method.getUrl()).toBe(testUrl);
  });

  it('is always supported', function() {
    var method = new os.ui.file.method.UrlMethod();
    expect(method.isSupported()).toBe(true);
  });

  it('should load a file from a url', function() {
    var method = new os.ui.file.method.UrlMethod();
    method.setUrl(testUrl);

    var methodComplete = false;
    var onComplete = function(event) {
      methodComplete = true;
    };

    method.listenOnce(os.events.EventType.COMPLETE, onComplete);
    method.loadFile();

    waitsFor(function() {
      return methodComplete == true;
    }, 'url to load');

    runs(function() {
      expect(method.getFile()).not.toBeNull();

      var file = method.getFile();
      expect(file.getFileName()).toBe('foo');
      expect(file.getContent()).toBe('bar');
      expect(file.getUrl()).toBe(testUrl);
      expect(file.getContentType()).toBeNull();
    });
  });

  it('should prompt for a url if not available', function() {
    var method = new os.ui.file.method.UrlMethod();
    spyOn(os.ui.window, 'create');

    method.loadFile();

    expect(os.ui.window.create).toHaveBeenCalled();
    expect(os.ui.window.create.mostRecentCall.args[1]).toEqual('<urlimport></urlimport>');
  });

  it('should dispatch a cancel event if url is not defined', function() {
    var method = new os.ui.file.method.UrlMethod();

    spyOn(method, 'dispatchEvent');

    method.loadUrl();

    waitsFor(function() {
      return method.dispatchEvent.calls.length > 0;
    }, 'event to be dispatched');

    runs(function() {
      expect(method.dispatchEvent.calls.length).toBe(1);
      expect(method.dispatchEvent).toHaveBeenCalledWith(os.events.EventType.CANCEL);
    });
  });

  it('should dispatch an error when the url load fails', function() {
    var method = new os.ui.file.method.UrlMethod();
    method.setUrl('/this/is/bogus');

    spyOn(os.alertManager, 'sendAlert');
    spyOn(method, 'dispatchEvent');

    method.loadFile();

    waitsFor(function() {
      return method.dispatchEvent.calls.length > 0;
    }, 'event to be dispatched');

    runs(function() {
      expect(os.alertManager.sendAlert).toHaveBeenCalled();
      expect(method.dispatchEvent.calls.length).toBe(1);
      expect(method.dispatchEvent).toHaveBeenCalledWith(os.events.EventType.ERROR);
    });
  });

  it('supports clone', function() {
    var method = new os.ui.file.method.UrlMethod();
    var method2 = method.clone();

    expect(method2).not.toBe(method);
    expect(method2 instanceof os.ui.file.method.UrlMethod).toBe(true);
  });

  it('should dispose of a url method', function() {
    var method = new os.ui.file.method.UrlMethod();
    method.setFile(new os.file.File());
    method.request_ = new os.net.Request();

    method.dispose();

    expect(method.getFile()).toBeNull();
    expect(method.request_).toBeNull();
  });
});
