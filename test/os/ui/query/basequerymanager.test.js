goog.require('goog.events.EventType');
goog.require('os.query');
goog.require('os.query.AreaManager');
goog.require('os.query.BaseAreaManager');
goog.require('os.query.BaseQueryManager');
goog.require('os.query.QueryManager');
goog.require('os.ui.query.MockHandler');

import Feature from 'ol/src/Feature.js';
import GeometryLayout from 'ol/src/geom/GeometryLayout.js';
import Polygon from 'ol/src/geom/Polygon.js';

describe('os.query.BaseQueryManager', function() {
  const GoogEventType = goog.module.get('goog.events.EventType');
  const osQuery = goog.module.get('os.query');
  const {default: AreaManager} = goog.module.get('os.query.AreaManager');
  const {default: BaseAreaManager} = goog.module.get('os.query.BaseAreaManager');
  const {default: BaseQueryManager} = goog.module.get('os.query.BaseQueryManager');
  const {default: QueryManager} = goog.module.get('os.query.QueryManager');
  const {MockHandler} = goog.module.get('os.ui.query.MockHandler');

  var am;
  var qm;
  var testPolygon;
  var handlersCleared = false;
  beforeEach(function() {
    testPolygon = new Polygon([[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]], GeometryLayout.XY);

    am = AreaManager.getInstance();
    qm = QueryManager.getInstance();
    if (!handlersCleared) {
      qm.setHandlers([]);
      handlersCleared = true;
    }

    spyOn(QueryManager.getInstance(), 'save');
    spyOn(QueryManager.getInstance(), 'load');
    spyOn(AreaManager.getInstance(), 'save');
    spyOn(AreaManager.getInstance(), 'load');
    spyOn(AreaManager.getInstance(), 'updateStyles_');
  });

  var testTemplate = function(addFunc, expected, opt_debug) {
    qm.removeEntries();

    var count = 0;
    var listener = function() {
      count++;
    };

    qm.listen(GoogEventType.PROPERTYCHANGE, listener);

    runs(addFunc);

    waitsFor(function() {
      return count > 0;
    }, 'update to run');


    runs(function() {
      qm.unlisten(GoogEventType.PROPERTYCHANGE, listener);
      var entries = qm.getEntries(null, null, null, true);

      entries.sort(BaseQueryManager.sortEntries);

      for (var i = 0, n = entries.length; i < n; i++) {
        var key = BaseQueryManager.getKey_(entries[i]);

        if (opt_debug) {
          console.log(key);
        } else {
          expect(expected).toContain(key);
        }
      }

      if (!opt_debug) {
        expect(entries.length).toBe(expected.length);
      }
    });
  };



  it('should start from scratch', function() {
    // start from scratch
    qm.removeEntries();
    expect(qm.entries.length).toBe(0);
  });

  it('should add entries', function() {
    qm.addEntry('a', 'aa', 'aaa');
    qm.addEntry('b', 'bb', 'bbb');
    qm.addEntry('c', 'cc', 'ccc');

    expect(qm.entries.length).toBe(3);
  });

  it('should not add entries that already exist', function() {
    qm.addEntry('a', 'aa', 'aaa');
    expect(qm.entries.length).toBe(3);
  });

  it('should retrieve entries', function() {
    qm.addEntry('a', 'bb', 'bbb');
    qm.addEntry('a', 'bb', 'ccc');
    qm.addEntry('b', 'aa', 'aaa');

    var entries = qm.getEntries();
    expect(entries.length).toBe(6);

    entries = qm.getEntries('a');
    expect(entries.length).toBe(3);

    entries = qm.getEntries('a', 'bb');
    expect(entries.length).toBe(2);

    entries = qm.getEntries('a', null, 'aaa');
    expect(entries.length).toBe(1);

    entries = qm.getEntries(null, null, 'aaa');
    expect(entries.length).toBe(2);

    entries = qm.getEntries(null, 'aa');
    expect(entries.length).toBe(2);
  });

  it('should remove entries', function() {
    qm.removeEntries('a');
    expect(qm.entries.length).toBe(3);
  });

  it('should properly expand simple wildcard entries with regular entries', function() {
    testTemplate(function() {
      var handlerA = new MockHandler('A');
      qm.registerHandler(handlerA);

      // add a non-wildcard filter to check mixing
      qm.addEntry('X', 'Area51', 'Crazy Filter', true, false);

      // one box is on for the layer
      qm.addEntry('A', 'box', '*');

      // one circle exclusion is on for the layer
      qm.addEntry('A', 'circle', '*', false);

      // OR of F1 and F2 for the layer
      qm.addEntry('A', '*', 'F1', true, false);
      qm.addEntry('A', '*', 'F2', true, false);
    }, [
      'A|box|F1|true|false',
      'A|box|F2|true|false',
      'A|circle|F1|false|false',
      'A|circle|F2|false|false',
      'X|Area51|Crazy Filter|true|false'
    ]);
  });

  it('should properly expand wildcard entries with regular entries', function() {
    testTemplate(function() {
      var handlerA = new MockHandler('A');
      var handlerB = new MockHandler('B');
      var handlerC = new MockHandler('C');

      qm.registerHandler(handlerA);
      qm.registerHandler(handlerB);
      qm.registerHandler(handlerC);

      // add a non-wildcard filter to check mixing
      qm.addEntry('X', 'Area51', 'Crazy Filter', true, false);

      // box is on for everything
      qm.addEntry('*', 'box', '*');

      // poly is only on with F1
      // NOTE that this DOES NOT indicate that poly/F1 should be on for every layer.
      // It indicates that poly should be on for every layer that is also attached to F1.

      // circle is an exclusion which is on for everything
      qm.addEntry('*', 'circle', '*', false);

      // poly is on for everything
      qm.addEntry('*', 'poly', '*');

      // boxA is only on for layer A
      qm.addEntry('A', 'boxA', '*');

      // filter F1 for everything (OR group)
      qm.addEntry('A', '*', 'F1', true, false);
      qm.addEntry('B', '*', 'F1', true, false);

      // filter F2 for layer A (AND group)
      qm.addEntry('A', '*', 'F2');

      // filter F3 for layer B (OR group)
      qm.addEntry('B', '*', 'F3', true, false);


      // UNSUPPORTED CASES
      // The following cases are not found in opensphere
      //
      // 1. Area enabled for a specific filter for all layers
      // qm.addEntry('*', 'poly', 'F1');
      //
      // 2. Filter enabled for all layers and all areas
      // qm.addEntry('*', '*', 'F1');
    }, [
      'A|box|F1|true|false',
      'A|box|F2|true|true',
      'A|boxA|F1|true|false',
      'A|boxA|F2|true|true',
      'A|circle|F1|false|false',
      'A|circle|F2|false|true',
      'A|poly|F1|true|false',
      'A|poly|F2|true|true',
      'B|box|F1|true|false',
      'B|box|F3|true|false',
      'B|circle|F1|false|false',
      'B|circle|F3|false|false',
      'B|poly|F1|true|false',
      'B|poly|F3|true|false',
      'C|box|*|true|true',
      'C|circle|*|false|true',
      'C|poly|*|true|true',
      'X|Area51|Crazy Filter|true|false'
    ]);
  });

  it('should properly handle negation cases for double wildcard areas', function() {
    testTemplate(function() {
      // add a double wildcard entry
      qm.addEntry('*', 'box', '*');

      qm.addEntry('A', '*', 'F1');
      qm.addEntry('B', '*', 'F2');

      // add a negation entry for A
      qm.addEntries([{
        'layerId': 'A',
        'areaId': 'box',
        'filterId': '*',
        'includeArea': true,
        'filterGroup': true,
        'negate': true
      }]);
    }, [
      // this entry might seem incorrect, but not all layers require spatial filters to run
      'A|*|F1|true|true',
      'B|box|F2|true|true',
      'C|box|*|true|true'
    ]);
  });

  it('should properly expand wildcards when filters exist without areas', function() {
    testTemplate(function() {
      // add a non-wildcard filter to check mixing
      qm.addEntry('X', 'Area51', 'Crazy Filter', true, false);

      // Layer A has filters but no areas
      qm.addEntry('A', '*', 'F1', true, false);
      qm.addEntry('A', '*', 'F2');
    }, [
      'A|*|F1|true|false',
      'A|*|F2|true|true',
      'X|Area51|Crazy Filter|true|false'
    ]);
  });

  it('should return whether active explicit entries exist', function() {
    // While we have an explicit entry, there is no handler that matches the layer ID
    expect(qm.hasActiveExplicitEntries()).toBe(false);
    var handlerX = new MockHandler('X');
    qm.registerHandler(handlerX);
    expect(qm.hasActiveExplicitEntries()).toBe(true);
    qm.removeEntries('X');
    expect(qm.hasActiveExplicitEntries()).toBe(false);
    qm.unregisterHandler(handlerX);
    expect(qm.hasActiveExplicitEntries()).toBe(false);
  });

  it('should report area states', function() {
    var am = BaseAreaManager.getInstance();
    // don't do map stuff
    am.mapReady_ = false;
    qm.removeEntries();

    var verifyStates = function(actual, expected) {
      expect(actual[osQuery.AreaState.NONE]).toBe(expected[osQuery.AreaState.NONE] || undefined);
      expect(actual[osQuery.AreaState.EXCLUSION]).toBe(expected[osQuery.AreaState.EXCLUSION] || undefined);
      expect(actual[osQuery.AreaState.INCLUSION]).toBe(expected[osQuery.AreaState.INCLUSION] || undefined);
      expect(actual[osQuery.AreaState.BOTH]).toBe(expected[osQuery.AreaState.BOTH] || undefined);
    };

    var result = qm.hasArea('bogus');
    expect(result).toBe(osQuery.AreaState.NONE);

    verifyStates(qm.getAreaStates(), [0, 0, 0, 0]);

    qm.addEntry('*', 'box', '*', true);
    // since it isn't in the area manager, we still expect 0
    result = qm.hasArea('box');
    expect(result).toBe(osQuery.AreaState.NONE);
    verifyStates(qm.getAreaStates(), [0, 0, 0, 0]);

    // now put it in the area manager
    var area = new Feature();
    area.setId('box');
    area.set('title', 'Box');
    area.setGeometry(testPolygon);

    am.add(area);

    // The area is in the area manager but it isn't shown
    result = qm.hasArea('box');
    expect(result).toBe(osQuery.AreaState.NONE);
    verifyStates(qm.getAreaStates(), [1, 0, 0, 0]);

    // now it is shown
    area.set('shown', true);
    result = qm.hasArea('box');
    expect(result).toBe(osQuery.AreaState.INCLUSION);
    verifyStates(qm.getAreaStates(), [0, 0, 1, 0]);

    // make another entry that uses box for exclude
    qm.addEntry('A', 'box', '*', false);

    result = qm.hasArea('box');
    expect(result).toBe(osQuery.AreaState.BOTH);
    verifyStates(qm.getAreaStates(), [0, 0, 0, 1]);

    qm.removeEntries('*', 'box');

    result = qm.hasArea('box');
    expect(result).toBe(osQuery.AreaState.EXCLUSION);
    verifyStates(qm.getAreaStates(), [0, 1, 0, 0]);

    qm.removeEntries();

    try {
      am.remove(area);
    } catch (e) {
      // this probably requires map crap
    }
  });

  it('should return whether an inclusion exists', function() {
    qm.removeEntries();

    qm.addEntry('*', 'box', '*');
    qm.addEntry('A', 'circle', '*');

    // because the area doesn't exist in the area manager
    expect(qm.hasInclusion('*')).toBe(false);
    expect(qm.hasInclusion('A')).toBe(false);

    var box = new Feature();
    box.setId('box');
    box.set('title', 'box');
    box.setGeometry(testPolygon);
    am.add(box);

    var circle = new Feature();
    circle.setId('circle');
    circle.set('title', 'circle');
    circle.setGeometry(testPolygon);
    am.add(circle);

    // because the area isn't toggled on (shown)
    expect(qm.hasInclusion('*')).toBe(false);
    expect(qm.hasInclusion('A')).toBe(false);

    box.set('shown', true);
    circle.set('shown', true);

    expect(qm.hasInclusion('*')).toBe(true);
    expect(qm.hasInclusion('A')).toBe(true);

    qm.removeEntries();
    try {
      am.remove(box);
      am.remove(circle);
    } catch (e) {}
  });

  it('should properly handle areas that are * included and specifically excluded', function() {
    testTemplate(function() {
      qm.addEntry('*', 'box', '*');
      qm.addEntry('A', 'box', '*', false);
    }, [
      'A|box|*|false|true',
      'B|box|*|true|true',
      'C|box|*|true|true'
    ]);
  });

  it('should properly handle areas that are * excluded and specifically included', function() {
    testTemplate(function() {
      qm.addEntry('*', 'box', '*', false);
      qm.addEntry('A', 'box', '*');
    }, [
      'A|box|*|true|true',
      'B|box|*|false|true',
      'C|box|*|false|true'
    ]);
  });

  it('should create a layer set from the registered handlers', function() {
    var set = qm.getLayerSet();

    expect(set['A']).toBe('A');
    expect(set['B']).toBe('B');
    expect(set['C']).toBe('C');
    expect(set['X']).toBe(undefined);
  });

  it('should return the And/Or state of an entry', function() {
    qm.removeEntries();
    qm.addEntry('layer1', 'area1', 'filter1', true, true);
    qm.addEntry('layer2', 'area1', 'filter1', true, false);

    qm.addEntry('layer2', 'area2', 'filter2', true, false);

    // filter 1 is ambiguous (i.e. And for layer1, Or for layer2) so it should return the first one
    // if no layer is specified
    expect(qm.isAnd('filter1')).toBe(true);
    expect(qm.isAnd('filter1', 'layer1')).toBe(true);
    expect(qm.isAnd('filter1', 'layer2')).toBe(false);

    expect(qm.isAnd('filter2')).toBe(false);
    expect(qm.isAnd('filter2', 'layer2')).toBe(false);
  });
});
