goog.require('os.geo');
goog.require('os.im.mapping.LatLonMapping');

import Feature from 'ol/src/Feature.js';

describe('os.im.mapping.LatLonMapping', function() {
  const geo = goog.module.get('os.geo');
  const {default: LatLonMapping} = goog.module.get('os.im.mapping.LatLonMapping');

  it('should test position strings correctly', function() {
    var m = new LatLonMapping();
    expect(m.testField('103036 501545')).toBe(true);
    expect(m.testField('033036 0501545')).toBe(true);
    expect(m.testField('10 30 36 50 15 45')).toBe(true);
    expect(m.testField('1030 5015')).toBe(true);
    expect(m.testField('10°30\'50° 15\'')).toBe(true);
    expect(m.testField('10 30 50 15')).toBe(true);
    expect(m.testField('05 06 09 050 03 9.0')).toBe(true);
    expect(m.testField('5 6 9 50 3 9.0')).toBe(true);
    expect(m.testField('10° 30\' 36" 50° 15\' 45"')).toBe(true);
    expect(m.testField('10°30\'36"50°15\'45"')).toBe(true);
    expect(m.testField('10°30\'36" 50°15\'45"')).toBe(true);
    expect(m.testField('10°30\'36",50°15\'45"')).toBe(true);
    expect(m.testField('10°30\'36"N 50°15\'45"E')).toBe(true);
    expect(m.testField('N10°30\'36" E50°15\'45"')).toBe(true);
    expect(m.testField('1.5  N 5.1   E')).toBe(true);
    expect(m.testField('N  1.5 E  5.1   ')).toBe(true);
    expect(m.testField('103036.750 N  501545.250 E')).toBe(true);
    expect(m.testField('501545.250 E  103036.750 N')).toBe(true);
    expect(m.testField('001.16N 01.11E')).toBe(false);
    expect(m.testField('N001.16 E01.11')).toBe(false);
    expect(m.testAndGetField('001.16N 01.11E', 'DD')).not.toBeNull();
    expect(m.testAndGetField('N001.16 E01.11', 'DD')).not.toBeNull();
    expect(m.testField('E01.11 N001.16')).toBe(true);

    m.setOrder(geo.PREFER_LON_FIRST);
    expect(m.testField('1.11 1.16')).toBe(true);
    expect(m.testField('001.11 001.16')).toBe(true);

    expect(m.testField(null)).toBe(false);
    expect(m.testField(undefined)).toBe(false);
    expect(m.testField('13SED1714696655')).toBe(false);
    expect(m.testField('0440-01934')).toBe(false);
    expect(m.testField('044001934')).toBe(false);
    expect(m.testField('dont parse me bro')).toBe(false);
  });

  it('should map positions to a feature correctly', function() {
    var field = 'test';
    var feature = new Feature();
    feature.setId(field);

    var m = new LatLonMapping();
    m.execute(feature);
    expect(feature.getGeometry()).toBeUndefined();

    m.field = field;
    m.execute(feature);
    expect(feature.getGeometry()).toBeUndefined();

    feature.set(field, '103036.750 N  501545.250 E');
    m.execute(feature);

    var geom = feature.getGeometry();
    expect(geom).toBeDefined();

    var coords = geom.getCoordinates();
    expect(coords[0]).toBeCloseTo(50.2625694444, 10);
    expect(coords[1]).toBeCloseTo(10.5102083333, 10);
  });
});
