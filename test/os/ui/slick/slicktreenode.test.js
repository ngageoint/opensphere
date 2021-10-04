goog.require('os.ui.slick.SlickTreeNode');

describe('os.ui.slick.SlickTreeNode', function() {
  const {default: SlickTreeNode} = goog.module.get('os.ui.slick.SlickTreeNode');

  it('should set/export label for SlickGrid', function() {
    var node = new SlickTreeNode();
    node.setLabel('Test 1');

    expect(node.label).toBe('Test 1');
  });
});
