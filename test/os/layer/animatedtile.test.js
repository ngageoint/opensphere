goog.require('os.layer.AnimatedTile');
goog.require('os.time.Duration');
goog.require('os.time.TimelineController');
goog.require('os.time.TimelineEventType');

import TileWMS from 'ol/src/source/TileWMS.js';

describe('os.layer.AnimatedTile', function() {
  const {default: AnimatedTile} = goog.module.get('os.layer.AnimatedTile');
  const {default: Duration} = goog.module.get('os.time.Duration');
  const {default: TimelineController} = goog.module.get('os.time.TimelineController');
  const {default: TimelineEventType} = goog.module.get('os.time.TimelineEventType');

  var tlc;
  var layer;
  var durationListeners;
  var resetListeners;
  var showListeners;

  it('should setup the TLC and layer', function() {
    tlc = TimelineController.getInstance();
    durationListeners = tlc.getListeners(TimelineEventType.DURATION_CHANGE, false).length;
    resetListeners = tlc.getListeners(TimelineEventType.RESET, false).length;
    showListeners = tlc.getListeners(TimelineEventType.SHOW, false).length;

    layer = new AnimatedTile({
      source: new TileWMS(/** @type {olx.source.TileWMSOptions} */ ({
        params: {'LAYERS': 'dontcare'}
      }))
    });
  });

  it('should initialize properly', function() {
    expect(tlc.hasListener(TimelineEventType.DURATION_CHANGE, false)).toBe(true);
    expect(tlc.hasListener(TimelineEventType.RESET, false)).toBe(true);
    expect(tlc.hasListener(TimelineEventType.SHOW, false)).toBe(true);

    expect(tlc.getListener(TimelineEventType.DURATION_CHANGE, layer.scheduleReset_, false, layer))
        .not.toBe(null);
    expect(tlc.getListener(TimelineEventType.RESET, layer.scheduleReset_, false, layer)).not.toBe(null);
    expect(tlc.getListener(TimelineEventType.SHOW, layer.scheduleReset_, false, layer)).not.toBe(null);

    var newDurationListeners = tlc.getListeners(TimelineEventType.DURATION_CHANGE, false).length;
    var newResetListeners = tlc.getListeners(TimelineEventType.RESET, false).length;
    var newShowListeners = tlc.getListeners(TimelineEventType.SHOW, false).length;

    expect(newDurationListeners).toBe(durationListeners + 1);
    expect(newResetListeners).toBe(resetListeners + 1);
    expect(newShowListeners).toBe(showListeners + 1);
  });

  it('should dispose properly', function() {
    layer.dispose();

    var newDurationListeners = tlc.getListeners(TimelineEventType.DURATION_CHANGE, false).length;
    var newResetListeners = tlc.getListeners(TimelineEventType.RESET, false).length;
    var newShowListeners = tlc.getListeners(TimelineEventType.SHOW, false).length;

    expect(newDurationListeners).toBe(durationListeners);
    expect(newResetListeners).toBe(resetListeners);
    expect(newShowListeners).toBe(showListeners);

    expect(tlc.getListener(TimelineEventType.DURATION_CHANGE, layer.scheduleReset_, false, layer)).toBe(null);
    expect(tlc.getListener(TimelineEventType.RESET, layer.scheduleReset_, false, layer)).toBe(null);
    expect(tlc.getListener(TimelineEventType.SHOW, layer.scheduleReset_, false, layer)).toBe(null);
  });

  it('should get time parameters correctly for tiles', function() {
    // days should have a / and the next day's date
    expect(AnimatedTile.getTimeParameter('YYYY-MM-DD', '{start}/{end}', 1472947200000, 1473033600000,
        Duration.DAY)).toBe('2016-09-04/2016-09-05');

    // weeks should be fully qualified
    expect(AnimatedTile.getTimeParameter('YYYY-MM-DD', '{start}/{end}', 1472947200000, 1473552000000,
        Duration.WEEK)).toBe('2016-09-04/2016-09-11');

    // months should increment to the first day of next month
    expect(AnimatedTile.getTimeParameter('YYYY-MM-DD', '{start}/{end}', 1472688000000, 1475280000000,
        Duration.MONTH)).toBe('2016-09-01/2016-10-01');

    // last 24 hours should query the last 24 hours
    expect(AnimatedTile.getTimeParameter('YYYY-MM-DD', '{start}/{end}', 1472688000000, 1472774400000,
        Duration.LAST24HOURS)).toBe('2016-09-01/2016-09-02');

    // last 48 hours should query the last 48 hours
    expect(AnimatedTile.getTimeParameter('YYYY-MM-DD', '{start}/{end}', 1472688000000, 1472860800000,
        Duration.LAST48HOURS)).toBe('2016-09-01/2016-09-03');

    // last 7 days should query the last 7 days
    expect(AnimatedTile.getTimeParameter('YYYY-MM-DD', '{start}/{end}', 1472688000000, 1473292800000,
        Duration.LAST7DAYS)).toBe('2016-09-01/2016-09-08');

    // last 14 days should query the last 14 days
    expect(AnimatedTile.getTimeParameter('YYYY-MM-DD', '{start}/{end}', 1472688000000, 1473897600000,
        Duration.LAST14DAYS)).toBe('2016-09-01/2016-09-15');

    // last 30 days should query the last 30 days
    expect(AnimatedTile.getTimeParameter('YYYY-MM-DD', '{start}/{end}', 1472688000000, 1475280000000,
        Duration.LAST30DAYS)).toBe('2016-09-01/2016-10-01');

    // custom should add a day, i.e. this case would show as 2016/09/01 - 2016/09/06 on the date chooser
    expect(AnimatedTile.getTimeParameter('YYYY-MM-DD', '{start}/{end}', 1472688000000, 1473206399000,
        Duration.CUSTOM)).toBe('2016-09-01/2016-09-07');
  });
});
