goog.require('goog.dom');
goog.require('goog.dom.xml');
goog.require('goog.string');
goog.require('ol.Feature');
goog.require('ol.geom.Polygon');
goog.require('os.state.XMLStateOptions');
goog.require('os.state.v2.ExclusionArea'); // v2 state implemention works with v4
goog.require('os.test.xsd');
goog.require('os.ui.query.AreaManager');
goog.require('os.ui.state.XMLStateManager');
goog.require('os.xml');



describe('QueryArea XSD State Test', function() {
  var stateManager = null;
  beforeEach(function() {
    stateManager = os.state.StateManager.getInstance();
    stateManager.setVersion(os.state.Versions.V4);
  });

  it('Should validate against the v4 XSD state', function() {
    var resultSchemas = null;
    runs(function() {
      os.test.xsd.loadStateXsdFiles().then(function(result) {
        resultSchemas = result;
      }, function(err) {
        throw err;
      });
    });

    // waiting for the xsd files to load
    waitsFor(function() {
      return (resultSchemas && os.ui.state && os.ui.state.StateManager);
    }, 'Wait for XSD(s) to load', 2 * jasmine.DEFAULT_TIMEOUT_INTERVAL);

    // Runs the tests.
    runs(function() {
      var area = new ol.Feature();
      var box = new ol.geom.Polygon([[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]);
      area.setId('TestAreaId');
      area.setGeometry(box);
      var state = new os.state.v2.ExclusionArea();
      var activeQieries = [
        {
          'areaId': 'state#tfscv6m2l1gh-state#xrfum5dv146y-area_w0bik1ljk90r',
          'filterGroup': true,
          'filterId': '*',
          'includeArea': true,
          'layerId': 'state#tfscv6m2l1gh-state-xrfum5dv146y-default-SOME_LAYER_A#features',
          'temp': true
        },
        {
          'areaId': 'area_69tb6muvhwjd',
          'filterGroup': true,
          'filterId': '*',
          'includeArea': false,
          'layerId': '*'
        }
      ];

      // Mock required behavor for area and query manager
      spyOn(os.ui.queryManager, 'getActiveEntries').andReturn(activeQieries);
      spyOn(os.ui.areaManager, 'get').andReturn(area);

      // Setting up independent root for testing.
      var xmlRootDocument = stateManager.createStateObject(function() {}, 'test state', 'desc');
      var stateOptions = stateManager.createStateOptions(function() {}, 'test state', 'desc');
      stateOptions.doc = xmlRootDocument;
      var rootObj = state.createRoot(stateOptions);
      xmlRootDocument.firstElementChild.appendChild(rootObj);

      state.saveInternal(stateOptions, rootObj);

      var seralizedDoc = os.xml.serialize(stateOptions.doc);
      var xmlLintResult = xmllint.validateXML({
        xml: seralizedDoc,
        schema: resultSchemas
      });
      expect(xmlLintResult.errors).toBe(null);

      var exclusionAreasNode = xmlRootDocument.firstElementChild.querySelector('exclusionAreas');
      // actually loading this state is problmatic,  so just doing basic validation of the document.
      expect(exclusionAreasNode).toBeDefined();
      expect(exclusionAreasNode.childNodes.length).toBe(1); // only one area was added
      expect(exclusionAreasNode.firstChild.nodeName).toBe('exclusionArea');
      expect(exclusionAreasNode.firstChild.id).toBe(area.getId());
    });
  });
});
