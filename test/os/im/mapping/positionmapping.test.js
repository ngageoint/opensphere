goog.require('os.im.mapping.PositionMapping');
goog.require('ol.Feature');

describe('os.im.mapping.PositionMapping', function() {
  it('should auto detect position string types correctly', function() {
    var a = new ol.Feature();
    a.set('test1', 'nope');
    a.set('test2', 'nope');
    a.set('test3', 'nope');

    var b = new ol.Feature();
    b.set('test1', 'nope');
    b.set('test2', 'nope');
    b.set('test3', 'nope');

    var c = new ol.Feature();
    c.set('test1', 'nope');
    c.set('test2', 'nope');
    c.set('test3', 'nope');

    var features = [a, b, c];

    var pm = new os.im.mapping.PositionMapping();
    var m = pm.autoDetect(features);
    expect(m).toBeNull();

    b.set('MgRs', '13SED1714696655');
    m = pm.autoDetect(features);

    expect(m).not.toBeNull();
    expect(m.field).toBe('MgRs');
    expect(m.getType()).toBe('MGRS');
  });

  it('should map positions to a feature correctly', function() {
    var field = 'test';
    var feature = new ol.Feature();
    feature.setId(field);

    var m = new os.im.mapping.PositionMapping();
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

  it('should clone properly', function() {
    var pm = new os.im.mapping.PositionMapping();
    pm.field = 'test';
    pm.setType('MGRS');

    var clone = pm.clone();
    expect(clone).not.toBeNull();
    expect(clone instanceof os.im.mapping.PositionMapping).toBe(true);
    expect(clone.field).toBe(pm.field);
    expect(clone.getType()).toBe(pm.getType());
  });

  it('should persist/restore properly', function() {
    var pm = new os.im.mapping.PositionMapping();
    pm.field = 'test';
    pm.setType('MGRS');

    var persist = pm.persist();
    expect(persist.id).toBe(pm.getId());
    expect(persist.field).toBe(pm.field);
    expect(persist.type).toBe(pm.getType());

    var restored = new os.im.mapping.PositionMapping();
    expect(restored.field).not.toBe(pm.field);
    expect(restored.getType()).not.toBe(pm.getType());

    restored.restore(persist);
    expect(restored.field).toBe(pm.field);
    expect(restored.getType()).toBe(pm.getType());
  });
});
