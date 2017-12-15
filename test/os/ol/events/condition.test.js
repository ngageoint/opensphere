goog.require('ol.MapBrowserEventType');
goog.require('os.ol.events.condition');

describe('os.ol.events.condition', function() {
  it('detects right click events', function() {
    var mockEvent = {
      type: ol.MapBrowserEventType.POINTERUP,
      pointerEvent: {
        button: 2
      }
    };

    // happy path
    expect(os.ol.events.condition.rightClick(mockEvent)).toBe(true);

    // different button
    mockEvent.pointerEvent.button = 1;
    expect(os.ol.events.condition.rightClick(mockEvent)).toBe(false);

    // revert back as a sanity check
    mockEvent.pointerEvent.button = 2;
    expect(os.ol.events.condition.rightClick(mockEvent)).toBe(true);

    // different event type
    mockEvent.type = ol.MapBrowserEventType.SINGLECLICK;
    expect(os.ol.events.condition.rightClick(mockEvent)).toBe(false);

    // no event doesn't fail
    expect(os.ol.events.condition.rightClick()).toBe(false);
    expect(os.ol.events.condition.rightClick(null)).toBe(false);
  });
});
