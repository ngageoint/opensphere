goog.require('goog.dom');
goog.require('goog.dom.xml');
goog.require('goog.string');
goog.require('os.data.DataManager');
goog.require('os.filter.FilterEntry');
goog.require('os.query.FilterManager');
goog.require('os.state.BaseStateManager');
goog.require('os.state.StateManager');
goog.require('os.state.Versions');
goog.require('os.state.XMLStateManager');
goog.require('os.state.XMLStateOptions');
goog.require('os.state.v2.Filter');
goog.require('os.test.xsd');
goog.require('os.ui.filter.ui.GroupNode');
goog.require('os.ui.state');
goog.require('os.xml');



describe('Filter XSD State Test', function() {
  const DataManager = goog.module.get('os.data.DataManager');
  const FilterEntry = goog.module.get('os.filter.FilterEntry');
  const FilterManager = goog.module.get('os.query.FilterManager');
  const BaseStateManager = goog.module.get('os.state.BaseStateManager');
  const StateManager = goog.module.get('os.state.StateManager');
  const Versions = goog.module.get('os.state.Versions');
  const Filter = goog.module.get('os.state.v2.Filter');
  const osUiState = goog.module.get('os.ui.state');
  const xml = goog.module.get('os.xml');

  const {loadStateXsdFiles} = goog.module.get('os.test.xsd');

  var stateManager = null;

  var mockSource = function() {};
  mockSource.prototype.getId = function() {
    return 'fake-id';
  };

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
      // Setup up testing filters
      // NOTE: There appears to be a few subtle differences between the javascrpt
      // xmllint implementation and the command line version that will casuse
      // some "valid" filter patterns to be reported as invalid. Mos1t notable
      // nested And/Or nodes, or And/Or nodes with just one filter component. Due
      // to this, I did not include any tests for thos1e.

      var simpleFilter = new FilterEntry();
      simpleFilter.setId('ftlr-2');
      simpleFilter.setTitle('Prop Equal Test');
      simpleFilter.setType('default#SOMELAYER#features');
      simpleFilter.setFilter('<PropertyIsEqualTo>' +
              '<PropertyName>KEY</PropertyName>' +
              '<Literal>A</Literal>' +
          '</PropertyIsEqualTo>');

      var andFilter = new FilterEntry();
      andFilter.setId('ftlr-1');
      andFilter.setTitle('Semi-Major > 0.2');
      andFilter.setType('default#SOME_LAYER_A#features');
      andFilter.setFilter('<And namehint="My And Filter" description="ss"><PropertyIsEqualTo>' +
          '<PropertyName>AXIS_ORIENT_UNITS</PropertyName><Literal><![CDATA[DEGREES]]></Literal>' +
          '</PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>COMMS_EXTERNAL_MODULAT</PropertyName>' +
          '<Literal><![CDATA[FM]]></Literal></PropertyIsEqualTo></And>');

      var orFilter = new FilterEntry();

      orFilter.setId('fltr-3');
      orFilter.setTitle('Just another filter');
      orFilter.setType('default#SOME_LAYER_A#features');
      orFilter.setFilter('<Or namehint="My or Filter"><PropertyIsEqualTo><PropertyName>ENTITY_ACTVY</PropertyName>' +
          '<Literal><![CDATA[COMMS]]></Literal></PropertyIsEqualTo><PropertyIsEqualTo>' +
          '<PropertyName>CORREL_INDX</PropertyName><Literal><![CDATA[J9]]></Literal></PropertyIsEqualTo></Or>');

      var filters = [simpleFilter, andFilter, orFilter];

      var source = new mockSource();
      var dataManager = DataManager.getInstance();

      spyOn(dataManager, 'getSources').andCallFake(function() {
        return [source];
      });

      spyOn(FilterManager.getInstance(), 'hasEnabledFilters').andCallFake(function() {
        return true;
      });

      spyOn(FilterManager.getInstance(), 'isEnabled').andCallFake(function() {
        return true;
      });

      spyOn(FilterManager.getInstance(), 'getFilters').andCallFake(function() {
        return filters;
      });

      var state = new Filter();
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
    });
  });
});
