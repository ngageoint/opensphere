goog.require('ol.Feature');
goog.require('ol.Object');
goog.require('os.mock');
goog.require('os.style.StyleManager');


describe('ol.Feature mixins', function() {
  const Feature = goog.module.get('ol.Feature');
  const OLObject = goog.module.get('ol.Object');

  it('should fire events by default', function() {
    var o = new OLObject();
    expect(o.eventsEnabled).toBe(true);
    o.suppressEvents();
    expect(o.eventsEnabled).toBe(false);
    o.enableEvents();
    expect(o.eventsEnabled).toBe(true);
  });

  it('should not fire events by default', function() {
    var f = new Feature();
    expect(f.eventsEnabled).toBe(false);
    f.enableEvents();
    expect(f.eventsEnabled).toBe(true);
    f.suppressEvents();
    expect(f.eventsEnabled).toBe(false);
  });

  it('should expose an ID property', function() {
    var f = new Feature();
    f.setId('abc');
    expect(f.id).toBeTruthy();
  });
});
