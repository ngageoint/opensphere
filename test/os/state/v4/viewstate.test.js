goog.require('goog.dom');
goog.require('goog.dom.xml');
goog.require('goog.string');
goog.require('os.MapContainer');
goog.require('os.state.v4.ViewState');
goog.require('os.ui.state.XMLStateManager');

describe('os.state.v4.ViewState', function() {
  var stateManager = null;

  beforeEach(function() {
    stateManager = os.state.StateManager.getInstance();
    stateManager.setVersion(os.state.Versions.V4);
  });

  it('should produce a valid state file with view state', function() {
    var resultSchemas = null;
    var map = os.MapContainer.getInstance();
    var cameraResults = {
      'center': [0, 0],
      'altitude': 45351397.87249297,
      'heading': 360,
      'roll': 200,
      'tilt': 50,
      'zoom': 2.1
    };

    // The map really is not initalized, so mocking expected behavior
    // from methods used by the state save process.
    spyOn(map, 'is3DEnabled').andCallFake(function() {
      return true;
    });

    spyOn(map, 'persistCameraState').andCallFake(function() {
      return cameraResults;
    });

    spyOn(map, 'restoreCameraState').andCallFake(function() {

    });

    spyOn(map, 'setWebGLEnabled').andCallFake(function() {

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
      var state = new os.state.v4.ViewState();
      var xmlRootDocument = stateManager.createStateObject(function() {}, 'test state', 'desc');
      var stateOptions = stateManager.createStateOptions(function() {}, 'test state', 'desc');
      stateOptions.doc = xmlRootDocument;
      state.save(stateOptions);
      var seralizedDoc = os.xml.serialize(stateOptions.doc);
      var xmlLintResult = xmllint.validateXML({
        xml: seralizedDoc,
        schema: resultSchemas
      });
      expect(xmlLintResult.errors).toBe(null);

      // now that we have the document, test load as well.
      var mapNode = xmlRootDocument.firstElementChild.querySelector('map');
      state.load(mapNode, 'do-not-care');

      expect(map.restoreCameraState).toHaveBeenCalled();
      // The map mode should not have changed.
      expect(map.setWebGLEnabled).not.toHaveBeenCalled();
    });
  });
});
