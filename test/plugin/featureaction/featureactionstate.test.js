goog.require('os.source.MockSource');
goog.require('os.state.StateManager');
goog.require('os.state.v4.FilterAction');
goog.require('os.test.xsd');
goog.require('os.xml');
goog.require('plugin.im.action.feature.Entry');
goog.require('plugin.im.action.feature.Manager');
goog.require('plugin.im.action.feature.StyleAction');


describe('os.state.v4.FilterAction', function() {
  var stateManager;

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

      var mockSource = new os.source.MockSource();
      mockSource.setId(entryType);

      var dataManager = os.data.DataManager.getInstance();
      spyOn(dataManager, 'getSources').andCallFake(function() {
        return [mockSource];
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

      var entry = new plugin.im.action.feature.Entry();
      entry.setId('testId');
      entry.setEnabled(true);
      entry.setTitle('Test Entry');
      entry.setType(entryType);
      entry.setFilter(filterXml);
      entry.actions = [new plugin.im.action.feature.StyleAction()];

      var iam = plugin.im.action.feature.Manager.getInstance();
      iam.addActionEntry(entry);

      var state = new os.state.v4.FilterAction();

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
