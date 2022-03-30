goog.require('goog.net.EventType');
goog.require('os.events.EventType');
goog.require('os.feature');
goog.require('os.im.Importer');
goog.require('os.mixin');
goog.require('os.mock');
goog.require('os.net.Request');
goog.require('os.structs.TriState');
goog.require('os.time.TimeInstant');
goog.require('os.ui.file.method.UrlMethod');
goog.require('plugin.file.kml.KMLParser');
goog.require('plugin.file.kml.ui.KMLNode');

import Point from 'ol/src/geom/Point.js';

describe('plugin.file.kml.KMLParser', function() {
  const googNetEventType = goog.module.get('goog.net.EventType');
  const {default: EventType} = goog.module.get('os.events.EventType');
  const osFeature = goog.module.get('os.feature');
  const {default: Importer} = goog.module.get('os.im.Importer');
  const {default: Request} = goog.module.get('os.net.Request');
  const {default: TriState} = goog.module.get('os.structs.TriState');
  const {default: TimeInstant} = goog.module.get('os.time.TimeInstant');
  const {default: UrlMethod} = goog.module.get('os.ui.file.method.UrlMethod');
  const {default: KMLParser} = goog.module.get('plugin.file.kml.KMLParser');
  const {default: KMLNode} = goog.module.get('plugin.file.kml.ui.KMLNode');
  var testUrl = '/base/test/plugin/file/kml/kml_test.xml';
  var parser = new KMLParser();
  var kmlSource;
  var rootNode;
  var testFolder;

  var finishParsing = function() {
    while (parser && parser.hasNext()) {
      parser.parseNext();
    }
  };

  it('initializes the parser', function() {
    var urlMethod = new UrlMethod();
    urlMethod.setUrl(testUrl);

    var methodComplete = false;
    var onComplete = function(event) {
      methodComplete = true;
    };

    urlMethod.listenOnce(EventType.COMPLETE, onComplete);
    urlMethod.loadFile();

    waitsFor(function() {
      return methodComplete == true;
    }, 'url to load');

    runs(function() {
      kmlSource = urlMethod.getFile().getContent();
      parser.setSource(kmlSource);

      expect(parser.document_).not.toBeNull();
      expect(parser.rootNode_).toBeNull();
      expect(parser.hasNext()).toBe(true);
      expect(parser.stack_.length).toBe(1);

      var stackObj = parser.stack_[0];
      expect(stackObj.index).toBe(0);
      expect(stackObj.node).toBeNull();
      expect(stackObj.children).not.toBeNull();
      expect(stackObj.children.length).toBe(1);
      expect(stackObj.children[0].localName).toBe('kml');
    });
  });

  it('parses kml file content', function() {
    finishParsing();
    expect(parser.stack_.length).toBe(0);

    // test document/folder parsing
    // make sure we can parse multiple root documents
    rootNode = parser.getRootNode();
    var docRoot = rootNode.getChildren()[0];
    var docRoot2 = rootNode.getChildren()[1];

    // check that we read in the first doc node correctly
    expect(docRoot instanceof KMLNode).toBe(true);
    expect(docRoot.collapsed).toBe(false);
    expect(docRoot.getLabel()).toBe('KML Test');
    expect(docRoot.getState()).toBe(TriState.BOTH);

    // check that we read in the second doc node correctly
    expect(docRoot2 instanceof KMLNode).toBe(true);
    expect(docRoot2.collapsed).toBe(false);
    expect(docRoot2.getLabel()).toBe('KML Test 2');
    expect(docRoot2.getState()).toBe(TriState.ON);

    var rootChildren = docRoot.getChildren();
    expect(rootChildren).not.toBeNull();
    expect(rootChildren.length).toBe(4);

    // save this reference for the merge test
    testFolder = rootChildren[0];
    expect(testFolder.getLabel()).toBe('Basic Folder');
    expect(testFolder.collapsed).toBe(true);
    expect(testFolder.getState()).toBe(TriState.ON);

    var children = testFolder.getChildren();
    expect(children).not.toBeNull();
    expect(children.length).toBe(1);

    // make sure we can get features from the folder level
    var folderFeatures = testFolder.getFeatures();
    expect(folderFeatures).not.toBeNull();
    expect(folderFeatures.length).toBe(1);

    // test placemark parsing
    var featureNode = children[0];
    var feature = featureNode.getFeature();
    expect(feature).not.toBeNull();
    expect(feature).toBe(folderFeatures[0]);
    expect(feature.get('name')).toBe('basic-feature');
    expect(feature.get('testKey1')).toBe('testVal1');
    expect(feature.get('testKey2')).toBe('testVal2');

    var geom = feature.getGeometry();
    expect(geom instanceof Point).toBe(true);

    var coord = geom.getFirstCoordinate();
    expect(coord[0]).toBe(12.345);
    expect(coord[1]).toBe(67.891);

    var time = feature.get('recordTime');
    expect(time instanceof TimeInstant).toBe(true);
    expect(time.toISOString()).toBe('2010-02-01T18:03:30Z');

    // test folder open/closed
    var openFolder = rootChildren[1];
    expect(openFolder.getLabel()).toBe('Open Test');
    expect(openFolder.collapsed).toBe(true);
    expect(openFolder.getFeatures().length).toBe(3);

    var openChildren = openFolder.getChildren();
    expect(openChildren).not.toBeNull();
    expect(openChildren.length).toBe(3);
    expect(openChildren[0].getLabel()).toBe('Default');
    expect(openChildren[0].collapsed).toBe(true);
    expect(openChildren[1].getLabel()).toBe('Open');
    expect(openChildren[1].collapsed).toBe(false);
    expect(openChildren[2].getLabel()).toBe('Closed');
    expect(openChildren[2].collapsed).toBe(true);

    // test node state (visibility)
    var visFolder = rootChildren[2];
    expect(visFolder.getLabel()).toBe('Visibility Test');
    expect(visFolder.getState()).toBe(TriState.BOTH);

    var visChildren = visFolder.getChildren();
    expect(visChildren).not.toBeNull();
    expect(visChildren.length).toBe(3);

    // mixed visibility children
    expect(visChildren[0].getLabel()).toBe('Default Folder');
    expect(visChildren[0].getState()).toBe(TriState.BOTH);

    // all children off
    expect(visChildren[1].getLabel()).toBe('Visible Folder/Hidden Placemark');
    expect(visChildren[1].getState()).toBe(TriState.OFF);

    // all children on
    expect(visChildren[2].getLabel()).toBe('Hidden Folder/Visible Placemark');
    expect(visChildren[2].getState()).toBe(TriState.ON);
  });

  it('cleans up the parser', function() {
    parser.cleanup();

    expect(parser.document_).toBe(null);
    expect(parser.rootNode_).toBe(null);
  });

  it('merges same source into an existing KML tree', function() {
    // mess with the test folder state to make sure the parser doesn't change it
    testFolder.setState(TriState.OFF);
    testFolder.collapsed = false;

    // setting the source will clean up the parser, so do this first
    parser.setSource(kmlSource);

    // keep a reference to make sure it doesn't change
    var oldRoot = rootNode;
    parser.setRootNode(rootNode);

    // should be ready to parse, with the root node already set to the existing tree
    expect(parser.document_).not.toBeNull();
    expect(parser.rootNode_).toBe(rootNode);
    expect(parser.hasNext()).toBe(true);
    expect(parser.stack_.length).toBe(1);

    finishParsing();
    expect(parser.stack_.length).toBe(0);

    // the root node should be reused
    rootNode = parser.getRootNode();
    expect(rootNode).toBe(oldRoot);

    // and the children should be the same
    // these are the root document nodes
    var children = rootNode.getChildren();
    // get the children of the first document
    var docChildren = children[0].getChildren();
    expect(docChildren).not.toBeNull();
    expect(docChildren.length).toBe(4);
    // check that the test folder is in the same place it was before
    expect(docChildren[0]).toBe(testFolder);

    // check the folder state we changed
    expect(testFolder.collapsed).toBe(false);
    expect(testFolder.getState()).toBe(TriState.OFF);
  });

  var openFileAndRun = function(file, featuresFunc) {
    var urlMethod = new UrlMethod();
    urlMethod.setUrl(testUrl.replace('kml_test.xml', file));

    var methodComplete = false;
    var onComplete = function(event) {
      methodComplete = true;
    };

    urlMethod.listenOnce(EventType.COMPLETE, onComplete);
    urlMethod.loadFile();

    waitsFor(function() {
      return methodComplete;
    }, 'url to load');

    runs(function() {
      kmlSource = urlMethod.getFile().getContent();
      parser.setSource(kmlSource);
      var node = parser.parseNext();
      while (parser.hasNext()) {
        parser.parseNext();
      }

      featuresFunc(node.getFeatures(true));
    });
  };

  it('should support schema tags', function() {
    openFileAndRun('schema_test.xml', function(features) {
      expect(features.length).toBe(2);
      expect(features[0].getGeometry()).toBeTruthy();
      expect(features[0].values_.boolean).toBe(true);
      expect(features[0].values_.number).toBe(123.456);
      expect(features[0].values_.string).toBe('it works');
      expect(features[0].values_.whatever).toBe('default should be string');

      expect(features[1].getGeometry()).toBeTruthy();
      expect(features[1].values_.boolean).toBe(false);
      expect(features[1].values_.fancyField).toBe(12);
    });
  });

  it('should support merged default, container, styleUrl, and placemark styles', function() {
    openFileAndRun('style_merge.xml', function(features) {
      expect(features.length).toBe(7);

      var iconDiamond = 'http://maps.google.com/mapfiles/kml/shapes/open-diamond.png';
      var iconBus = 'http://maps.google.com/mapfiles/kml/shapes/bus.png';
      var iconDonut = 'http://maps.google.com/mapfiles/kml/shapes/donut.png';

      var green = 'rgba(0,255,0,1)';
      var red = 'rgba(255,0,0,1)';
      var blue = 'rgba(0,0,255,1)';
      var pink = 'rgba(255,0,255,1)';

      expect(features[0].values_._style.image.src).toBe(iconDiamond);
      expect(features[0].values_._style.image.color).toBe(green);
      expect(features[0].values_._style.image.rotation).toBe(0);

      expect(features[1].values_._style.image.src).toBe(iconDiamond);
      expect(features[1].values_._style.image.color).toBe(blue);
      expect(features[1].values_._style.image.rotation).toBe(0);

      expect(features[2].values_._style.image.src).toBe(iconBus);
      expect(features[2].values_._style.image.color).toBe(pink);
      expect(features[2].values_._style.image.scale).toBe(2);
      expect(features[2].values_._style.image.rotation).toBe(0);

      expect(features[3].values_._style.stroke.color).toBe(red);
      expect(features[3].values_._style.stroke.width).toBe(1);

      expect(features[4].values_._style.image.src).toBe(iconDiamond);
      expect(features[4].values_._style.image.color).toBe(red);
      expect(features[4].values_._style.image.rotation).toBe(0);

      expect(features[5].values_._style.image.src).toBe(iconDonut);
      expect(features[5].values_._style.image.color).toBe(red);
      expect(features[5].values_._style.image.rotation).toBe(0);

      expect(features[6].values_._style.image.src).toBe(iconBus);
      expect(features[6].values_._style.image.color).toBe(red);
      expect(features[6].values_._style.image.scale).toBe(0.5);
      expect(features[6].values_._style.image.rotation).toBe(0);
    });
  });

  it('should support schema without name', function() {
    openFileAndRun('schema_noname_test.xml', function(feat) {
      expect(feat.length).toBe(1);
    });
  });

  it('should have a regexp that only matches the right elements', function() {
    var regexp = parser.getKmlThingRegex();
    expect(regexp.test('Placemark')).toBe(true);
    expect(regexp.test('MyPlacemark')).toBe(false);
    expect(regexp.test('NetworkLink')).toBe(true);
    expect(regexp.test('GroundOverlay')).toBe(true);
    expect(regexp.test('ScreenOverlay')).toBe(true);
    expect(regexp.test('Tour')).toBe(true);
    expect(regexp.test('tour')).toBe(false);
    expect(regexp.test('GroundOverlay3')).toBe(false);
  });

  it('should work with an importer and handle invalid polygons', function() {
    var r = new Request(testUrl);
    var i = new Importer(new KMLParser());
    var count = 0;
    var listener = function(e) {
      count++;
    };

    r.listen(googNetEventType.SUCCESS, listener);
    i.listen(EventType.COMPLETE, listener);

    runs(function() {
      r.load();
    });

    waitsFor(function() {
      return count == 1;
    }, 'request to finish loading');

    runs(function() {
      i.startImport(r.getResponse());
      r.clearResponse();
    });

    waitsFor(function() {
      return count == 2;
    }, 'importer to finish');

    runs(function() {
      var data = i.getData();
      expect(data.length).toBe(26);

      // invalid polygon should be set to undefined for a single polygon
      var feature = data[24].getFeature();
      osFeature.validateGeometries(feature);
      expect(feature.getGeometry()).toBeUndefined();

      // invalid polygon in a geometry collection should be removed
      var feature2 = data[25].getFeature();
      osFeature.validateGeometries(feature2);
      var geom = feature2.getGeometry();
      expect(geom.getGeometries().length).toBe(1);
    });
  });

  it('should add parsed assets to the assetMap', function() {
    // start fresh
    parser.cleanup();
    parser.clearAssets();

    parser.processZipAsset_('images/fake-image.png', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8');
    parser.processZipAsset_('models/fake-collada.png', 'fakecolladacontent');


    expect(parser.assetMap_['models/fake-collada.png']).toBe('fakecolladacontent');
  });

  it('should error when asked to parse an improper asset', function() {
    // start fresh
    parser.cleanup();
    parser.clearAssets();

    const fn = () => {};
    spyOn(parser, 'onError').andCallFake(fn);

    parser.processZipAsset_('models/fake-collada.png', null);
    parser.processZipAsset_('models/fake-collada2.png', {});

    expect(parser.onError.calls.length).toBe(2);
  });
});
