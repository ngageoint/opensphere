goog.require('plugin.file.kml.tour.SoundCue');

describe('plugin.file.kml.tour.SoundCue', function() {
  // default values for tests
  var href = 'https://test.com/test.mp3';
  var delayedStart = 4321;
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
    var delayedStarts = [undefined, -5000, 0, 5000];
    delayedStarts.forEach(function(delayedStart) {
      var soundCue = new plugin.file.kml.tour.SoundCue(href, delayedStart);
      expect(soundCue.href_).toBe(href);
      expect(soundCue.delayedStart_).toBe(delayedStart > 0 ? delayedStart : 0);
      expect(soundCue.remaining_).toBeUndefined();
      expect(soundCue.start_).toBe(0);
      expect(soundCue.timeoutId_).toBeUndefined();
    });
  });

  it('gets the correct interval', function() {
    var soundCue = new plugin.file.kml.tour.SoundCue(href, delayedStart);
    expect(soundCue.getInterval()).toBe(soundCue.delayedStart_);

    soundCue.remaining_ = 42;
    expect(soundCue.getInterval()).toBe(soundCue.remaining_);

    soundCue.remaining_ = -9000;
    expect(soundCue.getInterval()).toBe(soundCue.remaining_);

    soundCue.remaining_ = undefined;
    expect(soundCue.getInterval()).toBe(soundCue.delayedStart_);
  });

  it('resolves execute promise immediately', function() {
    var soundCue = new plugin.file.kml.tour.SoundCue(href, delayedStart);
    var fakeAudio = {
      played: false,
      play: function() {
        this.played = true;
      },
      src: undefined
    };

    spyOn(window, 'setTimeout').andCallFake(fakeSetTimeout);
    spyOn(window, 'clearTimeout');
    spyOn(document, 'createElement').andReturn(fakeAudio);

    spyOn(soundCue, 'playAudio_').andCallThrough();

    var beforeStart = Date.now() - 1;
    var soundCuePromise = soundCue.execute();
    expect(soundCuePromise instanceof goog.Promise).toBe(true);

    waitsFor(function() {
      return stFn !== undefined && stInterval !== undefined;
    }, 'setTimeout to be called');

    runs(function() {
      // set from return value of setTimeout
      expect(soundCue.timeoutId_).toBe(timeoutId);
      expect(soundCue.start_).toBeGreaterThan(beforeStart);

      // setTimeout called with correct interval
      expect(stInterval).toBe(delayedStart);

      // promise is resolved
      expect(soundCuePromise.state_).toBe(goog.Promise.State_.FULFILLED);

      // this shouldn't be called until timeout fires
      expect(soundCue.playAudio_).not.toHaveBeenCalled();

      // fire the timeout callback
      stFn();

      // audio created and played
      expect(soundCue.playAudio_).toHaveBeenCalled();
      expect(soundCue.audio_).toBe(fakeAudio);
      expect(fakeAudio.src).toBe(href);
      expect(fakeAudio.played).toBe(true);

      // and timeout cleared
      expect(window.clearTimeout).toHaveBeenCalledWith(timeoutId);
      expect(soundCue.timeoutId_).toBeUndefined();
    });
  });
});
