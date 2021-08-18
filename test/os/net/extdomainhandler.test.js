goog.require('goog.Uri');
goog.require('goog.net.EventType');
goog.require('os.net.ExtDomainHandler');

describe('os.net.ExtDomainHandler', function() {
  const Uri = goog.module.get('goog.Uri');
  const ExtDomainHandler = goog.module.get('os.net.ExtDomainHandler');

  var edh = new ExtDomainHandler();

  it('should not handle local file uris', function() {
    var uri = new Uri('local://testfileurl');

    expect(edh.handles('GET', uri)).toBe(false);
    expect(edh.handles('POST', uri)).toBe(false);
    expect(edh.handles('PUT', uri)).toBe(false);
    expect(edh.handles('DELETE', uri)).toBe(false);
  });

  it('should not handle local uris', function() {
    var uri = new Uri(window.location.toString());
    expect(edh.handles('GET', uri)).toBe(false);
    expect(edh.handles('POST', uri)).toBe(false);
    expect(edh.handles('PUT', uri)).toBe(false);
    expect(edh.handles('DELETE', uri)).toBe(false);
  });

  it('should not handle relative uris', function() {
    var url = window.location.toString();
    var i = url.indexOf('//') + 2;
    i = url.indexOf('/', i);

    var uri = new Uri(url.substring(i));
    expect(edh.handles('GET', uri)).toBe(false);
    expect(edh.handles('POST', uri)).toBe(false);
    expect(edh.handles('PUT', uri)).toBe(false);
    expect(edh.handles('DELETE', uri)).toBe(false);
  });

  it('should handle remote uris', function() {
    var uri = new Uri('http://www.google.com');

    expect(edh.handles('GET', uri)).toBe(true);
    expect(edh.handles('POST', uri)).toBe(true);
    expect(edh.handles('PUT', uri)).toBe(true);
    expect(edh.handles('DELETE', uri)).toBe(true);
  });

  it('should handle schemes in a case-insensitive manner', function() {
    var uri = new Uri('HTTP://www.google.com');

    expect(edh.handles('GET', uri)).toBe(true);
    expect(edh.handles('POST', uri)).toBe(true);
    expect(edh.handles('PUT', uri)).toBe(true);
    expect(edh.handles('DELETE', uri)).toBe(true);
  });

  it('should handle remote secure schemes', function() {
    var uri = new Uri('https://www.google.com');

    expect(edh.handles('GET', uri)).toBe(true);
    expect(edh.handles('POST', uri)).toBe(true);
    expect(edh.handles('PUT', uri)).toBe(true);
    expect(edh.handles('DELETE', uri)).toBe(true);
  });
});
