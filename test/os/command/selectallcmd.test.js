goog.require('goog.events.EventType');
goog.require('os.command.SelectAll');
goog.require('os.command.State');
goog.require('os.data.DataManager');
goog.require('os.mock');
goog.require('os.source.PropertyChange');
goog.require('os.source.Vector');

import {listen, unlistenByKey} from 'ol/src/events.js';
import Feature from 'ol/src/Feature.js';
import Point from 'ol/src/geom/Point.js';

describe('os.command.SelectAll', function() {
  const GoogEventType = goog.module.get('goog.events.EventType');
  const {default: SelectAll} = goog.module.get('os.command.SelectAll');
  const {default: State} = goog.module.get('os.command.State');
  const {default: DataManager} = goog.module.get('os.data.DataManager');
  const {default: PropertyChange} = goog.module.get('os.source.PropertyChange');
  const {default: VectorSource} = goog.module.get('os.source.Vector');

  it('should fail when the source is not provided', function() {
    var cmd = new SelectAll(null);
    expect(cmd.execute()).toBe(false);
    expect(cmd.state).toBe(State.ERROR);
  });

  it('should select all the features on the source', function() {
    // features are not added to crossfilter until the add timer expires, so we have to wait for that
    // before continuing with tests
    var featuresAdded = false;
    var onChange = function(e) {
      if (e.getProperty() == PropertyChange.FEATURES) {
        featuresAdded = true;
      }
    };

    var src = new VectorSource();
    src.setId('testy');
    const listenKey = listen(src, GoogEventType.PROPERTYCHANGE, onChange);
    for (var i = 0; i < 3; i++) {
      var f = new Feature();
      f.setId('' + i);
      f.setGeometry(new Point([0, 0]));
      src.addFeature(f);
    }

    waitsFor(function() {
      return featuresAdded;
    }, 'features to be added to crossfilter');

    runs(function() {
      DataManager.getInstance().addSource(src);
      unlistenByKey(listenKey);

      var cmd = new SelectAll(src.getId());
      expect(cmd.execute()).toBe(true);
      expect(cmd.state).toBe(State.SUCCESS);
      expect(src.getSelectedItems().length).toBe(3);

      expect(cmd.revert()).toBe(true);
      expect(cmd.state).toBe(State.READY);
      expect(src.getSelectedItems().length).toBe(0);
      DataManager.getInstance().removeSource(src);
    });
  });
});
