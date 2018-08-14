goog.require('os.command.State');
goog.require('os.command.SelectNone');
goog.require('os.data.DataManager');
goog.require('os.source.Vector');
goog.require('ol.Feature');
goog.require('ol.geom.Point');


describe('os.command.SelectNone', function() {
  it('should fail when the source is not provided', function() {
    var cmd = new os.command.SelectNone(null);
    expect(cmd.execute()).toBe(false);
    expect(cmd.state).toBe(os.command.State.ERROR);
  });

  it('should deselect all the features on the source', function() {
    var src = new os.source.Vector();
    src.setId('testy');

    os.osDataManager.addSource(src);
    for (var i = 0; i < 3; i++) {
      var f = new ol.Feature();
      f.setId('' + i);
      f.setGeometry(new ol.geom.Point([0, 0]));
      src.addFeature(f);
      src.addToSelected(f);
    }

    expect(src.getSelectedItems().length).toBe(3);

    var cmd = new os.command.SelectNone(src.getId());
    expect(cmd.execute()).toBe(true);
    expect(cmd.state).toBe(os.command.State.SUCCESS);
    expect(src.getSelectedItems().length).toBe(0);

    expect(cmd.revert()).toBe(true);
    expect(cmd.state).toBe(os.command.State.READY);
    expect(src.getSelectedItems().length).toBe(3);
    os.osDataManager.removeSource(src);
  });
});
