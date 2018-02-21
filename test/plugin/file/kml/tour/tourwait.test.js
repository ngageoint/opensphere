goog.require('plugin.file.kml.tour.Wait');


describe('plugin.file.kml.tour.Wait', function() {
  // default values for tests
  var duration = 4321;
  var timeoutId = 1234;

  // saved values from setTimeout spy
  var stInterval;
  var stFn;
  var fakeSetTimeout = function(fn, interval) {
    stFn = fn;
    stInterval = interval;

    return timeoutId;
  };

  it('initializes properly', function() {
    var durations = [-5000, 0, 5000, 10000];
    durations.forEach(function(duration) {
      var wait = new plugin.file.kml.tour.Wait(duration);
      expect(wait.duration_).toBe(duration > 0 ? duration : 0);
      expect(wait.remaining_).toBeUndefined();
      expect(wait.timeoutId_).toBeUndefined();
      expect(wait.start_).toBe(0);
    });
  });

  it('gets the correct interval', function() {
    var wait = new plugin.file.kml.tour.Wait(duration);
    expect(wait.getInterval()).toBe(wait.duration_);

    wait.remaining_ = 42;
    expect(wait.getInterval()).toBe(wait.remaining_);

    wait.remaining_ = -9000;
    expect(wait.getInterval()).toBe(wait.remaining_);

    wait.remaining_ = undefined;
    expect(wait.getInterval()).toBe(wait.duration_);
  });

  it('resolves execute promise after the provided duration', function() {
    var wait = new plugin.file.kml.tour.Wait(duration);

    spyOn(window, 'setTimeout').andCallFake(fakeSetTimeout);
    spyOn(window, 'clearTimeout');

    spyOn(wait, 'onWaitComplete').andCallThrough();
    spyOn(wait, 'reset').andCallThrough();

    var beforeStart = Date.now() - 1;
    var waitPromise = wait.execute();
    expect(waitPromise instanceof goog.Promise).toBe(true);

    waitsFor(function() {
      return stFn !== undefined && stInterval !== undefined;
    }, 'setTimeout to be called');

    runs(function() {
      // set from return value of setTimeout
      expect(wait.timeoutId_).toBe(timeoutId);
      expect(wait.start_).toBeGreaterThan(beforeStart);

      // setTimeout called with correct duration
      expect(stInterval).toBe(duration);

      // promise is in pending state
      expect(waitPromise.state_).toBe(goog.Promise.State_.PENDING);

      // these shouldn't be called until timeout fires
      expect(wait.onWaitComplete).not.toHaveBeenCalled();
      expect(wait.reset).not.toHaveBeenCalled();

      // fire the timeout callback
      stFn();
    });

    waitsFor(function() {
      // wait for the promise to resolve
      return waitPromise.state_ !== goog.Promise.State_.PENDING;
    }, 'promise to resolve');

    runs(function() {
      // timeout callback should have been onWaitComplete, which should have reset and resolved the promise
      expect(wait.onWaitComplete).toHaveBeenCalled();
      expect(wait.reset).toHaveBeenCalled();
      expect(waitPromise.state_).toBe(goog.Promise.State_.FULFILLED);

      expect(window.clearTimeout).toHaveBeenCalledWith(timeoutId);
    });
  });

  it('pauses and resumes execution', function() {
    var duration = 5000;
    var startTime = Date.now();
    var pauseTime = startTime + duration / 2;

    var wait = new plugin.file.kml.tour.Wait(duration);

    spyOn(window, 'setTimeout').andCallFake(fakeSetTimeout);
    spyOn(window, 'clearTimeout');
    spyOn(Date, 'now').andCallFake(function() {
      return wait.start_ ? pauseTime : startTime;
    });

    runs(function() {
      wait.execute();
    });

    waitsFor(function() {
      return stFn !== undefined && stInterval !== undefined;
    }, 'setTimeout to be called');

    runs(function() {
      expect(wait.timeoutId_).toBe(timeoutId);

      wait.pause();
      expect(window.clearTimeout).toHaveBeenCalledWith(timeoutId);
      expect(wait.timeoutId_).toBeUndefined();
      expect(wait.remaining_).toBe(duration / 2);

      stFn = stInterval = undefined;
      wait.execute();
    });

    waitsFor(function() {
      return stFn !== undefined && stInterval !== undefined;
    }, 'setTimeout to be called');

    runs(function() {
      expect(wait.timeoutId_).toBe(timeoutId);
      expect(stInterval).toBe(duration / 2);
    });
  });

  it('does not create a timeout if no remaining time', function() {
    var wait = new plugin.file.kml.tour.Wait(duration);

    spyOn(window, 'setTimeout');
    spyOn(window, 'clearTimeout');
    spyOn(wait, 'onWaitComplete');

    runs(function() {
      wait.remaining_ = 0;
      wait.execute();
    });

    waitsFor(function() {
      return wait.onWaitComplete.calls.length > 0;
    }, 'onWaitComplete to be called');

    runs(function() {
      expect(window.setTimeout).not.toHaveBeenCalled();
      expect(window.clearTimeout).not.toHaveBeenCalled();
      expect(wait.onWaitComplete).toHaveBeenCalled();
    });
  });

  it('resets during execution', function() {
    var wait = new plugin.file.kml.tour.Wait(duration);
    var startTime = Date.now();

    spyOn(window, 'setTimeout').andCallFake(fakeSetTimeout);
    spyOn(window, 'clearTimeout');
    spyOn(Date, 'now').andCallFake(function() {
      return startTime;
    });

    runs(function() {
      wait.execute();
    });

    waitsFor(function() {
      return stFn !== undefined && stInterval !== undefined;
    }, 'setTimeout to be called');

    runs(function() {
      expect(wait.timeoutId_).toBe(timeoutId);
      expect(wait.start_).toBe(startTime);

      wait.reset();
      expect(window.clearTimeout).toHaveBeenCalledWith(timeoutId);
      expect(wait.timeoutId_).toBeUndefined();
      expect(wait.remaining_).toBeUndefined();
      expect(wait.start_).toBe(0);
    });
  });
});
