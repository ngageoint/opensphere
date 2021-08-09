goog.require('os.data.ColumnDefinition');
goog.require('os.ui.slick.column');

describe('os.ui.slick.column', function() {
  const ColumnDefinition = goog.module.get('os.data.ColumnDefinition');
  const column = goog.module.get('os.ui.slick.column');

  it('should properly enable/disable the remove action', function() {
    var cols = [
      new ColumnDefinition('column1'),
      new ColumnDefinition('column2'),
      new ColumnDefinition('column3')
    ];

    var thisArg = {};
    var context = {
      columns: cols,
      column: cols[1],
      grid: {}
    };

    column.visibleIfCanRemove.call(thisArg, context);
    expect(thisArg.visible).toBe(true);

    delete thisArg.visible;
    cols[0].visible = false;
    column.visibleIfCanRemove.call(thisArg, context);
    expect(thisArg.visible).toBe(true);

    delete thisArg.visible;
    cols[1].visible = false;
    column.visibleIfCanRemove.call(thisArg, context);
    expect(thisArg.visible).toBe(false);

    delete thisArg.visible;
    cols[1].visible = true;
    column.visibleIfCanRemove.call(thisArg, context);
    expect(thisArg.visible).toBe(true);
  });
});
