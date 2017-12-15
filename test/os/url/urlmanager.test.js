goog.require('os.structs.EventType');
goog.require('os.url.UrlManager');
goog.require('goog.events.EventTarget');
goog.require('goog.object');


describe('os.url.UrlManager', function() {
  var urlman = os.url.UrlManager.getInstance();
  var baseUrl1 = 'https://example.com/services/';
  var baseUrl2 = 'https://test.example.com/uuid/';
  var baseUrl3 = 'https://example.com/locations/';

  it('should register functions passed to it', function() {
    expect(goog.object.getCount(urlman.handlers_)).toBe(0);

    var fn = function(url) {
      var newurl = url + 'stuff';
      expect(newurl).toBe('GOOOOO/stuff');
    };
    urlman.registerHandler(fn, baseUrl1);

    expect(goog.object.getCount(urlman.handlers_)).toBe(1);
  });

  it('should accept an input URL and use it to call the appropriate handler', function() {
    urlman.handleUrl('https://example.com/services/GOOOOO/');
  });

  it('should allow multiple handlers to be registered', function() {
    expect(goog.object.getCount(urlman.handlers_)).toBe(1);

    var fn2 = function(url) {
      var newurl = url + 'things';
      return newurl;
    };
    urlman.registerHandler(fn2, baseUrl2);
    expect(goog.object.getCount(urlman.handlers_)).toBe(2);

    var fn3 = function(url) {
      var newurl = url + 'places';
      return newurl;
    };
    urlman.registerHandler(fn3, baseUrl3);
    expect(goog.object.getCount(urlman.handlers_)).toBe(3);
  });

  it('should allow multiple handlers to be assigned to the same base URL', function() {
    expect(urlman.handlers_[baseUrl1].length).toBe(1);

    var fn4 = function(url) {
      var newurl = url + 'people';
      return newurl;
    };
    urlman.registerHandler(fn4, baseUrl1);

    expect(urlman.handlers_[baseUrl1].length).toBe(2);
  });

  it('should handle a URL whose base maps it to multiple handlers by building and dispatching a message', function() {
    urlman.listenOnce(os.structs.EventType.URL_IMPORTED, function(e) {
      var params = e.getParams();
      expect(params).not.toBe(null);
      expect(params['url']).toBe('https://example.com/services/hithere/');
      expect(params['handlers'].length).toBe(2);
    });
    urlman.handleUrl('https://example.com/services/hithere/');
  });

  it('should not die a horrible death if asked to handle a non-registered URL type', function() {
    var throwfunc = function() {
      urlman.handleUrl('gawrbacwoiajduohc');
    };
    expect(throwfunc).not.toThrow();
  });
});
