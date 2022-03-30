goog.require('os.MapContainer');
goog.require('os.command.FeaturesVisibility');
goog.require('os.command.State');
goog.require('os.data.DataManager');
goog.require('os.mock');
goog.require('os.source.Vector');

import Feature from 'ol/src/Feature.js';
import Point from 'ol/src/geom/Point.js';

describe('os.command.FeaturesVisibility', function() {
  const {default: FeaturesVisibility} = goog.module.get('os.command.FeaturesVisibility');
  const {default: State} = goog.module.get('os.command.State');
  const {default: DataManager} = goog.module.get('os.data.DataManager');
  const {default: VectorSource} = goog.module.get('os.source.Vector');

  var src;

  beforeEach(function() {
    if (src) {
      DataManager.getInstance().removeSource(src);
    }

    src = new VectorSource();
    src.setId('testy');
    DataManager.getInstance().addSource(src);
  });

  it('should fail when the source is not provided', function() {
    var cmd = new FeaturesVisibility(null);
    expect(cmd.execute()).toBe(false);
    expect(cmd.state).toBe(State.ERROR);
  });

  it('should fail when the features are not provided', function() {
    var cmd = new FeaturesVisibility(src.getId(), null);
    expect(cmd.execute()).toBe(false);
    expect(cmd.state).toBe(State.ERROR);
  });

  it('should hide the given features on the source', function() {
    for (var i = 0; i < 5; i++) {
      var f = new Feature();
      f.setId('' + i);
      f.setGeometry(new Point([0, 0]));
      src.addFeature(f);
    }

    var features = src.getFeatures().slice(0, 2);

    var cmd = new FeaturesVisibility(src.getId(), features, false);
    expect(cmd.execute()).toBe(true);
    expect(cmd.state).toBe(State.SUCCESS);
    expect(src.getHiddenItems().length).toBe(features.length);

    expect(cmd.revert()).toBe(true);
    expect(cmd.state).toBe(State.READY);
    expect(src.getHiddenItems().length).toBe(0);
  });

  it('should show the given features on the source', function() {
    for (var i = 0; i < 5; i++) {
      var f = new Feature();
      f.setId('' + i);
      f.setGeometry(new Point([0, 0]));
      src.addFeature(f);
    }

    var features = src.getFeatures().slice(0, 2);

    var cmd = new FeaturesVisibility(src.getId(), features, false);
    expect(cmd.execute()).toBe(true);
    expect(cmd.state).toBe(State.SUCCESS);
    expect(src.getHiddenItems().length).toBe(features.length);

    var check = features.length - 1;
    features = [features[0]];

    cmd = new FeaturesVisibility(src.getId(), features, true);
    expect(cmd.execute()).toBe(true);
    expect(cmd.state).toBe(State.SUCCESS);
    expect(src.getHiddenItems().length).toBe(check);

    expect(cmd.revert()).toBe(true);
    expect(cmd.state).toBe(State.READY);
    expect(src.getHiddenItems().length).toBe(check + 1);

    // clean up so we don't affect other tests (a.k.a. leave skipped features on the map)
    cmd = new FeaturesVisibility(src, src.getFeatures(), true);
    cmd.execute();
  });

  it('cleanup', function() {
    DataManager.getInstance().removeSource(src);
  });
});
