goog.require('goog.dom');
goog.require('goog.dom.xml');
goog.require('goog.string');
goog.require('ol.Feature');
goog.require('ol.geom.Polygon');
goog.require('os.query.AreaManager');
goog.require('os.query.BaseAreaManager');
goog.require('os.query.QueryManager');
goog.require('os.state.BaseStateManager');
goog.require('os.state.StateManager');
goog.require('os.state.Versions');
goog.require('os.state.XMLStateManager');
goog.require('os.state.XMLStateOptions');
goog.require('os.state.v2.ExclusionArea');
goog.require('os.test.xsd');
goog.require('os.ui.state');
goog.require('os.xml');

describe('QueryArea XSD State Test', function() {
  const Feature = goog.module.get('ol.Feature');
  const Polygon = goog.module.get('ol.geom.Polygon');
  const {default: AreaManager} = goog.module.get('os.query.AreaManager');
  const {default: QueryManager} = goog.module.get('os.query.QueryManager');
  const {default: BaseStateManager} = goog.module.get('os.state.BaseStateManager');
  const {default: StateManager} = goog.module.get('os.state.StateManager');
  const {default: Versions} = goog.module.get('os.state.Versions');
  const {default: ExclusionArea} = goog.module.get('os.state.v2.ExclusionArea');
  const osUiState = goog.module.get('os.ui.state');
  const xml = goog.module.get('os.xml');

  const {loadStateXsdFiles} = goog.module.get('os.test.xsd');

  var stateManager = null;

  beforeEach(function() {
    stateManager = StateManager.getInstance();
    stateManager.setVersion(Versions.V4);
  });

  it('Should validate against the v4 XSD state', function() {
    var resultSchemas = null;
    runs(function() {
      loadStateXsdFiles().then(function(result) {
        resultSchemas = result;
      }, function(err) {
        throw err;
      });
    });

    // waiting for the xsd files to load
    waitsFor(function() {
      return resultSchemas && osUiState && BaseStateManager;
    }, 'Wait for XSD(s) to load', 2 * jasmine.DEFAULT_TIMEOUT_INTERVAL);

    // Runs the tests.
    runs(function() {
      var area = new Feature();
      var box = new Polygon([[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]);
      area.setId('TestAreaId');
      area.setGeometry(box);
      var state = new ExclusionArea();
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
      spyOn(QueryManager.getInstance(), 'getActiveEntries').andReturn(activeQieries);
      spyOn(AreaManager.getInstance(), 'get').andReturn(area);

      // Setting up independent root for testing.
      var xmlRootDocument = stateManager.createStateObject(function() {}, 'test state', 'desc');
      var stateOptions = stateManager.createStateOptions(function() {}, 'test state', 'desc');
      stateOptions.doc = xmlRootDocument;
      var rootObj = state.createRoot(stateOptions);
      xmlRootDocument.firstElementChild.appendChild(rootObj);

      state.saveInternal(stateOptions, rootObj);

      var seralizedDoc = xml.serialize(stateOptions.doc);
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
