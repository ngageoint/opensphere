goog.require('os.data.DataManager');
goog.require('os.query.FilterManager');
goog.require('os.source');
goog.require('os.source.MockSource');
goog.require('os.state.StateManager');
goog.require('os.state.Versions');
goog.require('os.state.v4.FilterAction');
goog.require('os.test.xsd');
goog.require('os.xml');
goog.require('plugin.im.action.feature.Entry');
goog.require('plugin.im.action.feature.Manager');
goog.require('plugin.im.action.feature.StyleAction');


describe('os.state.v4.FilterAction', function() {
  const DataManager = goog.module.get('os.data.DataManager');
  const FilterManager = goog.module.get('os.query.FilterManager');
  const source = goog.module.get('os.source');
  const StateManager = goog.module.get('os.state.StateManager');
  const Versions = goog.module.get('os.state.Versions');
  const FilterAction = goog.module.get('os.state.v4.FilterAction');
  const xsd = goog.module.get('os.test.xsd');
  const xml = goog.module.get('os.xml');
  const {default: Entry} = goog.module.get('plugin.im.action.feature.Entry');
  const {default: StyleAction} = goog.module.get('plugin.im.action.feature.StyleAction');
  const {default: FeatureActionManager} = goog.module.get('plugin.im.action.feature.Manager');

  var stateManager;

  beforeEach(function() {
    stateManager = StateManager.getInstance();
    stateManager.setVersion(Versions.V4);
  });

  xit('Should validate against the v4 XSD state', function() {
    var resultSchemas = null;
    runs(function() {
      xsd.loadStateXsdFiles().then(function(result) {
        resultSchemas = result;
      }, function(err) {
        throw err;
      });
    });

    // wait for the xsd files to load
    waitsFor(function() {
      return !!resultSchemas;
    }, 'Wait for XSD(s) to load', 2 * jasmine.DEFAULT_TIMEOUT_INTERVAL);

    // run the tests
    runs(function() {
      var entryType = 'default#LAYER#features';
      var filterXml = '<Or xmlns="http://www.opengis.net/ogc">' +
          '<PropertyIsLike escape="\\" singleChar="." wildCard="*">' +
          '<PropertyName>PROPERTY</PropertyName>' +
          '<Literal>AAA*</Literal>' +
          '</PropertyIsLike>' +
          '<PropertyIsLike escape="\\" singleChar="." wildCard="*">' +
          '<PropertyName>PROPERTY</PropertyName>' +
          '<Literal>BBB*</Literal>' +
          '</PropertyIsLike>' +
          '</Or>';

      var mockSource = new source.MockSource();
      mockSource.setId(entryType);

      var dataManager = DataManager.getInstance();
      spyOn(dataManager, 'getSources').andCallFake(function() {
        return [mockSource];
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

      var entry = new Entry();
      entry.setId('testId');
      entry.setEnabled(true);
      entry.setTitle('Test Entry');
      entry.setType(entryType);
      entry.setFilter(filterXml);
      entry.actions = [new StyleAction()];

      var iam = FeatureActionManager.getInstance();
      iam.addActionEntry(entry);

      var state = new FilterAction();

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
