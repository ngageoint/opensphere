goog.require('os.geo.conv.MGRS');


describe('os.geo.conv.MGRS', function() {
  // this tests the value causing THIN-2365
  xit('should not encounter rounding errors in coordinate conversion', function() {
    var test = '42QYM0127736076';
    var mgrs = new os.geo.conv.MGRS(test);
    var ll = mgrs.convertToGeodetic();
    var result = os.geo.conv.MGRS.createString(ll.y, ll.x);
    expect(result).toBe(test);
  });
  
  it('should convert MGRS coordinates to lon/lat', function() {
    var bits = '13SED1714696655';
    mgrs = new os.geo.conv.MGRS(bits);
    ll = mgrs.convertToGeodetic();
    expect(ll.x).toBeCloseTo(-104.7999483247, 10);
    expect(ll.y).toBeCloseTo(39.7195959962, 10);
    
    result = os.geo.conv.MGRS.createString(ll.y, ll.x);
    expect(result).toBe(bits);
  });
});
