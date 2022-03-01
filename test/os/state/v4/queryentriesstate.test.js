goog.require('goog.dom');
goog.require('goog.dom.xml');
goog.require('goog.string');
goog.require('os.query.BaseAreaManager');
goog.require('os.query.QueryManager');
goog.require('os.state.BaseStateManager');
goog.require('os.state.StateManager');
goog.require('os.state.Versions');
goog.require('os.state.XMLStateManager');
goog.require('os.state.XMLStateOptions');
goog.require('os.state.v2.QueryEntries');
goog.require('os.test.xsd');
goog.require('os.ui.state');
goog.require('os.xml');



describe('QueryArea XSD State Test', function() {
  const {default: QueryManager} = goog.module.get('os.query.QueryManager');
  const {default: BaseStateManager} = goog.module.get('os.state.BaseStateManager');
  const {default: StateManager} = goog.module.get('os.state.StateManager');
  const {default: Versions} = goog.module.get('os.state.Versions');
  const {default: QueryEntries} = goog.module.get('os.state.v2.QueryEntries');
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
    }, 'Wait for XSD(s) to laod', 2 * jasmine.DEFAULT_TIMEOUT_INTERVAL);

    // Runs the tests.
    runs(function() {
      var state = new QueryEntries();
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

      // Mock required behavor for query manager
      spyOn(QueryManager.getInstance(), 'getActiveEntries').andReturn(activeQieries);

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

      var queryEntriesNode = xmlRootDocument.firstElementChild.querySelector('queryEntries');
      // actually loading this state is problmatic,  so just doing basic validation of the document.
      expect(queryEntriesNode).toBeDefined();
      expect(queryEntriesNode.childNodes.length).toBe(1); // only one entry was added
      expect(queryEntriesNode.firstChild.nodeName).toBe('queryEntry');
      // validate attribues
      var queryEntryNode = queryEntriesNode.firstChild;
      expect(queryEntryNode.attributes.getNamedItem('areaId').nodeValue).toBe(activeQieries[0]['areaId']);
      expect(queryEntryNode.attributes.getNamedItem('layerId').nodeValue).toBe(activeQieries[0]['layerId']);
      expect(queryEntryNode.attributes.getNamedItem('filterGroup').nodeValue).toBe('true');
      expect(queryEntryNode.attributes.getNamedItem('includeArea').nodeValue).toBe('true');
      expect(queryEntryNode.attributes.getNamedItem('temp').nodeValue).toBe('true');
    });
  });
});
