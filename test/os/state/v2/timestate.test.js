goog.require('os.state.v2.TimeState');
goog.require('os.time.TimelineController');
goog.require('os.ui.timeline.AbstractTimelineCtrl');
goog.require('os.xml');

describe('os.state.v2.TimeState', function() {
  var time = '<time>' +
      '<interval>2016-02-14T00:00:00Z/2016-02-18T00:00:00Z</interval>' +
      '<current>2016-02-16T12:00:00Z/2016-02-17T12:00:00Z</current>' +
      '<advance>PT12H</advance>' +
      '<sequence>' +
      '<interval>2016-02-14T00:00:00Z/2016-02-15T00:00:00Z</interval>' +
      '<interval>2016-02-15T00:00:00Z/2016-02-16T00:00:00Z</interval>' +
      '<interval>2016-02-16T00:00:00Z/2016-02-17T00:00:00Z</interval>' +
      '<interval>2016-02-17T00:00:00Z/2016-02-18T00:00:00Z</interval>' +
      '</sequence>' +
      '<animation>' +
      '<loop>2016-02-14T00:00:00Z/2016-02-18T00:00:00Z</loop>' +
      '<loopBehavior>taperEndSnapStart</loopBehavior>' +
      '<millisPerFrame>1000</millisPerFrame>' +
      '<playState>Stop</playState>' +
      '</animation>' +
      '<duration>day</duration>' +
      '<holds>' +
      '<interval>2016-02-14T00:00:00Z/2016-02-15T00:00:00Z</interval>' +
      '</holds>' +
      '</time>';

  var id = goog.string.getRandomString();
  var xmlTime = goog.dom.xml.loadXml(time).firstChild;
  var state = new os.state.v2.TimeState();
  var tlc;

  beforeEach(function() {
    tlc = os.time.TimelineController.getInstance();

    // pretend the timeline UI is in the correct open/closed state
    spyOn(os.state.v2.TimeState, 'testUIState').andReturn(true);
  });

  it('should initialize correctly', function() {
    expect(state.description).toBe('Saves the current timeline');
    expect(state.priority).toBe(100);
    expect(state.rootName).toBe('time');
    expect(state.title).toBe('Time');
  });

  it('should load correctly', function() {
    // default config of the TimelineController
    var initialStart = tlc.getStart();
    var initialEnd = tlc.getEnd();

    state.load(xmlTime, id);

    expect(initialStart != tlc.getStart()).toBe(true);
    expect(tlc.getStart()).toBe(1455408000000);
    expect(initialEnd != tlc.getEnd()).toBe(true);
    expect(tlc.getEnd()).toBe(1455753600000);

    expect(tlc.getLoopStart()).toBe(1455408000000);
    expect(tlc.getLoopEnd()).toBe(1455753600000);

    expect(tlc.getSkip()).toBe(43200000);
    expect(tlc.getDuration()).toBe('day');
    expect(tlc.getFps()).toBe(1);

    expect(tlc.getOffset()).toBe(86400000);

    // the intervals defined in the sequence element all overlap and will be merged into a single range. that range is
    // equal to the full loaded interval, so the custom animation ranges will be cleared.
    var animationRanges = tlc.getAnimationRanges();
    expect(animationRanges.length).toBe(0);

    var holdRanges = tlc.getHoldRanges();
    expect(holdRanges.length).toBe(1);
  });

  it('should load correctly with namespace', function() {
    tlc.setRange(tlc.buildRange(0, 1));
    tlc.clearAnimateRanges();
    tlc.clearHoldRanges();
    tlc.setSkip(0);
    tlc.setFps(10);
    // default config of the TimelineController
    var initialStart = tlc.getStart();
    var initialEnd = tlc.getEnd();
    var xstime = time.replace('<time>', '<time xmlns="http://www.bit-sys.com/state/v3">');
    xmlTime = goog.dom.xml.loadXml(xstime).firstChild;

    state.load(xmlTime, id);

    expect(initialStart != tlc.getStart()).toBe(true);
    expect(tlc.getStart()).toBe(1455408000000);
    expect(initialEnd != tlc.getEnd()).toBe(true);
    expect(tlc.getEnd()).toBe(1455753600000);

    expect(tlc.getLoopStart()).toBe(1455408000000);
    expect(tlc.getLoopEnd()).toBe(1455753600000);

    expect(tlc.getSkip()).toBe(43200000);
    expect(tlc.getDuration()).toBe('day');
    expect(tlc.getFps()).toBe(1);

    expect(tlc.getOffset()).toBe(86400000);

    // the intervals defined in the sequence element all overlap and will be merged into a single range. that range is
    // equal to the full loaded interval, so the custom animation ranges will be cleared.
    var animationRanges = tlc.getAnimationRanges();
    expect(animationRanges.length).toBe(0);

    var holdRanges = tlc.getHoldRanges();
    expect(holdRanges.length).toBe(1);
  });

  it('should remove correctly', function() {
    // verify that it's a noop
    var initialStart = tlc.getStart();
    var initialEnd = tlc.getEnd();
    state.remove(id);
    expect(tlc.getStart()).toBe(initialStart);
    expect(tlc.getEnd()).toBe(initialEnd);
  });

  it('should convert range to timestring', function() {
    var range = new goog.math.Range(1000000, 100000000);
    var string = state.rangeToDateFormatString_(range);
    expect(string).toBe('1970-01-01T00:16:40Z/1970-01-02T03:46:40Z');
  });

  it('should convert timestring to range', function() {
    var range = state.intervalStringToRange_('1970-01-01T00:16:40Z/1970-01-02T03:46:40Z');
    expect(range.start).toBe(1000000);
    expect(range.end).toBe(100000000);
  });

  it('should save correctly', function() {
    var options = {
      doc: goog.dom.xml.createDocument()
    };
    var rootObj = os.xml.createElement(os.state.v2.TimeTag.FILTERS);

    // Full time range.
    var startDate = os.time.parseMoment('1970-01-01T00:16:39Z', [os.state.v2.TimeState.DATE_FORMAT], true);
    var endDate = os.time.parseMoment('1974-03-15T02:21:41Z', [os.state.v2.TimeState.DATE_FORMAT], true);
    tlc.setRange(tlc.buildRange(startDate.valueOf(), endDate.valueOf()));
    var fullRangeString = state.rangeToDateFormatString_(tlc.getRange());
    tlc.setDuration('month');
    // Animate range
    var animateStartDate = os.time.parseMoment('1971-01-01T00:16:39Z',
        [os.state.v2.TimeState.DATE_FORMAT], true);
    var animateEndDate = os.time.parseMoment('1973-03-15T02:21:41Z',
        [os.state.v2.TimeState.DATE_FORMAT], true);
    var animateRange = new goog.math.Range(animateStartDate.valueOf(), animateEndDate.valueOf());
    var animateRangeString = state.rangeToDateFormatString_(animateRange);
    tlc.clearAnimateRanges();
    tlc.addAnimateRange(animateRange);

    // Hold range
    var holdStartDate = os.time.parseMoment('1971-03-01T00:16:39Z',
        [os.state.v2.TimeState.DATE_FORMAT], true);
    var holdEndDate = os.time.parseMoment('1971-06-12T01:15:11Z',
        [os.state.v2.TimeState.DATE_FORMAT], true);
    var holdRange = new goog.math.Range(holdStartDate.valueOf(), holdEndDate.valueOf());
    var holdRangeString = state.rangeToDateFormatString_(holdRange);
    // make sure this is empty bfore the test.
    tlc.clearHoldRanges();
    tlc.addHoldRange(holdRange);

    tlc.setCurrent(animateEndDate.valueOf());
    tlc.setFps(1);
    tlc.setOffset(1000002);
    tlc.setSkip(10000000);

    var currentString = state.rangeToDateFormatString_(new goog.math.Range(animateEndDate.valueOf() - tlc.getOffset(),
        animateEndDate.valueOf()));

    // Add a fakey-fake timeline element to the DOM. The time state checks this to determine whether the
    // timeline is open and we want to simulate that state.
    var fakeTimeline = os.xml.appendElement('div', document.body, null, {'class': 'js-timeline'});
    state.saveInternal(options, rootObj);

    expect(goog.dom.getChildren(rootObj).length).toBe(7);

    expect(rootObj.querySelector(os.state.v2.TimeTag.INTERVAL).textContent)
        .toBe(fullRangeString);

    expect(rootObj.querySelector(os.state.v2.TimeTag.CURRENT).textContent)
        .toBe(currentString);

    expect(rootObj.querySelector(os.state.v2.TimeTag.ADVANCE).textContent).toBe('PT2H46M40S');
    expect(rootObj.querySelector(os.state.v2.TimeTag.DURATION).textContent).toBe('month');

    var sequence = rootObj.querySelector(os.state.v2.TimeTag.SEQUENCE);
    expect(sequence).not.toBeNull();
    expect(sequence.childNodes.length).toBe(1);
    expect(sequence.childNodes[0].textContent).toBe(animateRangeString);

    var holds = rootObj.querySelector(os.state.v2.TimeTag.HOLDS);
    expect(holds).not.toBeNull();
    expect(holds.childNodes.length).toBe(1);
    expect(holds.childNodes[0].textContent).toBe(holdRangeString);


    var animation = rootObj.querySelector(os.state.v2.TimeTag.ANIMATION);
    expect(animation).not.toBeNull();
    expect(animation.childNodes.length).toBe(4);

    expect(animation.querySelector(os.state.v2.TimeTag.LOOP).textContent)
        .toBe(animateRangeString);
    expect(animation.querySelector(os.state.v2.TimeTag.LOOP_BEHAVIOR).textContent).toBe('taperEndSnapStart');
    expect(animation.querySelector(os.state.v2.TimeTag.MS_PER_FRAME).textContent).toBe('1000');
    expect(animation.querySelector(os.state.v2.TimeTag.PLAY_STATE).textContent).toBe('Stop');

    document.body.removeChild(fakeTimeline);
  });
});
