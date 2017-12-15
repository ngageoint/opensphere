goog.require('os.net.ProxyHandler');
goog.require('goog.Uri');

describe('os.net.ProxyHandler', function() {
  it('should refuse handling URIs if the proxy is not set up properly', function() {
    // do something stupid to the proxy URL
    os.net.ProxyHandler.PROXY_URL = '';
    os.net.ProxyHandler.METHODS = ['GET'];
    os.net.ProxyHandler.SCHEMES = ['http'];
    var p = new os.net.ProxyHandler();
    var u = new goog.Uri('http://www.example.com/thing.xml');
    expect(p.handles('GET', u)).toBe(false);

    // undo the stupid
    os.net.ProxyHandler.PROXY_URL = '/ogc/proxy?com.bitsys.url={url}';
  });

  it('should handle supported methods', function() {
    os.net.ProxyHandler.METHODS = ['GET'];
    var p = new os.net.ProxyHandler();
    var u = new goog.Uri('http://www.example.com/thing.xml');
    expect(p.handles('GET', u)).toBe(true);
  });

  it('should refuse handling URIs if the method is not supported', function() {
    var p = new os.net.ProxyHandler();
    var u = new goog.Uri('http://www.example.com/thing.xml');
    expect(p.handles('POST', u)).toBe(false);
  });
  
  it('should not handle local file uris', function() {
    var p = new os.net.ProxyHandler();
    var u = new goog.Uri('local://testfileurl');
    expect(p.handles('GET', u)).toBe(false);
    expect(p.handles('POST', u)).toBe(false);
    expect(p.handles('PUT', u)).toBe(false);
    expect(p.handles('DELETE', u)).toBe(false);
  });

  it('should handle supported schemes', function() {
    os.net.ProxyHandler.SCHEMES.push('https');
    var p = new os.net.ProxyHandler();
    var u = new goog.Uri('https://www.example.com/thing.xml');
    expect(p.handles('GET', u)).toBe(true);
  });

  it('should refuse handling unsupported schemes', function() {
    os.net.ProxyHandler.SCHEMES.pop();
    var p = new os.net.ProxyHandler();
    var u = new goog.Uri('https://www.example.com/thing.xml');
    expect(p.handles('GET', u)).toBe(false);
    u = new goog.Uri('local://yermom.com/thing.xml');
    expect(p.handles('GET', u)).toBe(false);
  });

  it('should refuse handling same domain URIs', function() {
    var p = new os.net.ProxyHandler();
    var u = new goog.Uri('/thing.xml');
    expect(p.handles('GET', u)).toBe(false);
    u = new goog.Uri(window.location);
    expect(p.handles('GET', u)).toBe(false);
  });

  it('should modify URIs properly', function() {
    var p = new os.net.ProxyHandler();
    var u = 'https://www.example.com/thing.xml#fragment?query=true';
    expect(p.modUri(u)).toBe('/ogc/proxy?com.bitsys.url=' + encodeURIComponent(u));
  });

  it('should have an option for encoding', function() {
    var p = new os.net.ProxyHandler();
    var u = 'https://www.example.com/thing.xml#fragment?query=true';
    os.net.ProxyHandler.ENCODE = false;
    expect(p.modUri(u)).toBe('/ogc/proxy?com.bitsys.url=' + u);
  });
});
