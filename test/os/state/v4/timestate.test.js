goog.require('goog.math.RangeSet');
goog.require('os.state.v4.TimeState');

describe('os.state.v4.TimeState', function() {
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
      os.test.xsd.loadStateXsdFiles().then(function(result) {
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
    var seralizedDoc = os.xml.serialize(stateOptions.doc);
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

  beforeEach(function() {
    stateManager = os.state.StateManager.getInstance();
    stateManager.setVersion(os.state.Versions.V4);
    tlc = os.time.TimelineController.getInstance();
    resultSchemas = null;
    state = new os.state.v4.TimeState();
    stateOptions = stateManager.createStateOptions(function() {}, 'test time state', 'desc');
    xmlRootDocument = stateManager.createStateObject(function() {}, 'test time state', 'desc');

    // pretend the timeline UI is in the correct open/closed state
    spyOn(os.state.v4.TimeState, 'testUIState').andReturn(true);
    // set up mock return true on the state isTimeLineVisible, so all elements
    // will get seralized
    spyOn(state, 'isTimeLineVisible').andCallFake(function() {
      return true;
    });
  });

  it('should produce a valid state file with time state', function() {
    // Ensure the timeline controler is initalized
    var startDate = os.time.parseMoment('1970-01-01T00:16:39Z', [os.state.v4.TimeState.DATE_FORMAT], true);
    var endDate = os.time.parseMoment('1974-03-15T02:21:41Z', [os.state.v4.TimeState.DATE_FORMAT], true);
    tlc.setRange(tlc.buildRange(startDate.valueOf(), endDate.valueOf()));
    tlc.setDuration('month');
    // Animate range
    var animateStartDate = os.time.parseMoment('1971-01-01T00:16:39Z',
        [os.state.v4.TimeState.DATE_FORMAT], true);
    var animateEndDate = os.time.parseMoment('1973-03-15T02:21:41Z',
        [os.state.v4.TimeState.DATE_FORMAT], true);
    var animateRange = new goog.math.Range(animateStartDate.valueOf(), animateEndDate.valueOf());
    tlc.clearAnimateRanges();
    tlc.addAnimateRange(animateRange);

    // Hold range
    var holdStartDate = os.time.parseMoment('1971-03-01T00:16:39Z',
        [os.state.v4.TimeState.DATE_FORMAT], true);
    var holdEndDate = os.time.parseMoment('1971-06-12T01:15:11Z',
        [os.state.v4.TimeState.DATE_FORMAT], true);
    var holdRange = new goog.math.Range(holdStartDate.valueOf(), holdEndDate.valueOf());
    // make sure this is empty before the test.
    tlc.clearHoldRanges();
    tlc.addHoldRange(holdRange);

    // Slice ranges
    var sliceRange1 = new goog.math.Range(20, 50);
    var sliceRange2 = new goog.math.Range(20000, 5000000);
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
      expect(goog.math.RangeSet.equals(aRanges,
          tlc.setAnimateRanges.mostRecentCall.args[0])).toBe(true);

      expect(tlc.setHoldRanges).toHaveBeenCalled();
      expect(goog.math.RangeSet.equals(hRanges,
          tlc.setHoldRanges.mostRecentCall.args[0])).toBe(true);

      expect(tlc.setSliceRanges).toHaveBeenCalled();
      expect(goog.math.RangeSet.equals(sRanges,
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
});
