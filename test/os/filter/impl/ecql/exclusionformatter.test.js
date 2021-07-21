goog.require('ol.Feature');
goog.require('ol.geom.Polygon');
goog.require('os.filter.impl.ecql.ExclusionFormatter');
goog.require('os.mock');

describe('os.filter.impl.ecql.ExclusionFormatter', function() {
  const Feature = goog.module.get('ol.Feature');
  const Polygon = goog.module.get('ol.geom.Polygon');
  const ExclusionFormatter = goog.module.get('os.filter.impl.ecql.ExclusionFormatter');

  it('should format geometries', function() {
    var f = new Feature(Polygon.fromExtent([0, 1, 2, 3]));
    var formatter = new ExclusionFormatter();
    expect(formatter.format(f)).toBe('(DISJOINT(geometry,POLYGON((0 1,0 3,2 3,2 1,0 1))))');
  });

  it('should format geometries with other column names', function() {
    var f = new Feature(Polygon.fromExtent([0, 1, 2, 3]));
    var formatter = new ExclusionFormatter('other');
    expect(formatter.format(f)).toBe('(DISJOINT(other,POLYGON((0 1,0 3,2 3,2 1,0 1))))');
  });

  it('should wrap multiple geometries properly', function() {
    var formatter = new ExclusionFormatter();
    var f = new Feature(Polygon.fromExtent([0, 1, 2, 3]));
    var result = formatter.format(f);
    var f2 = new Feature(Polygon.fromExtent([4, 5, 6, 7]));
    result += formatter.format(f2);

    expect(formatter.wrapMultiple(result)).toBe('(' +
      '(DISJOINT(geometry,POLYGON((0 1,0 3,2 3,2 1,0 1))))' +
      ' AND ' +
      '(DISJOINT(geometry,POLYGON((4 5,4 7,6 7,6 5,4 5))))' +
      ')');
  });
});
