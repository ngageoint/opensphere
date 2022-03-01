goog.require('os.command.SelectNone');
goog.require('os.command.State');
goog.require('os.data.DataManager');
goog.require('os.source.Vector');

import Point from 'ol/geom/Point';
import Feature from 'ol/src/Feature';

describe('os.command.SelectNone', function() {
  const {default: SelectNone} = goog.module.get('os.command.SelectNone');
  const {default: State} = goog.module.get('os.command.State');
  const {default: DataManager} = goog.module.get('os.data.DataManager');
  const {default: VectorSource} = goog.module.get('os.source.Vector');

  it('should fail when the source is not provided', function() {
    var cmd = new SelectNone(null);
    expect(cmd.execute()).toBe(false);
    expect(cmd.state).toBe(State.ERROR);
  });

  it('should deselect all the features on the source', function() {
    var src = new VectorSource();
    src.setId('testy');

    DataManager.getInstance().addSource(src);
    for (var i = 0; i < 3; i++) {
      var f = new Feature();
      f.setId('' + i);
      f.setGeometry(new Point([0, 0]));
      src.addFeature(f);
      src.addToSelected(f);
    }

    expect(src.getSelectedItems().length).toBe(3);

    var cmd = new SelectNone(src.getId());
    expect(cmd.execute()).toBe(true);
    expect(cmd.state).toBe(State.SUCCESS);
    expect(src.getSelectedItems().length).toBe(0);

    expect(cmd.revert()).toBe(true);
    expect(cmd.state).toBe(State.READY);
    expect(src.getSelectedItems().length).toBe(3);
    DataManager.getInstance().removeSource(src);
  });
});
