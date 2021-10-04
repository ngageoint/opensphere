goog.require('goog.Uri');
goog.require('goog.events.EventType');
goog.require('goog.net.EventType');
goog.require('os.net.SameDomainHandler');

describe('os.net.SameDomainHandler', function() {
  const Uri = goog.module.get('goog.Uri');
  const GoogEventType = goog.module.get('goog.events.EventType');
  const EventType = goog.module.get('goog.net.EventType');
  const {default: SameDomainHandler} = goog.module.get('os.net.SameDomainHandler');

  var sdh = new SameDomainHandler();

  it('should handle absolute uris', function() {
    var uri = new Uri(window.location.toString());
    expect(sdh.handles('GET', uri)).toBe(true);
    expect(sdh.handles('POST', uri)).toBe(true);
    expect(sdh.handles('PUT', uri)).toBe(true);
    expect(sdh.handles('DELETE', uri)).toBe(true);
  });

  it('should handle relative uris', function() {
    var url = window.location.toString();
    var i = url.indexOf('//') + 2;
    i = url.indexOf('/', i);

    var uri = new Uri(url.substring(i));
    expect(sdh.handles('GET', uri)).toBe(true);
    expect(sdh.handles('POST', uri)).toBe(true);
    expect(sdh.handles('PUT', uri)).toBe(true);
    expect(sdh.handles('DELETE', uri)).toBe(true);
  });

  it('should not handle remote uris', function() {
    var uri = new Uri('http://www.google.com');

    expect(sdh.handles('GET', uri)).toBe(false);
    expect(sdh.handles('POST', uri)).toBe(false);
    expect(sdh.handles('PUT', uri)).toBe(false);
    expect(sdh.handles('DELETE', uri)).toBe(false);
  });

  it('should not handle local file uris', function() {
    var uri = new Uri('local://testfileurl');

    expect(sdh.handles('GET', uri)).toBe(false);
    expect(sdh.handles('POST', uri)).toBe(false);
    expect(sdh.handles('PUT', uri)).toBe(false);
    expect(sdh.handles('DELETE', uri)).toBe(false);
  });

  it('should successfully execute a request', function() {
    var fired = false;
    var listener = function(e) {
      fired = true;
    };

    runs(function() {
      var uri = new Uri(window.location.toString());
      sdh.addEventListener(EventType.SUCCESS, listener);
      sdh.execute('GET', uri);
    });

    waitsFor(function() {
      return fired;
    }, 'valid response');

    runs(function() {
      sdh.removeEventListener(GoogEventType.SUCCESS, listener);
      expect(sdh.getStatusCode()).toBe(200);
      expect(sdh.req.getLastErrorCode()).toBe(0);
      expect(sdh.getErrors()).toBe(null);
    });
  });

  it('should error correctly on bad requests', function() {
    var fired = false;

    var listener = function(e) {
      fired = true;
    };

    runs(function() {
      var uri = new Uri(window.location.toString());
      uri.setPath('/' + (new Date().getTime()) + '.xml');
      sdh.addEventListener(EventType.ERROR, listener);
      sdh.execute('GET', uri);
    });

    waitsFor(function() {
      return fired;
    }, 'error response');

    runs(function() {
      sdh.removeEventListener(GoogEventType.ERROR, listener);
      expect(sdh.getStatusCode()).toBe(404);
      expect(sdh.req.getLastErrorCode()).toBe(6);
      expect(sdh.getErrors()).not.toBe(null);
    });
  });

  it('should not blow away headers when method is POST', function() {
    // hardly black box, but that's the api and this is javascript
    var headers = {'Test': 'i-want-to-live'};
    var uri = new Uri(window.location.toString());
    sdh.buildRequest();

    spyOn(sdh.req, 'send');

    sdh.execute('POST', uri, headers);

    expect(sdh.req.send).toHaveBeenCalled();
    var sentHeaders = sdh.req.send.mostRecentCall.args[3];
    expect(sentHeaders['Test']).toBe('i-want-to-live');
  });

  it('should return lower case response headers', function() {
    const originalHeaders = {
      'Test-Key': 'Test Value'
    };

    spyOn(sdh.req, 'getResponseHeaders').andReturn(originalHeaders);

    const headers = sdh.getResponseHeaders();
    expect(headers['test-key']).toBe('Test Value');
    expect(headers['Test-Key']).toBeUndefined();
  });
});
