goog.require('os.mock');
goog.require('os.style.StyleManager');


describe('ol.Feature mixins', function() {
  it('should fire events by default', function() {
    var o = new ol.Object();
    expect(o.eventsEnabled).toBe(true);
    o.suppressEvents();
    expect(o.eventsEnabled).toBe(false);
    o.enableEvents();
    expect(o.eventsEnabled).toBe(true);
  });

  it('should not fire events by default', function() {
    var f = new ol.Feature();
    expect(f.eventsEnabled).toBe(false);
    f.enableEvents();
    expect(f.eventsEnabled).toBe(true);
    f.suppressEvents();
    expect(f.eventsEnabled).toBe(false);
  });

  it('should expose an ID property', function() {
    var f = new ol.Feature();
    f.setId('abc');
    expect(f.id).toBeTruthy();
  });
});

