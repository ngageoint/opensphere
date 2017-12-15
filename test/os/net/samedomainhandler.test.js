goog.require('os.net.SameDomainHandler');
goog.require('goog.Uri');
goog.require('goog.net.EventType');

describe('os.net.SameDomainHandler', function() {
  var sdh = new os.net.SameDomainHandler();

  it('should handle absolute uris', function() {
    var uri = new goog.Uri(window.location.toString());
    expect(sdh.handles('GET', uri)).toBe(true);
    expect(sdh.handles('POST', uri)).toBe(true);
    expect(sdh.handles('PUT', uri)).toBe(true);
    expect(sdh.handles('DELETE', uri)).toBe(true);
  });

  it('should handle relative uris', function() {
    var url = window.location.toString();
    var i = url.indexOf('//') + 2;
    i = url.indexOf('/', i);

    var uri = new goog.Uri(url.substring(i));
    expect(sdh.handles('GET', uri)).toBe(true);
    expect(sdh.handles('POST', uri)).toBe(true);
    expect(sdh.handles('PUT', uri)).toBe(true);
    expect(sdh.handles('DELETE', uri)).toBe(true);
  });

  it('should not handle remote uris', function() {
    var uri = new goog.Uri('http://www.google.com');

    expect(sdh.handles('GET', uri)).toBe(false);
    expect(sdh.handles('POST', uri)).toBe(false);
    expect(sdh.handles('PUT', uri)).toBe(false);
    expect(sdh.handles('DELETE', uri)).toBe(false);
  });

  it('should not handle local file uris', function() {
    var uri = new goog.Uri('local://testfileurl');

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
      var uri = new goog.Uri(window.location.toString());
      sdh.addEventListener(goog.net.EventType.SUCCESS, listener);
      sdh.execute('GET', uri);
    });

    waitsFor(function() {
      return fired;
    }, 'valid response');

    runs(function() {
      sdh.removeEventListener(goog.events.EventType.SUCCESS, listener);
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
      var uri = new goog.Uri(window.location.toString());
      uri.setPath('/' + (new Date().getTime()) + '.xml');
      sdh.addEventListener(goog.net.EventType.ERROR, listener);
      sdh.execute('GET', uri);
    });

    waitsFor(function() {
      return fired;
    }, 'error response');

    runs(function() {
      sdh.removeEventListener(goog.events.EventType.ERROR, listener);
      expect(sdh.getStatusCode()).toBe(404);
      expect(sdh.req.getLastErrorCode()).toBe(6);
      expect(sdh.getErrors()).not.toBe(null);
    });
  });

  it('should not blow away headers when method is POST', function() {
    // hardly black box, but that's the api and this is javascript
    var headers = {'Test': 'i-want-to-live'};
    var uri = new goog.Uri(window.location.toString());
    sdh.buildRequest();

    spyOn(sdh.req, 'send');

    sdh.execute('POST', uri, headers);

    expect(sdh.req.send).toHaveBeenCalled();
    var sentHeaders = sdh.req.send.mostRecentCall.args[3];
    expect(sentHeaders['Test']).toBe('i-want-to-live');
  });
});
