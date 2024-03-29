goog.require('goog.Promise');
goog.require('os.MapContainer');
goog.require('os.map');
goog.require('os.map.FlightMode');
goog.require('plugin.file.kml.tour.FlyTo');


describe('plugin.file.kml.tour.FlyTo', function() {
  const Promise = goog.module.get('goog.Promise');
  const {default: MapContainer} = goog.module.get('os.MapContainer');
  const {default: FlightMode} = goog.module.get('os.map.FlightMode');
  const {default: FlyTo} = goog.module.get('plugin.file.kml.tour.FlyTo');
  // default values for tests
  var duration = 4321;
  var timeoutId = 1234;

  var flyToOptions = {
    duration: duration,
    center: [10, 10],
    altitude: 10000
  };

  // saved values from setTimeout spy
  var stInterval;
  var stFn;
  var fakeSetTimeout = function(fn, interval) {
    stFn = fn;
    stInterval = interval;

    return timeoutId;
  };

  var fakeFlyToOptions;
  var fakeFlyTo = function(options) {
    fakeFlyToOptions = options;
  };

  var flightCancelled = false;
  var fakeCancelFlight = function() {
    flightCancelled = true;
  };

  beforeEach(function() {
    stInterval = stFn = fakeFlyToOptions = undefined;
    flightCancelled = false;
  });

  it('initializes correctly', function() {
    var options = {};
    var flyTo = new FlyTo(options);

    // has a default duration and saves options
    expect(flyTo.duration_).toBe(FlyTo.DEFAULT_DURATION);
    expect(flyTo.options_).toBe(options);

    options.duration = 1234;
    flyTo = new FlyTo(options);

    // uses duration if provided on options
    expect(flyTo.duration_).toBe(1234);
    expect(flyTo.options_).toBe(options);
  });

  it('calls the map container flyTo with correct options', function() {
    var flyTo = new FlyTo(flyToOptions);

    spyOn(window, 'setTimeout').andCallFake(fakeSetTimeout);
    spyOn(MapContainer, 'getInstance').andReturn({
      flyTo: fakeFlyTo
    });

    var flyToPromise = flyTo.execute();
    expect(flyToPromise instanceof Promise).toBe(true);

    waitsFor(function() {
      return stFn !== undefined && stInterval !== undefined && fakeFlyToOptions !== undefined;
    }, 'setTimeout to be called');

    runs(function() {
      expect(fakeFlyToOptions).toBeDefined();
      expect(fakeFlyToOptions.center).toEqual(flyToOptions.center);
      expect(fakeFlyToOptions.altitude).toBe(flyToOptions.altitude);
      expect(fakeFlyToOptions.duration).toBe(duration);
      expect(fakeFlyToOptions.flightMode).toBe(FlightMode.BOUNCE);
    });
  });

  it('cancels flight on pause and reset if the wait is active', function() {
    var flyTo = new FlyTo(flyToOptions);

    spyOn(MapContainer, 'getInstance').andReturn({
      cancelFlight: fakeCancelFlight
    });

    // not active, so shouldn't cancel flight on pause or reset
    flyTo.pause();
    expect(flightCancelled).toBe(false);

    flyTo.reset();
    expect(flightCancelled).toBe(false);

    // make it think it's active and pause/reset should cancel flight
    spyOn(flyTo, 'isWaitActive').andReturn(true);

    flyTo.pause();
    expect(flightCancelled).toBe(true);

    flightCancelled = false;
    flyTo.reset();
    expect(flightCancelled).toBe(true);
  });
});
