goog.require('os.net.CertNazi');


describe('os.net.CertNazi', function() {
  it('should blow up if you try to set http urls', function() {
    var urls = [
      'https://example.com/thing.png',
      'http://example2.com/other.png'
    ];

    var nazi = new os.net.CertNazi();
    var fn = function() {
      nazi.setUrls(urls);
    };

    expect(fn).toThrow();
  });

  // apparently the karma browser instance still has all of the current user's certs,
  // so actually testing nazi.inspect() causes an interactive popup in Chrome and
  // sometimes in FF (if they don't have select one automatically checked for certs).
});
