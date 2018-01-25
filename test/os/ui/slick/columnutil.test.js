goog.require('os.data.ColumnDefinition');
goog.require('os.ui.slick.column');


describe('os.ui.slick.column', function() {
  it('should properly enable/disable the remove action', function() {
    var cols = [
      new os.data.ColumnDefinition('column1'),
      new os.data.ColumnDefinition('column2'),
      new os.data.ColumnDefinition('column3')
    ];

    var thisArg = {};
    var context = {
      columns: cols,
      column: cols[1],
      grid: {}
    };

    os.ui.slick.column.visibleIfCanRemove_.call(thisArg, context);
    expect(thisArg.visible).toBe(true);

    delete thisArg.visible;
    cols[0].visible = false;
    os.ui.slick.column.visibleIfCanRemove_.call(thisArg, context);
    expect(thisArg.visible).toBe(true);

    delete thisArg.visible;
    cols[1].visible = false;
    os.ui.slick.column.visibleIfCanRemove_.call(thisArg, context);
    expect(thisArg.visible).toBe(false);

    delete thisArg.visible;
    cols[1].visible = true;
    os.ui.slick.column.visibleIfCanRemove_.call(thisArg, context);
    expect(thisArg.visible).toBe(true);
  });
});
