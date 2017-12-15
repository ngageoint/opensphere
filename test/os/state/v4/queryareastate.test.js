goog.require('goog.dom');
goog.require('goog.dom.xml');
goog.require('goog.string');
goog.require('ol.Feature');
goog.require('ol.geom.Polygon');
goog.require('os.state.XMLStateOptions');
goog.require('os.state.v4.QueryArea');
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
    }, 'Wait for XSD(s) to laod', 2 * jasmine.DEFAULT_TIMEOUT_INTERVAL);

    // Runs the tests.
    runs(function() {
      var area = new ol.Feature();
      area.setId('TestAreaId');
      area.set('title', 'Test Area');
      area.set('description', 'Area description');
      area.set('tags', 'AOI');

      var state = new os.state.v4.QueryArea();
      var box = new ol.geom.Polygon([[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]);
      var activeQieries = [
        {
          'areaId': 'state#tfscv6m2l1gh-state#xrfum5dv146y-area_w0bik1ljk90r',
          'filterGroup': true,
          'filterId': '*',
          'includeArea': true,
          'layerId': 'state#tfscv6m2l1gh-state-xrfum5dv146y-default-SOME_LAYER_A#features',
          'temp': true
        }
      ];
      area.setGeometry(box);

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

      var queryAreasNode = xmlRootDocument.firstElementChild.querySelector('queryAreas');
      // Actually loading this state is problematic,  so just doing basic validation of the document.
      expect(queryAreasNode).toBeDefined();
      expect(queryAreasNode.childNodes.length).toBe(1); // only one area was added
      expect(queryAreasNode.firstChild.nodeName).toBe('queryArea');
      expect(queryAreasNode.firstChild.id).toBe(area.getId());

      var areaNode = queryAreasNode.firstChild;
      expect(areaNode.querySelector('description').textContent).toBe('Area description');
      expect(areaNode.querySelector('tags').textContent).toBe('AOI');
      expect(areaNode.getAttribute('title')).toBe('Test Area');
    });
  });
});
