goog.require('goog.dom');
goog.require('goog.dom.xml');
goog.require('goog.string');
goog.require('os.filter.FilterEntry');
goog.require('os.state.XMLStateOptions');
goog.require('os.state.v2.Filter'); // v2 state implemention works with v4
goog.require('os.test.xsd');
goog.require('os.ui.filter.ui.GroupNode');
goog.require('os.ui.state.XMLStateManager');
goog.require('os.xml');



describe('Filter XSD State Test', function() {
  var stateManager = null;

  var mockSource = function() {};
  mockSource.prototype.getId = function() {
    return 'fake-id';
  };

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
      // Setup up testing filters
      // NOTE: There appears to be a few subtle differences between the javascrpt
      // xmllint implementation and the command line version that will casuse
      // some "valid" filter patterns to be reported as invalid. Most notable
      // nested And/Or nodes, or And/Or nodes with just one filter component. Due
      // to this, I did not include any tests for those.

      var simpleFilter = new os.filter.FilterEntry();
      simpleFilter.setId('ftlr-2');
      simpleFilter.setTitle('Prop Equal Test');
      simpleFilter.setType('default#SOMELAYER#features');
      simpleFilter.setFilter('<PropertyIsEqualTo>' +
              '<PropertyName>KEY</PropertyName>' +
              '<Literal>A</Literal>' +
          '</PropertyIsEqualTo>');

      var andFilter = new os.filter.FilterEntry();
      andFilter.setId('ftlr-1');
      andFilter.setTitle('Semi-Major > 0.2');
      andFilter.setType('default#SOME_LAYER_A#features');
      andFilter.setFilter('<And namehint="My And Filter" description="ss"><PropertyIsEqualTo>' +
          '<PropertyName>AXIS_ORIENT_UNITS</PropertyName><Literal><![CDATA[DEGREES]]></Literal>' +
          '</PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>COMMS_EXTERNAL_MODULAT</PropertyName>' +
          '<Literal><![CDATA[FM]]></Literal></PropertyIsEqualTo></And>');

      var orFilter = new os.filter.FilterEntry();

      orFilter.setId('fltr-3');
      orFilter.setTitle('Just another filter');
      orFilter.setType('default#SOME_LAYER_A#features');
      orFilter.setFilter('<Or namehint="My or Filter"><PropertyIsEqualTo><PropertyName>ENTITY_ACTVY</PropertyName>' +
          '<Literal><![CDATA[COMMS]]></Literal></PropertyIsEqualTo><PropertyIsEqualTo>' +
          '<PropertyName>CORREL_INDX</PropertyName><Literal><![CDATA[J9]]></Literal></PropertyIsEqualTo></Or>');

      var filters = [simpleFilter, andFilter, orFilter];

      var source = new mockSource();
      var dataManager = os.dataManager;

      spyOn(dataManager, 'getSources').andCallFake(function() {
        return [source];
      });

      spyOn(os.ui.filterManager, 'hasEnabledFilters').andCallFake(function() {
        return true;
      });

      spyOn(os.ui.filterManager, 'isEnabled').andCallFake(function() {
        return true;
      });

      spyOn(os.ui.filterManager, 'getFilters').andCallFake(function() {
        return filters;
      });

      var state = new os.state.v2.Filter();
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
    });
  });
});
