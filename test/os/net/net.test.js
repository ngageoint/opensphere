goog.require('os.net');


describe('os.net', function() {
  it('detects valid crossOrigin values', function() {
    expect(os.net.isValidCrossOrigin('anonymous')).toBe(true);
    expect(os.net.isValidCrossOrigin('use-credentials')).toBe(true);

    // let's just try a bunch of types to make sure it doesn't blow up
    expect(os.net.isValidCrossOrigin()).toBe(false);
    expect(os.net.isValidCrossOrigin(undefined)).toBe(false);
    expect(os.net.isValidCrossOrigin(null)).toBe(false);
    expect(os.net.isValidCrossOrigin(true)).toBe(false);
    expect(os.net.isValidCrossOrigin(42)).toBe(false);
    expect(os.net.isValidCrossOrigin('abuse-credentials')).toBe(false);
    expect(os.net.isValidCrossOrigin([])).toBe(false);
    expect(os.net.isValidCrossOrigin({})).toBe(false);
  });

  it('assumes a crossOrigin value for a URL', function() {
    // test local domain
    var uri = new goog.Uri(window.location);
    var localDomain = uri.getDomain();
    if (uri.hasPort()) {
      localDomain += ':' + uri.getPort();
    }

    expect(os.net.getCrossOrigin('http://' + localDomain + '/someotherlocation'))
        .toBe(os.net.CrossOrigin.NONE);
    expect(os.net.getCrossOrigin('https://' + localDomain + '/someotherlocation'))
        .toBe(os.net.CrossOrigin.NONE);

    // test empty url
    expect(os.net.getCrossOrigin(null)).toBe(os.net.CrossOrigin.NONE);
    expect(os.net.getCrossOrigin('')).toBe(os.net.CrossOrigin.NONE);

    // test cross domain
    expect(os.net.getCrossOrigin('http://some.other.domain/')).toBe(os.net.CrossOrigin.ANONYMOUS);
    expect(os.net.getCrossOrigin('https://some.other.domain/')).toBe(os.net.CrossOrigin.ANONYMOUS);
  });

  it('uses crossOrigin registry for URLs', function() {
    var uri = new goog.Uri('http://somewhere.com');
    var uri2 = new goog.Uri('https://somewhere.com');

    // register a crossOrigin pattern
    os.net.registerCrossOrigin('^https://', os.net.CrossOrigin.USE_CREDENTIALS);

    expect(os.net.getCrossOrigin(uri)).toBe(os.net.CrossOrigin.ANONYMOUS);
    expect(os.net.getCrossOrigin(uri2)).toBe(os.net.CrossOrigin.USE_CREDENTIALS);
  });

  it('detects trusted URIs', function() {
    var url1 = 'https://trust.me/';
    var url2 = 'https://trust.me/also/';
    var url3 = 'https://dont.trust.me/';

    os.net.loadTrustedUris();
    expect(os.net.isTrustedUri(url1)).toBe(false);
    expect(os.net.isTrustedUri(url2)).toBe(false);
    expect(os.net.isTrustedUri(url3)).toBe(false);

    os.settings.set('trustedUris', {
      '^https://trust.me/': true
    });

    os.net.loadTrustedUris();
    expect(os.net.isTrustedUri(url1)).toBe(true);
    expect(os.net.isTrustedUri(url2)).toBe(true);
    expect(os.net.isTrustedUri(url3)).toBe(false);

    os.net.registerTrustedUri(url3);
    expect(os.net.isTrustedUri(url3)).toBe(true);

    var userTrustedUris = os.settings.get('userTrustedUris', {});
    expect(userTrustedUris[url3]).toBe(true);
  });
});
