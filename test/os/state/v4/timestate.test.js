goog.require('goog.math.Range');
goog.require('goog.math.RangeSet');
goog.require('os.state.StateManager');
goog.require('os.state.Versions');
goog.require('os.state.v4.TimeState');
goog.require('os.time');
goog.require('os.time.TimelineController');
goog.require('os.xml');

describe('os.state.v4.TimeState', function() {
  const Range = goog.module.get('goog.math.Range');
  const RangeSet = goog.module.get('goog.math.RangeSet');
  const {default: StateManager} = goog.module.get('os.state.StateManager');
  const {default: Versions} = goog.module.get('os.state.Versions');
  const {default: TimeState} = goog.module.get('os.state.v4.TimeState');
  const time = goog.module.get('os.time');
  const {default: TimelineController} = goog.module.get('os.time.TimelineController');
  const xml = goog.module.get('os.xml');

  const {loadStateXsdFiles} = goog.module.get('os.test.xsd');

  var stateManager = null;
  var tlc = null;
  var resultSchemas = null;
  var state = null;
  var stateOptions = null;
  var xmlRootDocument = null;

  var testAndLoadXsdFiles = function() {
    // Using jasmine's async test, as we need to load the xsd files
    // that are used by xmllint.
    runs(function() {
      loadStateXsdFiles().then(function(result) {
        resultSchemas = result;
      }, function(err) {
        throw err;
      });
    });

    // waiting for the xsd files to load
    waitsFor(function() {
      return (resultSchemas !== null);
    }, 'Wait for XSD(s) to load', 2 * jasmine.DEFAULT_TIMEOUT_INTERVAL);
  };

  var testStateSaveAndLoad = function() {
    // The state.save method triggers more than required for this test
    // calling the interal save directly.
    stateSaveInternal();
    expect(getXmlLintResult().errors).toBe(null);
    testStateLoad();
  };

  var stateSaveInternal = function() {
    stateOptions.doc = xmlRootDocument;
    rootObj = state.createRoot(stateOptions);
    xmlRootDocument.firstElementChild.appendChild(rootObj);

    state.saveInternal(stateOptions, rootObj);
  };

  var getXmlLintResult = function() {
    var seralizedDoc = xml.serialize(stateOptions.doc);
    return xmllint.validateXML({
      xml: seralizedDoc,
      schema: resultSchemas
    });
  };

  var testStateLoad = function() {
    var timeNode = xmlRootDocument.firstElementChild.querySelector('time');
    state.load(timeNode, 'do-not-care');
  };

  var testTimeStateWithLock = function(isLocked) {
    tlc.setLock(isLocked);

    spyOn(tlc, 'setLock').andCallThrough();

    testAndLoadXsdFiles();

    // Runs the tests.
    runs(function() {
      var lock = tlc.getLock();

      testStateSaveAndLoad();

      expect(tlc.setLock).toHaveBeenCalled();
      expect(tlc.setLock.mostRecentCall.args[0]).toBe(lock);
    });
  };

  var testTimeStateWithFade = function(fadeOn) {
    tlc.setFade(fadeOn);

    spyOn(tlc, 'setFade').andCallThrough();

    testAndLoadXsdFiles();

    // Runs the tests.
    runs(function() {
      var fade = tlc.getFade();

      testStateSaveAndLoad();

      expect(tlc.setFade).toHaveBeenCalled();
      expect(tlc.setFade.mostRecentCall.args[0]).toBe(fade);
    });
  };

  var testTimeStateWithAutoConfigure = function(autoConfigureOn) {
    tlc.setAutoConfigure(autoConfigureOn);

    spyOn(tlc, 'setAutoConfigure').andCallThrough();

    testAndLoadXsdFiles();

    // Runs the tests.
    runs(function() {
      var autoConfigure = tlc.getAutoConfigure();

      testStateSaveAndLoad();

      expect(tlc.setAutoConfigure).toHaveBeenCalled();
      expect(tlc.setAutoConfigure.mostRecentCall.args[0]).toBe(autoConfigure);
    });
  };

  beforeEach(function() {
    stateManager = StateManager.getInstance();
    stateManager.setVersion(Versions.V4);
    tlc = TimelineController.getInstance();
    resultSchemas = null;
    state = new TimeState();
    stateOptions = stateManager.createStateOptions(function() {}, 'test time state', 'desc');
    xmlRootDocument = stateManager.createStateObject(function() {}, 'test time state', 'desc');

    // pretend the timeline UI is in the correct open/clos1ed state
    spyOn(TimeState, 'testUIState').andReturn(true);
    // set up mock return true on the state isTimeLineVisible, so all elements
    // will get seralized
    spyOn(state, 'isTimeLineVisible').andCallFake(function() {
      return true;
    });
  });

  it('should produce a valid state file with time state', function() {
    // Ensure the timeline controler is initalized
    var startDate = time.parseMoment('1970-01-01T00:16:39Z', [TimeState.DATE_FORMAT], true);
    var endDate = time.parseMoment('1974-03-15T02:21:41Z', [TimeState.DATE_FORMAT], true);
    tlc.setRange(tlc.buildRange(startDate.valueOf(), endDate.valueOf()));
    tlc.setDuration('month');
    // Animate range
    var animateStartDate = time.parseMoment('1971-01-01T00:16:39Z',
        [TimeState.DATE_FORMAT], true);
    var animateEndDate = time.parseMoment('1973-03-15T02:21:41Z',
        [TimeState.DATE_FORMAT], true);
    var animateRange = new Range(animateStartDate.valueOf(), animateEndDate.valueOf());
    tlc.clearAnimateRanges();
    tlc.addAnimateRange(animateRange);

    // Hold range
    var holdStartDate = time.parseMoment('1971-03-01T00:16:39Z',
        [TimeState.DATE_FORMAT], true);
    var holdEndDate = time.parseMoment('1971-06-12T01:15:11Z',
        [TimeState.DATE_FORMAT], true);
    var holdRange = new Range(holdStartDate.valueOf(), holdEndDate.valueOf());
    // make sure this is empty before the test.
    tlc.clearHoldRanges();
    tlc.addHoldRange(holdRange);

    // Slice ranges
    var sliceRange1 = new Range(20, 50);
    var sliceRange2 = new Range(20000, 5000000);
    tlc.addSliceRange(sliceRange1);
    tlc.addSliceRange(sliceRange2);

    tlc.setCurrent(animateEndDate.valueOf());
    tlc.setFps(1);
    tlc.setOffset(1000002);
    tlc.setSkip(10000000);

    // configure some spys to validate loading
    spyOn(tlc, 'setDuration').andCallThrough();
    spyOn(tlc, 'setAnimateRanges').andCallThrough();
    spyOn(tlc, 'setHoldRanges').andCallThrough();
    spyOn(tlc, 'setSliceRanges').andCallThrough();
    spyOn(tlc, 'setCurrent').andCallThrough();
    spyOn(tlc, 'setSkip').andCallThrough();
    spyOn(tlc, 'setFps').andCallThrough();

    testAndLoadXsdFiles();

    // Runs the tests.
    runs(function() {
      // get ref to current vals
      var duration = tlc.getDuration();
      var aRanges = tlc.animateRanges_.clone();
      var hRanges = tlc.holdRanges_.clone();
      var sRanges = tlc.sliceRanges_.clone();
      var current = tlc.getCurrent();
      var skip = tlc.getSkip();
      var fps = tlc.getFps();

      testStateSaveAndLoad();

      // Validate the loaded state against the values orginally
      // in the time line controller.
      expect(tlc.setDuration).toHaveBeenCalled();
      // When the timeline controler is loaded from a state, it goes
      // through an auto-configuration step that computes a
      // good duration, I believe that a ticket was written against
      // using the stored value...?
      expect(tlc.setDuration.mostRecentCall.args[0]).not.toBe(duration);

      expect(tlc.setAnimateRanges).toHaveBeenCalled();
      expect(RangeSet.equals(aRanges,
          tlc.setAnimateRanges.mostRecentCall.args[0])).toBe(true);

      expect(tlc.setHoldRanges).toHaveBeenCalled();
      expect(RangeSet.equals(hRanges,
          tlc.setHoldRanges.mostRecentCall.args[0])).toBe(true);

      expect(tlc.setSliceRanges).toHaveBeenCalled();
      expect(RangeSet.equals(sRanges,
          tlc.setSliceRanges.mostRecentCall.args[0])).toBe(true);

      expect(tlc.setCurrent).toHaveBeenCalled();
      expect(tlc.setCurrent.mostRecentCall.args[0]).toBe(current);

      expect(tlc.setSkip).toHaveBeenCalled();
      expect(tlc.setSkip.mostRecentCall.args[0]).toBe(skip);

      expect(tlc.setFps).toHaveBeenCalled();
      expect(tlc.setFps.mostRecentCall.args[0]).toBe(fps);
    });
  });

  it('should produce a valid state file with time state and timeline not locked', function() {
    testTimeStateWithLock(false);
  });

  it('should produce a valid state file with time state and timeline locked', function() {
    testTimeStateWithLock(true);
  });

  it('should produce a valid state file with time state and fade turned off', function() {
    testTimeStateWithFade(false);
  });

  it('should produce a valid state file with time state and fade turned on', function() {
    testTimeStateWithFade(true);
  });

  it('should produce a valid state file with time state and auto configure turned off', function() {
    testTimeStateWithAutoConfigure(false);
  });

  it('should produce a valid state file with time state and auto configure turned on', function() {
    testTimeStateWithAutoConfigure(true);
  });
});
