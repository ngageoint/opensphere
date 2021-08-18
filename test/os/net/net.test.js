goog.require('goog.Uri');
goog.require('goog.Uri.QueryData');
goog.require('os.config.Settings');
goog.require('os.net');
goog.require('os.net.CrossOrigin');


describe('os.net', function() {
  const Uri = goog.module.get('goog.Uri');
  const QueryData = goog.module.get('goog.Uri.QueryData');
  const Settings = goog.module.get('os.config.Settings');
  const net = goog.module.get('os.net');
  const CrossOrigin = goog.module.get('os.net.CrossOrigin');

  it('detects valid crossOrigin values', function() {
    expect(net.isValidCrossOrigin('anonymous')).toBe(true);
    expect(net.isValidCrossOrigin('use-credentials')).toBe(true);

    // let's just try a bunch of types to make sure it doesn't blow up
    expect(net.isValidCrossOrigin()).toBe(false);
    expect(net.isValidCrossOrigin(undefined)).toBe(false);
    expect(net.isValidCrossOrigin(null)).toBe(false);
    expect(net.isValidCrossOrigin(true)).toBe(false);
    expect(net.isValidCrossOrigin(42)).toBe(false);
    expect(net.isValidCrossOrigin('abuse-credentials')).toBe(false);
    expect(net.isValidCrossOrigin([])).toBe(false);
    expect(net.isValidCrossOrigin({})).toBe(false);
  });

  it('assumes a crossOrigin value for a URL', function() {
    // test local domain
    var uri = new Uri(window.location);
    var localDomain = uri.getDomain();
    if (uri.hasPort()) {
      localDomain += ':' + uri.getPort();
    }

    expect(net.getCrossOrigin('http://' + localDomain + '/someotherlocation'))
        .toBe(CrossOrigin.NONE);
    expect(net.getCrossOrigin('https://' + localDomain + '/someotherlocation'))
        .toBe(CrossOrigin.NONE);

    // test empty url
    expect(net.getCrossOrigin(null)).toBe(CrossOrigin.NONE);
    expect(net.getCrossOrigin('')).toBe(CrossOrigin.NONE);

    // test cross domain
    expect(net.getCrossOrigin('http://some.other.domain/')).toBe(CrossOrigin.ANONYMOUS);
    expect(net.getCrossOrigin('https://some.other.domain/')).toBe(CrossOrigin.ANONYMOUS);
  });

  it('uses crossOrigin registry for URLs', function() {
    var uri = new Uri('http://somewhere.com');
    var uri2 = new Uri('https://somewhere.com');

    // register a crossOrigin pattern
    net.registerCrossOrigin('^https://', CrossOrigin.USE_CREDENTIALS);

    expect(net.getCrossOrigin(uri)).toBe(CrossOrigin.ANONYMOUS);
    expect(net.getCrossOrigin(uri2)).toBe(CrossOrigin.USE_CREDENTIALS);

    net.resetCrossOriginCache();

    expect(net.getCrossOrigin(uri)).toBe(CrossOrigin.ANONYMOUS);
    expect(net.getCrossOrigin(uri2)).toBe(CrossOrigin.ANONYMOUS);
  });

  it('detects trusted URIs', function() {
    var url1 = 'https://trust.me/';
    var url2 = 'https://trust.me/also/';
    var url3 = 'https://dont.trust.me/';

    net.loadTrustedUris();
    expect(net.isTrustedUri(url1)).toBe(false);
    expect(net.isTrustedUri(url2)).toBe(false);
    expect(net.isTrustedUri(url3)).toBe(false);

    Settings.getInstance().set('trustedUris', {
      '^https://trust.me/': true
    });

    net.loadTrustedUris();
    expect(net.isTrustedUri(url1)).toBe(true);
    expect(net.isTrustedUri(url2)).toBe(true);
    expect(net.isTrustedUri(url3)).toBe(false);

    net.registerTrustedUri(url3);
    expect(net.isTrustedUri(url3)).toBe(true);

    var userTrustedUris = Settings.getInstance().get('userTrustedUris', {});
    expect(userTrustedUris[url3]).toBe(true);
  });

  it('creates query data from different param types', function() {
    var stringParams = 'color=blue&size=50&style=undefined';
    var qd = net.paramsToQueryData(stringParams);

    expect(qd instanceof QueryData).toBe(true);
    expect(qd.getCount()).toBe(3);
    expect(qd.get('color')).toBe('blue');
    expect(qd.get('size')).toBe('50');
    expect(qd.get('style')).toBe('undefined');

    var objParams = {
      color: 'red',
      size: 30,
      style: 'triangle'
    };
    qd = net.paramsToQueryData(objParams);

    expect(qd instanceof QueryData).toBe(true);
    expect(qd.getCount()).toBe(3);
    expect(qd.get('color')).toBe('red');
    expect(qd.get('size')).toBe('30');
    expect(qd.get('style')).toBe('triangle');

    var qdParams = new QueryData('color=black&size=10&style=ellipse');
    qd = net.paramsToQueryData(qdParams);

    expect(qd instanceof QueryData).toBe(true);
    expect(qd.getCount()).toBe(3);
    expect(qd.get('color')).toBe('black');
    expect(qd.get('size')).toBe('10');
    expect(qd.get('style')).toBe('ellipse');

    // handle the empty case
    qd = net.paramsToQueryData(null);

    expect(qd instanceof QueryData).toBe(true);
    expect(qd.getCount()).toBe(0);
  });

  it('registers and sorts default request validators', function() {
    const fn1 = () => {};
    const fn2 = () => {};
    net.registerDefaultValidator(fn1);
    net.registerDefaultValidator(fn2, 100);

    let validators = net.getDefaultValidators();
    expect(validators.length).toBe(2);
    expect(validators[0]).toBe(fn2);
    expect(validators[1]).toBe(fn1);

    net.resetDefaultValidators();

    validators = net.getDefaultValidators();
    expect(validators.length).toBe(0);
  });
});
