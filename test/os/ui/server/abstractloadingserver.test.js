goog.require('os.ui.server.AbstractLoadingServer');
goog.require('goog.array');


describe('os.ui.server.AbstractLoadingServer', function() {
  var server = new os.ui.server.AbstractLoadingServer();

  var baseUrl = 'https://test.com/server';
  var alternateUrls = ['https://1.test.com/server', 'https://2.test.com/server', 'https://3.test.com/server'];

  it('gets and sets the URL', function() {
    expect(server.getUrl()).toBe('');
    server.setUrl(baseUrl);
    expect(server.getUrl()).toBe(baseUrl);
  });

  it('adds alternate URLs', function() {
    expect(server.getAlternateUrls()).toBeNull();

    for (var i = 0; i < alternateUrls.length; i++) {
      server.addAlternateUrl(alternateUrls[i]);
    }

    var alts = server.getAlternateUrls();
    expect(alts.length).toBe(3);
    expect(goog.array.equals(alts, alternateUrls)).toBe(true);
  });

  it('removes alternate URLs', function() {
    for (var i = 0, n = alternateUrls.length; i < n; i++) {
      server.removeAlternateUrl(alternateUrls[i]);

      if (i != n - 1) {
        expect(server.getAlternateUrls().length).toBe(n - i - 1);
      } else {
        expect(server.getAlternateUrls()).toBeNull();
      }
    }
  });

  it('sets alternate URLs', function() {
    expect(server.getAlternateUrls()).toBeNull();
    server.setAlternateUrls(alternateUrls);

    var alts = server.getAlternateUrls();
    expect(alts.length).toBe(3);
    expect(goog.array.equals(alts, alternateUrls)).toBe(true);
  });

  it('rotates through the URL and alternates', function() {
    // should start with the base URL and cycle through alternates
    expect(server.getNextUrl()).toBe(baseUrl);
    expect(server.getNextUrl()).toBe(alternateUrls[0]);
    expect(server.getNextUrl()).toBe(alternateUrls[1]);
    expect(server.getNextUrl()).toBe(alternateUrls[2]);

    // should cycle back to the base URL
    expect(server.getNextUrl()).toBe(baseUrl);
    expect(server.getNextUrl()).toBe(alternateUrls[0]);

    // remove the next URL in the sequence
    server.removeAlternateUrl(alternateUrls[1]);

    // should use the next one available and continue the cycle
    expect(server.getNextUrl()).toBe(alternateUrls[2]);
    expect(server.getNextUrl()).toBe(baseUrl);
  });
});
