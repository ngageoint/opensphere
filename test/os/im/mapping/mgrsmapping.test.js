goog.require('os.im.mapping.MGRSMapping');
goog.require('os.osasm.wait');

import Feature from 'ol/src/Feature.js';

describe('os.im.mapping.MGRSMapping', function() {
  const {default: MGRSMapping} = goog.module.get('os.im.mapping.MGRSMapping');

  it('should test MGRS position strings correctly', function() {
    var m = new MGRSMapping();
    expect(m.testField('13SED1714696655')).toBe(true);
    expect(m.testField('13SED1796')).toBe(true);
    expect(m.testField('13SED')).toBe(true);
    expect(m.testField('42QYM0127736076')).toBe(true);
    expect(m.testField('BAL0000088973')).toBe(true);
    expect(m.testField('ZBG110980')).toBe(true);

    expect(m.testField(null)).toBe(false);
    expect(m.testField(undefined)).toBe(false);
    expect(m.testField('103036 501545')).toBe(false);
    expect(m.testField('103036.750 N  501545.250 E')).toBe(false);
    expect(m.testField('10 30 36 50 15 45')).toBe(false);
    expect(m.testField('0440-01934')).toBe(false);
    expect(m.testField('044001934')).toBe(false);
    expect(m.testField('dont parse me bro')).toBe(false);
  });

  it('should map MGRS positions to a feature correctly', function() {
    var field = 'test';
    var feature = new Feature();
    feature.setId(field);

    var m = new MGRSMapping();
    m.execute(feature);
    expect(feature.getGeometry()).toBeUndefined();

    m.field = field;
    m.execute(feature);
    expect(feature.getGeometry()).toBeUndefined();

    feature.set(field, '13SED1714696655');
    m.execute(feature);

    var geom = feature.getGeometry();
    expect(geom).toBeDefined();

    var coords = geom.getCoordinates();
    expect(coords[0]).toBeCloseTo(-104.79994247797246, 10);
    expect(coords[1]).toBeCloseTo(39.71960049119654, 10);
  });
});
