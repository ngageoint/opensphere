goog.require('os.ol.events.condition');

import MapBrowserEventType from 'ol/src/MapBrowserEventType.js';

describe('os.ol.events.condition', function() {
  const condition = goog.module.get('os.ol.events.condition');

  it('detects right click events', function() {
    var original = new PointerEvent(MapBrowserEventType.POINTERUP,
        {
          button: 2
        });
    var mockEvent = {
      type: MapBrowserEventType.POINTERUP,
      originalEvent: original
    };

    // happy path
    expect(condition.rightClick(mockEvent)).toBe(true);

    // different button
    original = new PointerEvent(MapBrowserEventType.POINTERUP,
        {
          button: 1
        });
    mockEvent.originalEvent = original;
    expect(condition.rightClick(mockEvent)).toBe(false);

    // revert back as a sanity check
    original = new PointerEvent(MapBrowserEventType.POINTERUP,
        {
          button: 2
        });
    mockEvent.originalEvent = original;
    expect(condition.rightClick(mockEvent)).toBe(true);

    // different event type
    mockEvent.type = MapBrowserEventType.SINGLECLICK;
    expect(condition.rightClick(mockEvent)).toBe(false);

    // no event doesn't fail
    expect(condition.rightClick()).toBe(false);
    expect(condition.rightClick(null)).toBe(false);
  });
});
