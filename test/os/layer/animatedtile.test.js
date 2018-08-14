goog.require('os.time.TimelineController');
goog.require('os.layer.AnimatedTile');
goog.require('ol.source.TileWMS');


describe('os.layer.AnimatedTile', function() {
  var tlc, layer, durationListeners, resetListeners, showListeners;

  it('should setup the TLC and layer', function() {
    tlc = os.time.TimelineController.getInstance();
    durationListeners = tlc.getListeners(os.time.TimelineEventType.DURATION_CHANGE, false).length;
    resetListeners = tlc.getListeners(os.time.TimelineEventType.RESET, false).length;
    showListeners = tlc.getListeners(os.time.TimelineEventType.SHOW, false).length;

    layer = new os.layer.AnimatedTile({
      source: new ol.source.TileWMS(/** @type {olx.source.TileWMSOptions} */ ({
        params: { 'LAYERS': 'dontcare' }
      }))
    });
  });

  it('should initialize properly', function() {
    expect(tlc.hasListener(os.time.TimelineEventType.DURATION_CHANGE, false)).toBe(true);
    expect(tlc.hasListener(os.time.TimelineEventType.RESET, false)).toBe(true);
    expect(tlc.hasListener(os.time.TimelineEventType.SHOW, false)).toBe(true);

    expect(tlc.getListener(os.time.TimelineEventType.DURATION_CHANGE, layer.scheduleReset_, false, layer))
        .not.toBe(null);
    expect(tlc.getListener(os.time.TimelineEventType.RESET, layer.scheduleReset_, false, layer)).not.toBe(null);
    expect(tlc.getListener(os.time.TimelineEventType.SHOW, layer.scheduleReset_, false, layer)).not.toBe(null);

    var newDurationListeners = tlc.getListeners(os.time.TimelineEventType.DURATION_CHANGE, false).length;
    var newResetListeners = tlc.getListeners(os.time.TimelineEventType.RESET, false).length;
    var newShowListeners = tlc.getListeners(os.time.TimelineEventType.SHOW, false).length;

    expect(newDurationListeners).toBe(durationListeners + 1);
    expect(newResetListeners).toBe(resetListeners + 1);
    expect(newShowListeners).toBe(showListeners + 1);
  });

  it('should dispose properly', function() {
    layer.dispose();

    var newDurationListeners = tlc.getListeners(os.time.TimelineEventType.DURATION_CHANGE, false).length;
    var newResetListeners = tlc.getListeners(os.time.TimelineEventType.RESET, false).length;
    var newShowListeners = tlc.getListeners(os.time.TimelineEventType.SHOW, false).length;

    expect(newDurationListeners).toBe(durationListeners);
    expect(newResetListeners).toBe(resetListeners);
    expect(newShowListeners).toBe(showListeners);

    expect(tlc.getListener(os.time.TimelineEventType.DURATION_CHANGE, layer.scheduleReset_, false, layer)).toBe(null);
    expect(tlc.getListener(os.time.TimelineEventType.RESET, layer.scheduleReset_, false, layer)).toBe(null);
    expect(tlc.getListener(os.time.TimelineEventType.SHOW, layer.scheduleReset_, false, layer)).toBe(null);
  });

  it('should get time parameters correctly for tiles', function() {
    // days should have a / and the next day's date
    expect(os.layer.AnimatedTile.getTimeParameter(
        'YYYY-MM-DD', 1472947200000, 1473033600000, os.time.Duration.DAY)).toBe('2016-09-04/2016-09-05');

    // weeks should be fully qualified
    expect(os.layer.AnimatedTile.getTimeParameter(
        'YYYY-MM-DD', 1472947200000, 1473552000000, os.time.Duration.WEEK)).toBe('2016-09-04/2016-09-11');

    // months should increment to the first day of next month
    expect(os.layer.AnimatedTile.getTimeParameter(
        'YYYY-MM-DD', 1472688000000, 1475280000000, os.time.Duration.MONTH)).toBe('2016-09-01/2016-10-01');

    // custom should add a day, i.e. this case would show as 2016/09/01 - 2016/09/06 on the date chooser
    expect(os.layer.AnimatedTile.getTimeParameter(
        'YYYY-MM-DD', 1472688000000, 1473206399000, os.time.Duration.CUSTOM)).toBe('2016-09-01/2016-09-07');
  });
});
