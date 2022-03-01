goog.require('os.ol.events.condition');

import MapBrowserEventType from 'ol/src/MapBrowserEventType';

describe('os.ol.events.condition', function() {
  const condition = goog.module.get('os.ol.events.condition');

  it('detects right click events', function() {
    var mockEvent = {
      type: MapBrowserEventType.POINTERUP,
      pointerEvent: {
        button: 2
      }
    };

    // happy path
    expect(condition.rightClick(mockEvent)).toBe(true);

    // different button
    mockEvent.pointerEvent.button = 1;
    expect(condition.rightClick(mockEvent)).toBe(false);

    // revert back as a sanity check
    mockEvent.pointerEvent.button = 2;
    expect(condition.rightClick(mockEvent)).toBe(true);

    // different event type
    mockEvent.type = MapBrowserEventType.SINGLECLICK;
    expect(condition.rightClick(mockEvent)).toBe(false);

    // no event doesn't fail
    expect(condition.rightClick()).toBe(false);
    expect(condition.rightClick(null)).toBe(false);
  });
});
