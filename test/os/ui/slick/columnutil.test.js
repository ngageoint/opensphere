goog.require('os.data.ColumnDefinition');
goog.require('os.ui.slick.column');


describe('os.ui.slick.column', function() {
  it('should properly enable/disable the remove action', function() {
    var cols = [
      new os.data.ColumnDefinition('column1'),
      new os.data.ColumnDefinition('column2'),
      new os.data.ColumnDefinition('column3')
    ];

    var args = {
      columns: cols,
      column: cols[1],
      grid: {}
    };

    expect(os.ui.slick.column.checkColumnRemove_(args)).toBe(true);
    cols[0].visible = false;
    expect(os.ui.slick.column.checkColumnRemove_(args)).toBe(true);
    cols[1].visible = false;
    expect(os.ui.slick.column.checkColumnRemove_(args)).toBe(false);
    cols[1].visible = true;
    expect(os.ui.slick.column.checkColumnRemove_(args)).toBe(true);
  });
});
