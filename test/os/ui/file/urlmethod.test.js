goog.require('os.alert.AlertManager');
goog.require('os.events.EventType');
goog.require('os.file.File');
goog.require('os.net.Request');
goog.require('os.net.RequestHandlerFactory');
goog.require('os.net.SameDomainHandler');
goog.require('os.ui.file.method.UrlMethod');

describe('os.ui.file.method.UrlMethod', function() {
  const AlertManager = goog.module.get('os.alert.AlertManager');
  const EventType = goog.module.get('os.events.EventType');
  const OSFile = goog.module.get('os.file.File');
  const Request = goog.module.get('os.net.Request');
  const RequestHandlerFactory = goog.module.get('os.net.RequestHandlerFactory');
  const SameDomainHandler = goog.module.get('os.net.SameDomainHandler');
  const {default: UrlMethod} = goog.module.get('os.ui.file.method.UrlMethod');

  const windowSelector = 'div[label="Import URL"]';

  RequestHandlerFactory.addHandler(SameDomainHandler);
  var testUrl = '/base/test/resources/foo.txt';

  it('gets the url', function() {
    var method = new UrlMethod();
    expect(method.getUrl()).toBeNull();

    method.setUrl(testUrl);
    expect(method.getUrl()).toBe(testUrl);
  });

  it('is always supported', function() {
    var method = new UrlMethod();
    expect(method.isSupported()).toBe(true);
  });

  it('should load a file from a url', function() {
    var method = new UrlMethod();
    method.setUrl(testUrl);

    var methodComplete = false;
    var onComplete = function(event) {
      methodComplete = true;
    };

    method.listenOnce(EventType.COMPLETE, onComplete);
    method.loadFile();

    waitsFor(function() {
      return methodComplete == true;
    }, 'url to load');

    runs(function() {
      expect(method.getFile()).not.toBeNull();

      var file = method.getFile();
      file.convertContentToString();

      expect(file.getFileName()).toBe('foo.txt');
      expect(file.getContent()).toBe('bar');
      expect(file.getUrl()).toBe(testUrl);
      expect(file.getContentType()).toBe('text/plain');
    });
  });

  it('should prompt for a url if not available', function() {
    var method = new UrlMethod();
    method.loadFile();

    waitsFor(() => !!document.querySelector(windowSelector), 'window to open');

    runs(() => {
      const bodyEl = document.querySelector(`${windowSelector} .modal-body`);
      const scope = $(bodyEl).scope();
      expect(scope).toBeDefined();
      expect(scope.urlImport).toBeDefined();

      scope.urlImport.close();
    });

    waitsFor(() => !document.querySelector(windowSelector), 'window to close');
  });

  it('should dispatch a cancel event if url is not defined', function() {
    var method = new UrlMethod();

    spyOn(method, 'dispatchEvent');

    method.loadUrl();

    waitsFor(function() {
      return method.dispatchEvent.calls.length > 0;
    }, 'event to be dispatched');

    runs(function() {
      expect(method.dispatchEvent.calls.length).toBe(1);
      expect(method.dispatchEvent).toHaveBeenCalledWith(EventType.CANCEL);
    });
  });

  it('should dispatch an error when the url load fails', function() {
    var method = new UrlMethod();
    method.setUrl('/this/is/bogus');

    spyOn(AlertManager.getInstance(), 'sendAlert');
    spyOn(method, 'dispatchEvent');

    method.loadFile();

    waitsFor(function() {
      return method.dispatchEvent.calls.length > 0;
    }, 'event to be dispatched');

    runs(function() {
      expect(AlertManager.getInstance().sendAlert).toHaveBeenCalled();
      expect(method.dispatchEvent.calls.length).toBe(1);
      expect(method.dispatchEvent).toHaveBeenCalledWith(EventType.ERROR);
    });
  });

  it('supports clone', function() {
    var method = new UrlMethod();
    var method2 = method.clone();

    expect(method2).not.toBe(method);
    expect(method2 instanceof UrlMethod).toBe(true);
  });

  it('should dispose of a url method', function() {
    var method = new UrlMethod();
    method.setFile(new OSFile());
    method.request_ = new Request();

    method.dispose();

    expect(method.getFile()).toBeNull();
    expect(method.request_).toBeNull();
  });
});
