goog.require('os');

describe('os', function() {
  it('should extract major version from a full version value', function() {
    expect(os.getMajorVersion('1.0.0')).toBe('1.0');
    expect(os.getMajorVersion('1.0.1')).toBe('1.0');
    expect(os.getMajorVersion('1')).toBe('1.0');
    expect(os.getMajorVersion('1.0.1.2')).toBe('1.0');
    expect(os.getMajorVersion('1.0.')).toBe('1.0');
    expect(os.getMajorVersion('1.')).toBe('1.0');
    expect(os.getMajorVersion('.0')).toBe('0.0');
    expect(os.getMajorVersion('.0.0')).toBe('0.0');
    expect(os.getMajorVersion(undefined)).toBe('0.0');
    expect(os.getMajorVersion('')).toBe('0.0');
    expect(os.getMajorVersion('.')).toBe('0.0');
    expect(os.getMajorVersion('.0.')).toBe('0.0');
  });
});
