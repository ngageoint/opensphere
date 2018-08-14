goog.require('os.ogc.spatial');


describe('os.ogc.spatial', function() {
  it('should close unclosed rings', function() {
    var coords = [[0, 0], [2, 2], [5, 5]];
    var str = os.ogc.spatial.formatCoords(coords);

    expect(str).toBe('0,0 2,2 5,5 0,0');
  });

  it('should prevent round-off error when closing rings', function() {
    // the first and last coords are the same through 1E-12. Technically round-off generally occurs after
    // 1E-14, but all of our code considers the epsilon to be 1E-12
    var coords = [[0.12345612345678, 0.12345612345601], [2, 2], [5, 5], [0.12345612345652, 0.12345612345645]];

    var str = os.ogc.spatial.formatCoords(coords);
    expect(str).toBe('0.12345612345678,0.12345612345601 2,2 5,5 0.12345612345678,0.12345612345601');
  });
});
