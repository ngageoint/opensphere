goog.require('os.ui.slick.SlickTreeNode');

describe('os.ui.slick.SlickTreeNode', function() {
  it('should set/export label for SlickGrid', function() {
    var node = new os.ui.slick.SlickTreeNode();
    node.setLabel('Test 1');

    expect(node.label).toBe('Test 1');
  });
});
