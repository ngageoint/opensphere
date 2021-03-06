goog.require('ol.Feature');
goog.require('ol.Object');
goog.require('ol.events');
goog.require('ol.events.EventTarget');
goog.require('ol.geom.Point');
goog.require('os.mixin');


describe('os.mixin', function() {
  const Feature = goog.module.get('ol.Feature');
  const OLObject = goog.module.get('ol.Object');
  const EventTarget = goog.module.get('ol.events.EventTarget');
  const Point = goog.module.get('ol.geom.Point');

  it('should allow disabling events', function() {
    spyOn(EventTarget.prototype, 'dispatchEvent');

    // objects should default to enabling events
    var obj = new OLObject();
    expect(obj.eventsEnabled).toBe(true);

    obj.suppressEvents();
    expect(obj.eventsEnabled).toBe(false);

    obj.enableEvents();
    expect(obj.eventsEnabled).toBe(true);

    // features should default to suppressing events
    var feature = new Feature();
    expect(feature.eventsEnabled).toBe(false);

    feature.dispatchEvent('testEvent');
    feature.notify('test', 'test');
    feature.changed();
    expect(EventTarget.prototype.dispatchEvent.calls.length).toBe(0);

    feature.enableEvents();
    expect(feature.eventsEnabled).toBe(true);
    feature.dispatchEvent('testEvent');
    expect(EventTarget.prototype.dispatchEvent.calls.length).toBe(1);
    feature.notify('test', 'test');
    expect(EventTarget.prototype.dispatchEvent.calls.length).toBe(3);
    feature.changed();
    expect(EventTarget.prototype.dispatchEvent.calls.length).toBe(4);
  });

  it('should set values quietly', function() {
    spyOn(EventTarget.prototype, 'dispatchEvent');

    // features should never fire events on set
    var feature = new Feature();
    feature.set('testKey', 'testValue');
    expect(feature.get('testKey')).toBe('testValue');
    expect(EventTarget.prototype.dispatchEvent.calls.length).toBe(0);

    // creating the geometry will fire a changed event, so dispatchEvent will be called once
    var geometry = new Point(null);
    expect(EventTarget.prototype.dispatchEvent.calls.length).toBe(1);

    geometry.set('testKey', 'testValue');
    expect(geometry.get('testKey')).toBe('testValue');
    expect(EventTarget.prototype.dispatchEvent.calls.length).toBe(3);
  });

  it('should remove values on features', function() {
    var feature = new Feature({
      testKey: 'testValue'
    });

    expect(feature.get('testKey')).toBe('testValue');

    feature.set('testKey', undefined);
    expect(feature.get('testKey')).toBe(undefined);
    expect('testKey' in feature.values_).toBe(false);
  });

  it('should set incremental ids on features', function() {
    // reset the counter first
    Feature.nextId = 0;

    // public id should increment as new features are created
    for (var i = 0; i < 10; i++) {
      // should set OL3's private id, and a public id for slickgrid
      var feature = new Feature();
      feature.setId('test1');
      expect(feature.getId()).toBe('test1');
      expect(feature.id).toBe(i);

      // this should change OL3's id, but not our public id for slickgrid
      feature.setId('test2');
      expect(feature.getId()).toBe('test2');
      expect(feature.id).toBe(i);
    }
  });
});
