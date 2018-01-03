goog.require('os.mock');
goog.require('os.time.TimelineController');
goog.require('os.time.TimelineControllerEvent');
goog.require('os.time.TimelineEventType');


describe('os.time.TimelineController', function() {
  var controller;
  var defaultStart;
  var defaultEnd;
  var defaultDuration;
  var getDispatchEventCallCount = function(eventType) {
    var result = 0;
    var callObj;
    var arg;
    for (var i = 0; i < controller.dispatchEvent.calls.length; i = i + 1) {
      callObj = controller.dispatchEvent.calls[i];
      arg = callObj.args[0];
      if (callObj.args[0] == eventType) {
        result++;
      } else if (arg instanceof os.time.TimelineControllerEvent) {
        if (arg.type === eventType) {
          result++;
        }
      }
    }
    return result;
  };

  var clock;
  beforeEach(function() {
    clock = lolex.install();
    goog.Timer.defaultTimerObject = clock;

    if (controller) {
      // Restore defautls
      controller.clearAnimateRanges();
      controller.setRange(controller.buildRange(defaultStart, defaultEnd));
      controller.setDuration(defaultDuration);
      // setting up a spy on the dispatch
      spyOn(controller, 'dispatchEvent');
    }
  });

  afterEach(function() {
    controller.stop();
    clock.uninstall();
    goog.Timer.defaultTimerObject = window;
  });

  it('should initialize the timeline controller', function() {
    controller = new os.time.TimelineController();
    defaultStart = controller.getStart();
    defaultEnd = controller.getEnd();
    defaultDuration = controller.getDuration();
  });

  it('should initialize with the current UTC date, floored by day', function() {
    var duration = os.time.Duration.DAY;
    var start = new Date(controller.getStart());
    var end = new Date(controller.getEnd());
    var testStartDate = os.time.floor(os.time.toUTCDate(new Date()), duration);

    expect(controller.getDuration()).toBe(duration);
    expect(os.time.format(start, duration))
        .toBe(os.time.format(testStartDate, duration));

    testStartDate.setDate(testStartDate.getDate() + 1);
    expect(os.time.format(end, duration))
        .toBe(os.time.format(testStartDate, duration));
  });

  it('Setting the duration should fire os.time.TimelineEventType.DURATION_CHANGE', function() {
    controller.setDuration(os.time.Duration.WEEK);
    expect(controller.dispatchEvent).toHaveBeenCalledWith(os.time.TimelineEventType.DURATION_CHANGE);
    expect(getDispatchEventCallCount(os.time.TimelineEventType.DURATION_CHANGE)).toEqual(1);
  });

  it('Setting the fps should fire os.time.TimelineEventType.FPS_CHANGE', function() {
    controller.setFps(5);
    expect(controller.dispatchEvent).toHaveBeenCalledWith(os.time.TimelineEventType.FPS_CHANGE);
    expect(getDispatchEventCallCount(os.time.TimelineEventType.FPS_CHANGE)).toEqual(1);
  });

  it('Setting the range should fire os.time.TimelineEventType.RANGE_CHANGED', function() {
    controller.setRange(controller.buildRange(new Date().getTime(), new Date().getTime() + 1));
    expect(controller.dispatchEvent).toHaveBeenCalledWith(os.time.TimelineEventType.RANGE_CHANGED);
    expect(getDispatchEventCallCount(os.time.TimelineEventType.RANGE_CHANGED)).toEqual(1);
  });

  it('Calling play should fire os.time.TimelineEventType.PLAY', function() {
    controller.play();
    expect(controller.dispatchEvent).toHaveBeenCalledWith(os.time.TimelineEventType.PLAY);
    expect(getDispatchEventCallCount(os.time.TimelineEventType.PLAY)).toEqual(1);
  });

  it('Calling play should fire os.time.TimelineEventType.STOP', function() {
    // Controller is stoped prior to each test, so calling stop again
    // should have no effect
    controller.stop();
    expect(getDispatchEventCallCount(os.time.TimelineEventType.STOP)).toEqual(0);
    // Start/Stop the controller.
    controller.play();
    controller.stop();
    expect(controller.dispatchEvent).toHaveBeenCalledWith(os.time.TimelineEventType.STOP);
    expect(getDispatchEventCallCount(os.time.TimelineEventType.STOP)).toEqual(1);
    console.log(controller.getSuppressShowEvents());
  });

  it('Playing timeline should fire os.time.TimelineEventType.SHOW event for each frame', function() {
    var runtime = 500;
    var fps = 10;

    controller.setFps(fps);
    expect(controller.animationTimer_.timerObject_).toBe(clock);
    controller.play();
    clock.tick(runtime);
    expect(getDispatchEventCallCount(os.time.TimelineEventType.SHOW)).toBeGreaterThan((fps * runtime / 1000) - 2);
    console.log(controller.getSuppressShowEvents());
  });

  it('Playing with higher fps should fire more os.time.TimelineEventType.SHOW event for each frame', function() {
    var runtime = 500;
    var fps = 20;

    controller.setFps(fps);
    expect(controller.animationTimer_.timerObject_).toBe(clock);
    controller.play();
    clock.tick(runtime);
    expect(getDispatchEventCallCount(os.time.TimelineEventType.SHOW)).toBeGreaterThan((fps * runtime / 1000) - 2);
  });

  it('adding range should fire range changed event', function() {
    var fullRange = controller.getRange();
    controller.addAnimateRange(fullRange);
    expect(controller.dispatchEvent).toHaveBeenCalledWith(os.time.TimelineEventType.ANIMATE_RANGE_CHANGED);
    expect(getDispatchEventCallCount(os.time.TimelineEventType.ANIMATE_RANGE_CHANGED)).toEqual(1);
    expect(controller.getAnimationRanges().length).toBe(1);
    // If I add the same range a second time, I do not expect another change event.
    controller.addAnimateRange(fullRange);
    expect(getDispatchEventCallCount(os.time.TimelineEventType.ANIMATE_RANGE_CHANGED)).toEqual(1);
    expect(controller.getAnimationRanges().length).toBe(1);
    // If I remove the range, expect a change event.
    controller.removeAnimateRange(fullRange);
    expect(getDispatchEventCallCount(os.time.TimelineEventType.ANIMATE_RANGE_CHANGED)).toEqual(2);
    expect(controller.getAnimationRanges().length).toBe(0);

    controller.clearHoldRanges();
    controller.addHoldRange(fullRange);
    expect(controller.dispatchEvent).toHaveBeenCalledWith(os.time.TimelineEventType.HOLD_RANGE_CHANGED);
    expect(getDispatchEventCallCount(os.time.TimelineEventType.HOLD_RANGE_CHANGED)).toEqual(1);
    expect(controller.getHoldRanges().length).toBe(1);
    // If I add the same range a second time, I do not expect another change event.
    controller.addHoldRange(fullRange);
    expect(getDispatchEventCallCount(os.time.TimelineEventType.HOLD_RANGE_CHANGED)).toEqual(1);
    expect(controller.getHoldRanges().length).toBe(1);
    // If I remove the range, expect a change event.
    controller.removeHoldRange(fullRange);
    expect(getDispatchEventCallCount(os.time.TimelineEventType.HOLD_RANGE_CHANGED)).toEqual(2);
    expect(controller.getHoldRanges().length).toBe(0);

    controller.clearLoadRanges();
    controller.addLoadRange(fullRange);
    expect(controller.dispatchEvent).toHaveBeenCalledWith(os.time.TimelineEventType.RANGE_CHANGED);
    expect(getDispatchEventCallCount(os.time.TimelineEventType.RANGE_CHANGED)).toEqual(1);
    expect(controller.getLoadRanges().length).toBe(1);
    // If I add the same range a second time, I do not expect another change event.
    controller.addLoadRange(fullRange);
    expect(getDispatchEventCallCount(os.time.TimelineEventType.RANGE_CHANGED)).toEqual(1);
    expect(controller.getLoadRanges().length).toBe(1);
    // If I remove the range, expect a change event.
    controller.removeLoadRange(fullRange);
    expect(getDispatchEventCallCount(os.time.TimelineEventType.RANGE_CHANGED)).toEqual(2);
    expect(controller.getLoadRanges().length).toBe(1); // should always be 1 load range
  });

  it('adding dis-joined ranges should should result in two ranges', function() {
    var fullRange = controller.getRange();
    // compute two, non overlapping ranges from the full range.
    // [[Range1.][.Range2]]
    var rangeLength = fullRange.end - fullRange.start;
    var range1 = new goog.math.Range(fullRange.start, ((rangeLength * 0.5) + fullRange.start) - 1);
    var range2 = new goog.math.Range(((rangeLength * 0.5) + fullRange.start) + 1, fullRange.end);

    controller.addAnimateRange(range1);
    controller.addAnimateRange(range2);

    // we should have two ranges
    var target = controller.getAnimationRanges();
    expect(target.length).toBe(2);
    // the two ranges should be equal to the orginal ranges
    expect(goog.math.Range.equals(target[0], range1)).toBe(true);
    expect(goog.math.Range.equals(target[1], range2)).toBe(true);
    expect(controller.dispatchEvent).toHaveBeenCalledWith(os.time.TimelineEventType.ANIMATE_RANGE_CHANGED);
    expect(getDispatchEventCallCount(os.time.TimelineEventType.ANIMATE_RANGE_CHANGED)).toEqual(2);

    controller.clearHoldRanges();
    controller.addHoldRange(range1);
    controller.addHoldRange(range2);

    // we should have two ranges
    target = controller.getHoldRanges();
    expect(target.length).toBe(2);
    // the two ranges should be equal to the orginal ranges
    expect(goog.math.Range.equals(target[0], range1)).toBe(true);
    expect(goog.math.Range.equals(target[1], range2)).toBe(true);
    expect(controller.dispatchEvent).toHaveBeenCalledWith(os.time.TimelineEventType.HOLD_RANGE_CHANGED);
    expect(getDispatchEventCallCount(os.time.TimelineEventType.HOLD_RANGE_CHANGED)).toEqual(2);

    controller.clearLoadRanges();
    controller.addLoadRange(range1);
    controller.addLoadRange(range2);

    // we should have two ranges
    target = controller.getLoadRanges();
    expect(target.length).toBe(2);
    // the two ranges should be equal to the orginal ranges
    expect(goog.math.Range.equals(target[0], range1)).toBe(true);
    expect(goog.math.Range.equals(target[1], range2)).toBe(true);
    expect(controller.dispatchEvent).toHaveBeenCalledWith(os.time.TimelineEventType.RANGE_CHANGED);
    expect(getDispatchEventCallCount(os.time.TimelineEventType.RANGE_CHANGED)).toEqual(2);
  });

  it('adding overlapping ranges should should result in one range', function() {
    var fullRange = controller.getRange();
    var rangeLength = fullRange.end - fullRange.start;
    var range1 = new goog.math.Range(fullRange.start, ((rangeLength * 0.5) + fullRange.start) + 1);
    var range2 = new goog.math.Range(((rangeLength * 0.5) + fullRange.start) - 1, fullRange.end);
    controller.addAnimateRange(range1);
    controller.addAnimateRange(range2);

    // we should have one range
    var target = controller.getAnimationRanges();
    expect(target.length).toBe(1);
    // the two ranges should be equal to the orginal ranges
    expect(goog.math.Range.equals(target[0], fullRange)).toBe(true);
    expect(controller.dispatchEvent).toHaveBeenCalledWith(os.time.TimelineEventType.ANIMATE_RANGE_CHANGED);
    expect(getDispatchEventCallCount(os.time.TimelineEventType.ANIMATE_RANGE_CHANGED)).toEqual(2);

    controller.clearHoldRanges();
    controller.addHoldRange(range1);
    controller.addHoldRange(range2);

    // we should have one range
    target = controller.getHoldRanges();
    expect(target.length).toBe(1);
    // the two ranges should be equal to the orginal ranges
    expect(goog.math.Range.equals(target[0], fullRange)).toBe(true);
    expect(controller.dispatchEvent).toHaveBeenCalledWith(os.time.TimelineEventType.HOLD_RANGE_CHANGED);
    expect(getDispatchEventCallCount(os.time.TimelineEventType.HOLD_RANGE_CHANGED)).toEqual(3);

    controller.clearLoadRanges();
    controller.addLoadRange(range1);
    controller.addLoadRange(range2);

    // we should have one range
    target = controller.getLoadRanges();
    expect(target.length).toBe(1);
    // the two ranges should be equal to the orginal ranges
    expect(goog.math.Range.equals(target[0], fullRange)).toBe(true);
    expect(controller.dispatchEvent).toHaveBeenCalledWith(os.time.TimelineEventType.RANGE_CHANGED);
    expect(getDispatchEventCallCount(os.time.TimelineEventType.RANGE_CHANGED)).toEqual(2);
  });

  it('removing a range from a full animation range should result in two ranges', function() {
    var fullRange = controller.getRange();
    var rangeLength = fullRange.end - fullRange.start;
    var range30 = rangeLength * 0.3;
    var range1 = new goog.math.Range(fullRange.start + range30, fullRange.end - range30);

    controller.addAnimateRange(fullRange);
    // This should effectivly bisect the range, leaving a range on the left and right of the removed range.
    controller.removeAnimateRange(range1);

    // we should have two ranges
    var target = controller.getAnimationRanges();
    expect(target.length).toBe(2);
    var testRange = new goog.math.Range(fullRange.start, fullRange.start + range30);
    expect(goog.math.Range.equals(target[0], testRange)).toBe(true);
    testRange = new goog.math.Range(fullRange.end - range30, fullRange.end);
    expect(goog.math.Range.equals(target[1], testRange)).toBe(true);

    expect(controller.dispatchEvent).toHaveBeenCalledWith(os.time.TimelineEventType.ANIMATE_RANGE_CHANGED);
    expect(getDispatchEventCallCount(os.time.TimelineEventType.ANIMATE_RANGE_CHANGED)).toEqual(2);

    controller.clearHoldRanges();
    controller.addHoldRange(fullRange);
    // This should effectivly bisect the range, leaving a range on the left and right of the removed range.
    controller.removeHoldRange(range1);

    // we should have two ranges
    target = controller.getHoldRanges();
    expect(target.length).toBe(2);
    testRange = new goog.math.Range(fullRange.start, fullRange.start + range30);
    expect(goog.math.Range.equals(target[0], testRange)).toBe(true);
    testRange = new goog.math.Range(fullRange.end - range30, fullRange.end);
    expect(goog.math.Range.equals(target[1], testRange)).toBe(true);

    expect(controller.dispatchEvent).toHaveBeenCalledWith(os.time.TimelineEventType.HOLD_RANGE_CHANGED);
    expect(getDispatchEventCallCount(os.time.TimelineEventType.HOLD_RANGE_CHANGED)).toEqual(3);

    controller.clearLoadRanges();
    controller.addLoadRange(fullRange);
    // This should effectivly bisect the range, leaving a range on the left and right of the removed range.
    controller.removeLoadRange(range1);

    // we should have two ranges
    target = controller.getLoadRanges();
    expect(target.length).toBe(2);
    testRange = new goog.math.Range(fullRange.start, fullRange.start + range30);
    expect(goog.math.Range.equals(target[0], testRange)).toBe(true);
    testRange = new goog.math.Range(fullRange.end - range30, fullRange.end);
    expect(goog.math.Range.equals(target[1], testRange)).toBe(true);

    expect(controller.dispatchEvent).toHaveBeenCalledWith(os.time.TimelineEventType.RANGE_CHANGED);
    expect(getDispatchEventCallCount(os.time.TimelineEventType.RANGE_CHANGED)).toEqual(2);
  });

  it('making an exisiting range larger should result in the same number of ranges', function() {
    var fullRange = controller.getRange();
    var rangeLength = fullRange.end - fullRange.start;
    var range30 = rangeLength * 0.3;
    var range1 = new goog.math.Range(fullRange.start, fullRange.start + range30);
    var range2 = new goog.math.Range(fullRange.end - range30, fullRange.end);
    var range3 = new goog.math.Range(fullRange.start, fullRange.start + range30 + 100);
    // Setting up test case with two disjointed ranges.
    controller.addAnimateRange(range1);
    controller.addAnimateRange(range2);
    // update range1
    controller.updateAnimateRange(range3, range1);
    // we should still have two ranges
    var target = controller.getAnimationRanges();
    expect(target.length).toBe(2);

    expect(goog.math.Range.equals(target[0], range3)).toBe(true);
    expect(goog.math.Range.equals(target[1], range2)).toBe(true);

    expect(controller.dispatchEvent).toHaveBeenCalledWith(os.time.TimelineEventType.ANIMATE_RANGE_CHANGED);
    expect(getDispatchEventCallCount(os.time.TimelineEventType.ANIMATE_RANGE_CHANGED)).toEqual(3);

    controller.clearHoldRanges();
    controller.addHoldRange(range1);
    controller.addHoldRange(range2);
    // update range1
    controller.updateHoldRange(range3, range1);
    // we should still have two ranges
    var target = controller.getHoldRanges();
    expect(target.length).toBe(2);

    expect(goog.math.Range.equals(target[0], range3)).toBe(true);
    expect(goog.math.Range.equals(target[1], range2)).toBe(true);

    expect(controller.dispatchEvent).toHaveBeenCalledWith(os.time.TimelineEventType.HOLD_RANGE_CHANGED);
    expect(getDispatchEventCallCount(os.time.TimelineEventType.HOLD_RANGE_CHANGED)).toEqual(4);

    controller.clearLoadRanges();
    controller.addLoadRange(range1);
    controller.addLoadRange(range2);
    // update range1
    controller.updateLoadRange(range3, range1);
    // we should still have two ranges
    var target = controller.getLoadRanges();
    expect(target.length).toBe(2);

    expect(goog.math.Range.equals(target[0], range3)).toBe(true);
    expect(goog.math.Range.equals(target[1], range2)).toBe(true);

    expect(controller.dispatchEvent).toHaveBeenCalledWith(os.time.TimelineEventType.RANGE_CHANGED);
    expect(getDispatchEventCallCount(os.time.TimelineEventType.RANGE_CHANGED)).toEqual(3);
  });

  it('making an exisiting range smaller should result in the same number of ranges', function() {
    var fullRange = controller.getRange();
    var rangeLength = fullRange.end - fullRange.start;
    var range30 = rangeLength * 0.3;
    var range1 = new goog.math.Range(fullRange.start, fullRange.start + range30);
    var range2 = new goog.math.Range(fullRange.end - range30, fullRange.end);
    var range3 = new goog.math.Range(range1.start, range1.end - 200);
    // Setting up test case with two disjointed ranges.
    controller.addAnimateRange(range1);
    controller.addAnimateRange(range2);
    controller.updateAnimateRange(range3, range1);
    // we should still have two ranges
    var target = controller.getAnimationRanges();
    expect(target.length).toBe(2);

    expect(goog.math.Range.equals(target[0], range1)).toBe(false);
    expect(goog.math.Range.equals(target[0], range3)).toBe(true);
    expect(goog.math.Range.equals(target[1], range2)).toBe(true);

    expect(controller.dispatchEvent).toHaveBeenCalledWith(os.time.TimelineEventType.ANIMATE_RANGE_CHANGED);
    expect(getDispatchEventCallCount(os.time.TimelineEventType.ANIMATE_RANGE_CHANGED)).toEqual(3);

    // Setting up test case with two disjointed ranges.
    controller.clearHoldRanges();
    controller.addHoldRange(range1);
    controller.addHoldRange(range2);
    controller.updateHoldRange(range3, range1);
    // we should still have two ranges
    target = controller.getHoldRanges();
    expect(target.length).toBe(2);

    expect(goog.math.Range.equals(target[0], range1)).toBe(false);
    expect(goog.math.Range.equals(target[0], range3)).toBe(true);
    expect(goog.math.Range.equals(target[1], range2)).toBe(true);

    expect(controller.dispatchEvent).toHaveBeenCalledWith(os.time.TimelineEventType.HOLD_RANGE_CHANGED);
    expect(getDispatchEventCallCount(os.time.TimelineEventType.HOLD_RANGE_CHANGED)).toEqual(4);

    // Setting up test case with two disjointed ranges.
    controller.clearLoadRanges();
    controller.addLoadRange(range1);
    controller.addLoadRange(range2);
    controller.updateLoadRange(range3, range1);
    // we should still have two ranges
    target = controller.getLoadRanges();
    expect(target.length).toBe(2);

    expect(goog.math.Range.equals(target[0], range1)).toBe(false);
    expect(goog.math.Range.equals(target[0], range3)).toBe(true);
    expect(goog.math.Range.equals(target[1], range2)).toBe(true);

    expect(controller.dispatchEvent).toHaveBeenCalledWith(os.time.TimelineEventType.RANGE_CHANGED);
    expect(getDispatchEventCallCount(os.time.TimelineEventType.RANGE_CHANGED)).toEqual(3);
  });

  it('updating an exisiting range that overlaps should result in those ranges getting combined', function() {
    var fullRange = controller.getRange();
    var rangeLength = fullRange.end - fullRange.start;
    var range30 = rangeLength * 0.3;
    var range1 = new goog.math.Range(fullRange.start, fullRange.start + range30);
    var range2 = new goog.math.Range(fullRange.end - range30, fullRange.end);
    var range3 = new goog.math.Range(range1.end, range2.start + 200);
    var expectedRange = new goog.math.Range(fullRange.start + range30, fullRange.end);
    // Setting up test case with two disjointed ranges.
    controller.addAnimateRange(range1);
    controller.addAnimateRange(range2);
    // we should have two ranges
    var target = controller.getAnimationRanges();
    expect(target.length).toBe(2);

    // update range1
    controller.updateAnimateRange(range3, range1);
    // we should have one range
    target = controller.getAnimationRanges();
    expect(target.length).toBe(1);

    // the resulting range in this case is the full range.
    expect(goog.math.Range.equals(target[0], expectedRange)).toBe(true);

    expect(controller.dispatchEvent).toHaveBeenCalledWith(os.time.TimelineEventType.ANIMATE_RANGE_CHANGED);
    expect(getDispatchEventCallCount(os.time.TimelineEventType.ANIMATE_RANGE_CHANGED)).toEqual(3);

    controller.clearHoldRanges();
    controller.addHoldRange(range1);
    controller.addHoldRange(range2);
    // we should have two ranges
    target = controller.getHoldRanges();
    expect(target.length).toBe(2);

    // update range1
    controller.updateHoldRange(range3, range1);
    // we should have one range
    target = controller.getHoldRanges();
    expect(target.length).toBe(1);

    // the resulting range in this case is the full range.
    expect(goog.math.Range.equals(target[0], expectedRange)).toBe(true);

    expect(controller.dispatchEvent).toHaveBeenCalledWith(os.time.TimelineEventType.HOLD_RANGE_CHANGED);
    expect(getDispatchEventCallCount(os.time.TimelineEventType.HOLD_RANGE_CHANGED)).toEqual(4);

    controller.clearLoadRanges();
    controller.addLoadRange(range1);
    controller.addLoadRange(range2);
    // we should have two ranges
    target = controller.getLoadRanges();
    expect(target.length).toBe(2);

    // update range1
    controller.updateLoadRange(range3, range1);
    // we should have one range
    target = controller.getLoadRanges();
    expect(target.length).toBe(1);

    // the resulting range in this case is the full range.
    expect(goog.math.Range.equals(target[0], expectedRange)).toBe(true);

    expect(controller.dispatchEvent).toHaveBeenCalledWith(os.time.TimelineEventType.RANGE_CHANGED);
    expect(getDispatchEventCallCount(os.time.TimelineEventType.RANGE_CHANGED)).toEqual(3);
  });

  it('mutiple ranges then adding overlapping range should result in overlapping ranges getting combined', function() {
    // Setting up test case
    var start = 100000;
    var end = 100000000;
    controller.setRange(controller.buildRange(start, end));
    controller.setDuration(10);

    var range1 = new goog.math.Range(start + 10, start + 1000);
    var range2 = new goog.math.Range(start + 5000, start + 10000);
    var range3 = new goog.math.Range(start + 12000, start + 21000);
    var expectOverlapRange = new goog.math.Range(range2.start, range3.end);
    var overlappingRange = new goog.math.Range(range2.end - 500, range3.start + 100);

    controller.addAnimateRange(range1);
    controller.addAnimateRange(range2);
    controller.addAnimateRange(range3);

    // We should have 3 ranges
    var target = controller.getAnimationRanges();
    expect(target.length).toBe(3);

    // create range overlapping range2 and range 3
    controller.addAnimateRange(overlappingRange);

    // We should now have 2 ranges
    target = controller.getAnimationRanges();
    expect(target.length).toBe(2);
    expect(goog.math.Range.equals(target[0], range1)).toBe(true);
    // Second range should now be the combination of 2 and 3.
    expect(goog.math.Range.equals(target[1], expectOverlapRange)).toBe(true);
    // Start and end should also remain the samge
    expect(start).toBe(controller.getStart());
    expect(end).toBe(controller.getEnd());

    controller.clearHoldRanges();
    controller.addHoldRange(range1);
    controller.addHoldRange(range2);
    controller.addHoldRange(range3);

    // We should have 3 ranges
    target = controller.getHoldRanges();
    expect(target.length).toBe(3);

    // create range overlapping range2 and range 3
    controller.addHoldRange(overlappingRange);

    // We should now have 2 ranges
    target = controller.getHoldRanges();
    expect(target.length).toBe(2);
    expect(goog.math.Range.equals(target[0], range1)).toBe(true);
    // Second range should now be the combination of 2 and 3.
    expect(goog.math.Range.equals(target[1], expectOverlapRange)).toBe(true);
    // Start and end should also remain the samge
    expect(start).toBe(controller.getStart());
    expect(end).toBe(controller.getEnd());

    controller.clearLoadRanges();
    controller.addLoadRange(range1);
    controller.addLoadRange(range2);
    controller.addLoadRange(range3);

    // We should have 3 ranges
    target = controller.getLoadRanges();
    expect(target.length).toBe(3);

    // create range overlapping range2 and range 3
    controller.addLoadRange(overlappingRange);

    // We should now have 2 ranges
    target = controller.getLoadRanges();
    expect(target.length).toBe(2);
    expect(goog.math.Range.equals(target[0], range1)).toBe(true);
    // Second range should now be the combination of 2 and 3.
    expect(goog.math.Range.equals(target[1], expectOverlapRange)).toBe(true);
    // Start and end should not remain the samge
    expect(start).not.toBe(controller.getStart());
    expect(end).not.toBe(controller.getEnd());
  });

  it('mutiple ranges than updating an exsiting range to overlap other ranges should be combined', function() {
    // Setting up test case
    var start = 100000;
    var end = 100000000;
    controller.setRange(controller.buildRange(start, end));
    controller.setDuration(10);

    var range1 = new goog.math.Range(start + 10, start + 1000);
    var range2 = new goog.math.Range(start + 5000, start + 10000);
    var range3 = new goog.math.Range(start + 12000, start + 21000);
    var range4 = new goog.math.Range(range2.start, range3.start + 100);
    var expectOverlapRange = new goog.math.Range(range2.start, range3.end);

    controller.addAnimateRange(range1);
    controller.addAnimateRange(range2);
    controller.addAnimateRange(range3);

    // We should have 3 ranges
    var target = controller.getAnimationRanges();
    expect(target.length).toBe(3);

    controller.updateAnimateRange(range4, range2);

    // We should now have 2 ranges
    target = controller.getAnimationRanges();
    expect(target.length).toBe(2);
    expect(goog.math.Range.equals(target[0], range1)).toBe(true);
    // second range should now tbe the combined ragne of 2 and 3.
    expect(goog.math.Range.equals(target[1], expectOverlapRange)).toBe(true);
    // Start / end should also remain the samge
    expect(start).toBe(controller.getStart());
    expect(end).toBe(controller.getEnd());

    controller.clearHoldRanges();
    controller.addHoldRange(range1);
    controller.addHoldRange(range2);
    controller.addHoldRange(range3);

    // We should have 3 ranges
    var target = controller.getHoldRanges();
    expect(target.length).toBe(3);

    controller.updateHoldRange(range4, range2);

    // We should now have 2 ranges
    target = controller.getHoldRanges();
    expect(target.length).toBe(2);
    expect(goog.math.Range.equals(target[0], range1)).toBe(true);
    // second range should now tbe the combined ragne of 2 and 3.
    expect(goog.math.Range.equals(target[1], expectOverlapRange)).toBe(true);
    // Start / end should also remain the samge
    expect(start).toBe(controller.getStart());
    expect(end).toBe(controller.getEnd());

    controller.clearLoadRanges();
    controller.addLoadRange(range1);
    controller.addLoadRange(range2);
    controller.addLoadRange(range3);

    // We should have 3 ranges
    var target = controller.getLoadRanges();
    expect(target.length).toBe(3);

    controller.updateLoadRange(range4, range2);

    // We should now have 2 ranges
    target = controller.getLoadRanges();
    expect(target.length).toBe(2);
    expect(goog.math.Range.equals(target[0], range1)).toBe(true);
    // second range should now tbe the combined ragne of 2 and 3.
    expect(goog.math.Range.equals(target[1], expectOverlapRange)).toBe(true);
    // Start / end should not remain the samge
    expect(start).not.toBe(controller.getStart());
    expect(end).not.toBe(controller.getEnd());
  });

  it('a slice range with start greater than end, but less than a day should give 2 ranges per day', function() {
    var end = new Date();
    controller.setRange(controller.buildRange(end.getTime() - 86400000, end.getTime()));
    controller.setDuration(10);

    var range = new goog.math.Range(0, 1);
    range.start = 82800000;
    range.end = 5400000;

    // add
    controller.addSliceRange(range);

    // We should have 2 ranges
    var target = controller.getSliceRanges();
    expect(target.length).toBe(2);

    var range2 = new goog.math.Range();
    range2.start = 82900000;
    range2.end = 5500000;

    // update
    controller.updateSliceRange(range2, range);

    // We should have 2 ranges
    target = controller.getSliceRanges();
    expect(target.length).toBe(2);

    // clear - cleanup so it doesn't affect other tests
    controller.clearSliceRanges();

    // We should have 0 ranges
    target = controller.getSliceRanges();
    expect(target.length).toBe(0);
  });

  it('a slice range within last second of day should get deleted and updated correctly', function() {
    var end = new Date();
    controller.setRange(controller.buildRange(end.getTime() - 86400000, end.getTime()));
    controller.setDuration(10);

    var range = new goog.math.Range(0, 1);
    range.start = 5400000;
    range.end = 86400000;

    var modrange = new goog.math.Range(0, 1);
    modrange.start = 5400000;
    modrange.end = 86399000;
    // test update
    // add
    controller.addSliceRange(range);

    // We should have 1 range
    var target = controller.getSliceRanges();
    expect(target.length).toBe(1);

    var range2 = new goog.math.Range();
    range2.start = 0;
    range2.end = 5400000;

    // update
    controller.updateSliceRange(range2, modrange);

    // We should have 1 ranges
    target = controller.getSliceRanges();
    expect(target.length).toBe(1);

    // clear
    controller.clearSliceRanges();

    // test delete
    // add
    controller.addSliceRange(range);

    // We should have 1 range
    target = controller.getSliceRanges();
    expect(target.length).toBe(1);

    // delete modified slice range
    controller.removeSliceRange(modrange);

    // We should have 0 ranges
    target = controller.getSliceRanges();
    expect(target.length).toBe(0);

    // clear - cleanup so it doesn't affect other tests
    controller.clearSliceRanges();

    // We should have 0 ranges
    target = controller.getSliceRanges();
    expect(target.length).toBe(0);
  });

  it('changing the duration should clear both animate and hold ranges', function() {
    var start = 100000;
    var end = 100000000;
    controller.setRange(controller.buildRange(start, end));
    controller.setDuration(10);

    var range1 = new goog.math.Range(start + 10, start + 1000);
    var range2 = new goog.math.Range(start + 5000, start + 10000);
    var range3 = new goog.math.Range(start + 12000, start + 21000);

    controller.addAnimateRange(range1);
    controller.addAnimateRange(range2);
    controller.addHoldRange(range3);

    // We should have 2 ranges
    var target = controller.getAnimationRanges();
    expect(target.length).toBe(2);
    target = controller.getHoldRanges();
    expect(target.length).toBe(1);
    controller.setDuration('month');

    target = controller.getAnimationRanges();
    expect(target.length).toBe(0);
    target = controller.getHoldRanges();
    expect(target.length).toBe(0);
    target = controller.getLoadRanges();
    expect(target.length).toBe(1);
  });

  it('calling reconcileRanges should clear any out of bounds ranges', function() {
    var start = 100000;
    var end = 100000000;
    controller.setRange(controller.buildRange(start, end));
    controller.setDuration(10);

    var range1 = new goog.math.Range(start + 10, start + 1000);
    var range2 = new goog.math.Range(start + 5000, start + 10000);
    var range3 = new goog.math.Range(start + 12000, start + 21000);

    controller.addAnimateRange(range1);
    controller.addAnimateRange(range2);
    controller.addHoldRange(range3);

    // We should have 2 ranges
    var target = controller.getAnimationRanges();
    expect(target.length).toBe(2);
    target = controller.getHoldRanges();
    expect(target.length).toBe(1);
    // alter the main time range to cause r1 to be removed.
    controller.setRange(controller.buildRange(range1.end + 1, controller.getEnd()));
    // call reconcileRanges
    controller.reconcileRanges();
    // vefify
    target = controller.getAnimationRanges();
    expect(target.length).toBe(1);
    target = controller.getHoldRanges();
    expect(target.length).toBe(1);
    // alter the main time range to cause r3 to be removed.
    controller.setRange(controller.buildRange(controller.getStart(), range3.start - 1));
    // call reconcileRanges
    controller.reconcileRanges();
    // verify
    target = controller.getAnimationRanges();
    expect(target.length).toBe(1);
    target = controller.getHoldRanges();
    expect(target.length).toBe(0);
  });

  it('calling setRange twice with the same range should only clear load ranges once', function() {
    var start = 100000;
    var end = 100000000;

    spyOn(controller, 'clearLoadRanges').andCallThrough();
    controller.setRange(new goog.math.Range(start, end)); // calls clearLoadRanges once
    controller.setRange(new goog.math.Range(start, end)); // does not call clearLoadRanges
    controller.setRange(new goog.math.Range(start, end + 1000)); // calls clearLoadRanges second time
    expect(controller.clearLoadRanges.callCount).toEqual(2);
  });

  it('getNextFrame forward', function() {
    var target = controller.getNextFrame(controller.current_, 1);
    // advance one frame
    controller.next();
    expect(controller.current_ - controller.getOffset()).toBe(target.start);
    expect(controller.current_).toBe(target.end);
  });

  it('getNextFrame backward', function() {
    var target = controller.getNextFrame(controller.current_, -1);
    // advance back one frame
    controller.prev();
    expect(controller.current_ - controller.getOffset()).toBe(target.start);
    expect(controller.current_).toBe(target.end);
  });

  it('find nearest animate forward', function() {
    var range1 = new goog.math.Range(0, 1000);
    var range2 = new goog.math.Range(2000, 3000);
    var range3 = new goog.math.Range(4000, 5000);
    controller.setRange(controller.buildRange(0, 5000));
    controller.setDuration(100);
    controller.clearAnimateRanges();
    controller.addAnimateRange(range1);
    controller.addAnimateRange(range2);
    controller.addAnimateRange(range3);

    var result = controller.findNextNearestRange_(controller.animateRanges_, 1, 3100);
    // Outside of existing range, should return next range.
    expect(result.start).toBe(4000);
    // value within existing range should still return the next nearest range.
    // USE the rangeSet containsValue to test for being within an active range.
    result = controller.findNextNearestRange_(controller.animateRanges_, 1, 500);
    expect(result.start).toBe(2000);

    // value past the end of the range should return null
    result = controller.findNextNearestRange_(controller.animateRanges_, 1, 5200);
    expect(result).toBe(null);

    // value prior to beginning of the range return 1st
    result = controller.findNextNearestRange_(controller.animateRanges_, 1, -200);
    expect(result.start).toBe(0);
  });

  it('find nearest load forward with no animation present', function() {
    var range1 = new goog.math.Range(0, 1000);
    var range2 = new goog.math.Range(2000, 3000);
    var range3 = new goog.math.Range(4000, 5000);
    controller.clearLoadRanges();
    controller.addLoadRange(range1);
    controller.addLoadRange(range2);
    controller.addLoadRange(range3);
    controller.setDuration(100);

    var result = controller.findNextNearestRange_(controller.loadRanges_, 1, 3100);
    // Outside of existing range, should return next range.
    expect(result.start).toBe(4000);
    // value within existing range should still return the next nearest range.
    // USE the rangeSet containsValue to test for being within an active range.
    result = controller.findNextNearestRange_(controller.loadRanges_, 1, 500);
    expect(result.start).toBe(2000);

    // value past the end of the range should return null
    result = controller.findNextNearestRange_(controller.loadRanges_, 1, 5200);
    expect(result).toBe(null);

    // value prior to beginning of the range return 1st
    result = controller.findNextNearestRange_(controller.loadRanges_, 1, -200);
    expect(result.start).toBe(0);
  });

  it('find nearest animation backward', function() {
    var range1 = new goog.math.Range(0, 1000);
    var range2 = new goog.math.Range(2000, 3000);
    var range3 = new goog.math.Range(4000, 5000);
    controller.setRange(controller.buildRange(0, 5000));
    controller.setDuration(100);
    controller.clearAnimateRanges();
    controller.addAnimateRange(range1);
    controller.addAnimateRange(range2);
    controller.addAnimateRange(range3);

    var result = controller.findNextNearestRange_(controller.animateRanges_, -1, 3100);
    // Outside of existing range, should return previous range.
    expect(result.start).toBe(2000);
    // value within existing range should still return the previous nearest range.
    // USE the rangeSet containsValue to test for being within an active range.
    result = controller.findNextNearestRange_(controller.animateRanges_, -1, 2500);
    expect(result.start).toBe(0);

    // value past the end of the range should return last
    result = controller.findNextNearestRange_(controller.animateRanges_, -1, 5200);
    expect(result.start).toBe(4000);

    // value prior to beginning of the range should return null
    result = controller.findNextNearestRange_(controller.animateRanges_, -1, -200);
    expect(result).toBe(null);
  });

  it('find nearest load backward with no animation present', function() {
    var range1 = new goog.math.Range(0, 1000);
    var range2 = new goog.math.Range(2000, 3000);
    var range3 = new goog.math.Range(4000, 5000);
    controller.clearLoadRanges();
    controller.addLoadRange(range1);
    controller.addLoadRange(range2);
    controller.addLoadRange(range3);
    controller.setDuration(100);

    var result = controller.findNextNearestRange_(controller.loadRanges_, -1, 3100);
    // Outside of existing range, should return previous range.
    expect(result.start).toBe(2000);
    // value within existing range should still return the previous nearest range.
    // USE the rangeSet containsValue to test for being within an active range.
    result = controller.findNextNearestRange_(controller.loadRanges_, -1, 2500);
    expect(result.start).toBe(0);

    // value past the end of the range should return last
    result = controller.findNextNearestRange_(controller.loadRanges_, -1, 5200);
    expect(result.start).toBe(4000);

    // value prior to beginning of the range should return null
    result = controller.findNextNearestRange_(controller.loadRanges_, -1, -200);
    expect(result).toBe(null);
  });
});
