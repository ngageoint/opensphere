goog.require('goog.dom');
goog.require('goog.dom.xml');
goog.require('goog.math.RangeSet');
goog.require('goog.string');
goog.require('os.MapContainer');
goog.require('os.state.v4.TimeState');
goog.require('os.ui.state.XMLStateManager');

describe('os.state.v4.TimeState', function() {
  var stateManager = null;

  beforeEach(function() {
    stateManager = os.state.StateManager.getInstance();
    stateManager.setVersion(os.state.Versions.V4);

    // pretend the timeline UI is in the correct open/closed state
    spyOn(os.state.v4.TimeState, 'testUIState').andReturn(true);
  });

  it('should produce a valid state file with time state', function() {
    var resultSchemas = null;
    var state = new os.state.v4.TimeState();
    var tlc = os.time.TimelineController.getInstance();
    // Ensure the timeline controler is initalized
    var startDate = os.time.parseMoment('1970-01-01T00:16:39.999Z', [os.state.v2.TimeState.DATE_FORMAT], true);
    var endDate = os.time.parseMoment('1974-03-15T02:21:41.010Z', [os.state.v2.TimeState.DATE_FORMAT], true);
    tlc.setRange(tlc.buildRange(startDate.valueOf(), endDate.valueOf()));
    tlc.setDuration('month');
    // Animate range
    var animateStartDate = os.time.parseMoment('1971-01-01T00:16:39.999Z',
        [os.state.v2.TimeState.DATE_FORMAT], true);
    var animateEndDate = os.time.parseMoment('1973-03-15T02:21:41.010Z',
        [os.state.v2.TimeState.DATE_FORMAT], true);
    var animateRange = new goog.math.Range(animateStartDate.valueOf(), animateEndDate.valueOf());
    tlc.clearAnimateRanges();
    tlc.addAnimateRange(animateRange);

    // Hold range
    var holdStartDate = os.time.parseMoment('1971-03-01T00:16:39.999Z',
        [os.state.v2.TimeState.DATE_FORMAT], true);
    var holdEndDate = os.time.parseMoment('1971-06-12T01:15:11.010Z',
        [os.state.v2.TimeState.DATE_FORMAT], true);
    var holdRange = new goog.math.Range(holdStartDate.valueOf(), holdEndDate.valueOf());
    // make sure this is empty bfeore the test.
    tlc.clearHoldRanges();
    tlc.addHoldRange(holdRange);

    tlc.setCurrent(animateEndDate.valueOf());
    tlc.setFps(1);
    tlc.setOffset(1000002);
    tlc.setSkip(10000000);

    // configure some spys to validate loading
    spyOn(tlc, 'setDuration').andCallThrough();
    spyOn(tlc, 'setAnimateRanges').andCallThrough();
    spyOn(tlc, 'setHoldRanges').andCallThrough();
    spyOn(tlc, 'setCurrent').andCallThrough();
    spyOn(tlc, 'setSkip').andCallThrough();
    spyOn(tlc, 'setFps').andCallThrough();

    // set up mock return true on the state isTimeLineVisible, so all elements
    // will get seralized
    spyOn(state, 'isTimeLineVisible').andCallFake(function() {
      return true;
    });

    // Using jasman's async test, as we need to load the xsd files
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
    }, 'Wait for XSD(s) to laod', 2 * jasmine.DEFAULT_TIMEOUT_INTERVAL);

    // Runs the tests.
    runs(function() {
      var xmlRootDocument = stateManager.createStateObject(function() {}, 'test time state', 'desc');
      var stateOptions = stateManager.createStateOptions(function() {}, 'test time state', 'desc');
      stateOptions.doc = xmlRootDocument;
      var rootObj = state.createRoot(stateOptions);
      xmlRootDocument.firstElementChild.appendChild(rootObj);
      // get ref to current vals
      var duration = tlc.getDuration();
      var aRanges = tlc.animateRanges_.clone();
      var hRanges = tlc.holdRanges_.clone();
      var current = tlc.getCurrent();
      var skip = tlc.getSkip();
      var fps = tlc.getFps();
      // The state.save method triggers more than required for this test
      // calling the interal save directly.
      state.saveInternal(stateOptions, rootObj);

      var seralizedDoc = os.xml.serialize(stateOptions.doc);
      var xmlLintResult = xmllint.validateXML({
        xml: seralizedDoc,
        schema: resultSchemas
      });
      expect(xmlLintResult.errors).toBe(null);

      // now that we have the document, test load as well.
      var timeNode = xmlRootDocument.firstElementChild.querySelector('time');
      state.load(timeNode, 'do-not-care');
      // Validate the loaded state against the values orginally
      // in the time line controller.
      expect(tlc.setDuration).toHaveBeenCalled();
      // When the timeline controler is loaded from a state, it goes
      // through an auto-configuration step that computes a
      // good duration, I believe that a ticket was written againt
      // using the stored value...?
      expect(tlc.setDuration.mostRecentCall.args[0]).not.toBe(duration);

      expect(tlc.setAnimateRanges).toHaveBeenCalled();
      expect(goog.math.RangeSet.equals(aRanges,
          tlc.setAnimateRanges.mostRecentCall.args[0])).toBe(true);

      expect(tlc.setHoldRanges).toHaveBeenCalled();
      expect(goog.math.RangeSet.equals(hRanges,
          tlc.setHoldRanges.mostRecentCall.args[0])).toBe(true);

      expect(tlc.setCurrent).toHaveBeenCalled();
      expect(tlc.setCurrent.mostRecentCall.args[0]).toBe(current);

      expect(tlc.setSkip).toHaveBeenCalled();
      expect(tlc.setSkip.mostRecentCall.args[0]).toBe(skip);

      expect(tlc.setFps).toHaveBeenCalled();
      expect(tlc.setFps.mostRecentCall.args[0]).toBe(fps);
    });
  });
});
