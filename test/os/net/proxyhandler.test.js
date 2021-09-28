goog.require('goog.Uri');
goog.require('os.net.ProxyHandler');

describe('os.net.ProxyHandler', function() {
  const Uri = goog.module.get('goog.Uri');
  const {default: ProxyHandler} = goog.module.get('os.net.ProxyHandler');

  it('should refuse handling URIs if the proxy is not set up properly', function() {
    // do something stupid to the proxy URL
    ProxyHandler.PROXY_URL = '';
    ProxyHandler.METHODS = ['GET'];
    ProxyHandler.SCHEMES = ['http'];
    var p = new ProxyHandler();
    var u = new Uri('http://www.example.com/thing.xml');
    expect(p.handles('GET', u)).toBe(false);

    // undo the stupid
    ProxyHandler.PROXY_URL = '/ogc/proxy?com.bitsys.url={url}';
  });

  it('should handle supported methods', function() {
    ProxyHandler.METHODS = ['GET'];
    var p = new ProxyHandler();
    var u = new Uri('http://www.example.com/thing.xml');
    expect(p.handles('GET', u)).toBe(true);
  });

  it('should refuse handling URIs if the method is not supported', function() {
    var p = new ProxyHandler();
    var u = new Uri('http://www.example.com/thing.xml');
    expect(p.handles('POST', u)).toBe(false);
  });

  it('should not handle local file uris', function() {
    var p = new ProxyHandler();
    var u = new Uri('local://testfileurl');
    expect(p.handles('GET', u)).toBe(false);
    expect(p.handles('POST', u)).toBe(false);
    expect(p.handles('PUT', u)).toBe(false);
    expect(p.handles('DELETE', u)).toBe(false);
  });

  it('should handle supported schemes', function() {
    ProxyHandler.SCHEMES.push('https');
    var p = new ProxyHandler();
    var u = new Uri('https://www.example.com/thing.xml');
    expect(p.handles('GET', u)).toBe(true);
  });

  it('should refuse handling unsupported schemes', function() {
    ProxyHandler.SCHEMES.pop();
    var p = new ProxyHandler();
    var u = new Uri('https://www.example.com/thing.xml');
    expect(p.handles('GET', u)).toBe(false);
    u = new Uri('local://yermom.com/thing.xml');
    expect(p.handles('GET', u)).toBe(false);
  });

  it('should refuse handling same domain URIs', function() {
    var p = new ProxyHandler();
    var u = new Uri('/thing.xml');
    expect(p.handles('GET', u)).toBe(false);
    u = new Uri(window.location);
    expect(p.handles('GET', u)).toBe(false);
  });

  it('should modify URIs properly', function() {
    var p = new ProxyHandler();
    var u = 'https://www.example.com/thing.xml#fragment?query=true';
    expect(p.modUri(u)).toBe('/ogc/proxy?com.bitsys.url=' + encodeURIComponent(u));
  });

  it('should have an option for encoding', function() {
    var p = new ProxyHandler();
    var u = 'https://www.example.com/thing.xml#fragment?query=true';
    ProxyHandler.ENCODE = false;
    expect(p.modUri(u)).toBe('/ogc/proxy?com.bitsys.url=' + u);
  });
});
