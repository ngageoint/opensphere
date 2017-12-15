goog.require('os.command.State');
goog.require('os.mock');
goog.require('os.MapContainer');
goog.require('os.command.FeaturesVisibility');
goog.require('os.data.DataManager');
goog.require('os.mock');
goog.require('os.source.Vector');
goog.require('ol.Feature');
goog.require('ol.geom.Point');


describe('os.command.FeaturesVisibility', function() {
  var src;

  beforeEach(function() {
    if (src) {
      os.osDataManager.removeSource(src);
    }

    src = new os.source.Vector();
    src.setId('testy');
    os.osDataManager.addSource(src);
  });

  it('should fail when the source is not provided', function() {
    var cmd = new os.command.FeaturesVisibility(null);
    expect(cmd.execute()).toBe(false);
    expect(cmd.state).toBe(os.command.State.ERROR);
  });

  it('should fail when the features are not provided', function() {
    var cmd = new os.command.FeaturesVisibility(src.getId(), null);
    expect(cmd.execute()).toBe(false);
    expect(cmd.state).toBe(os.command.State.ERROR);
  });

  it('should hide the given features on the source', function() {
    for (var i = 0; i < 5; i++) {
      var f = new ol.Feature();
      f.setId('' + i);
      f.setGeometry(new ol.geom.Point([0, 0]));
      src.addFeature(f);
    }

    var features = src.getFeatures().slice(0, 2);

    var cmd = new os.command.FeaturesVisibility(src.getId(), features, false);
    expect(cmd.execute()).toBe(true);
    expect(cmd.state).toBe(os.command.State.SUCCESS);
    expect(src.getHiddenItems().length).toBe(features.length);

    expect(cmd.revert()).toBe(true);
    expect(cmd.state).toBe(os.command.State.READY);
    expect(src.getHiddenItems().length).toBe(0);
  });

  it('should show the given features on the source', function() {
    for (var i = 0; i < 5; i++) {
      var f = new ol.Feature();
      f.setId('' + i);
      f.setGeometry(new ol.geom.Point([0, 0]));
      src.addFeature(f);
    }

    var features = src.getFeatures().slice(0, 2);

    var cmd = new os.command.FeaturesVisibility(src.getId(), features, false);
    expect(cmd.execute()).toBe(true);
    expect(cmd.state).toBe(os.command.State.SUCCESS);
    expect(src.getHiddenItems().length).toBe(features.length);

    var check = features.length - 1;
    features = [features[0]];

    cmd = new os.command.FeaturesVisibility(src.getId(), features, true);
    expect(cmd.execute()).toBe(true);
    expect(cmd.state).toBe(os.command.State.SUCCESS);
    expect(src.getHiddenItems().length).toBe(check);

    expect(cmd.revert()).toBe(true);
    expect(cmd.state).toBe(os.command.State.READY);
    expect(src.getHiddenItems().length).toBe(check + 1);

    // clean up so we don't affect other tests (a.k.a. leave skipped features on the map)
    cmd = new os.command.FeaturesVisibility(src, src.getFeatures(), true);
    cmd.execute();
  });

  it('cleanup', function() {
    os.osDataManager.removeSource(src);
  });
});
