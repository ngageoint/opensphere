goog.require('os.command.State');
goog.require('goog.events.EventType');
goog.require('os.command.InvertSelect');
goog.require('os.data.DataManager');
goog.require('os.mock');
goog.require('os.source.PropertyChange');
goog.require('os.source.Vector');
goog.require('ol.Feature');
goog.require('ol.events');
goog.require('ol.geom.Point');


describe('os.command.InvertSelect', function() {
  it('should fail when the source is not provided', function() {
    var cmd = new os.command.InvertSelect(null);
    expect(cmd.execute()).toBe(false);
    expect(cmd.state).toBe(os.command.State.ERROR);
  });

  it('should select all the features on the source', function() {
    // features are not added to crossfilter until the add timer expires, so we have to wait for that
    // before continuing with tests
    var featuresAdded = false;
    var onChange = function(e) {
      if (e.getProperty() == os.source.PropertyChange.FEATURES) {
        featuresAdded = true;
      }
    };

    var src = new os.source.Vector();
    src.setId('testy');
    ol.events.listen(src, goog.events.EventType.PROPERTYCHANGE, onChange);
    for (var i = 0; i < 3; i++) {
      var f = new ol.Feature();
      f.setId('' + i);
      f.setGeometry(new ol.geom.Point([0, 0]));
      src.addFeature(f);
    }

    waitsFor(function() {
      return featuresAdded;
    }, 'features to be added to crossfilter');

    runs(function() {
      ol.events.unlisten(src, goog.events.EventType.PROPERTYCHANGE, onChange);
      src.addToSelected(f);
      os.osDataManager.addSource(src);

      var cmd = new os.command.InvertSelect(src.getId());
      expect(cmd.execute()).toBe(true);
      expect(cmd.state).toBe(os.command.State.SUCCESS);
      expect(src.getSelectedItems().length).toBe(2);

      expect(cmd.revert()).toBe(true);
      expect(cmd.state).toBe(os.command.State.READY);
      expect(src.getSelectedItems().length).toBe(1);

      os.osDataManager.removeSource(src);
    });
  });
});
