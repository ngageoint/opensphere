goog.require('os.net.CustomFormatter');


describe('os.net.CustomFormatter', function() {
  const {default: CustomFormatter} = goog.module.get('os.net.CustomFormatter');

  it('should default content type when undefined', function() {
    var cf = new CustomFormatter();
    expect(cf.getContentType()).toBe('text');
  });

  it('should not default content type on empty string', function() {
    var cf = new CustomFormatter('');
    expect(cf.getContentType()).toBe('');
  });

  it('should use the provided content type', function() {
    var cf = new CustomFormatter('application/xml');
    expect(cf.getContentType()).toBe('application/xml');
  });
});
