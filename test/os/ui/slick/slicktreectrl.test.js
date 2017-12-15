goog.require('os.ui.slick.SlickTreeCtrl');
goog.require('os.ui.slick.SlickTreeNode');

describe('os.ui.slick.SlickTreeCtrl', function() {
  it('should flatten trees properly', function() {
    var root = new os.ui.slick.SlickTreeNode();
    root.setId('root');
    var folder1 = new os.ui.slick.SlickTreeNode();
    folder1.setId('folder1');
    var folder2 = new os.ui.slick.SlickTreeNode();
    folder2.setId('folder2');
    var leaf1A = new os.ui.slick.SlickTreeNode();
    leaf1A.setId('leaf1A');
    var leaf1B = new os.ui.slick.SlickTreeNode();
    leaf1B.setId('leaf1B');
    var leaf2A = new os.ui.slick.SlickTreeNode();
    leaf2A.setId('leaf2A');
    var leaf2B = new os.ui.slick.SlickTreeNode();
    leaf2B.setId('leaf2B');

    folder1.setChildren([leaf1A, leaf1B]);
    folder2.setChildren([leaf2A, leaf2B]);
    root.setChildren([folder1, folder2]);

    var result = [];
    os.ui.slick.SlickTreeCtrl.flatten_([root], result);

    expect(result.indexOf(root)).toBe(0);
    expect(root.depth).toBe(0);

    expect(result.indexOf(folder1)).toBe(1);
    expect(folder1.depth).toBe(1);
    expect(folder1.parentIndex).toBe(0);

    expect(result.indexOf(leaf1A)).toBe(2);
    expect(leaf1A.depth).toBe(2);
    expect(leaf1A.parentIndex).toBe(1);

    expect(result.indexOf(leaf1B)).toBe(3);
    expect(leaf1B.depth).toBe(2);
    expect(leaf1B.parentIndex).toBe(1);

    expect(result.indexOf(folder2)).toBe(4);
    expect(folder2.depth).toBe(1);
    expect(folder2.parentIndex).toBe(0);

    expect(result.indexOf(leaf2A)).toBe(5);
    expect(leaf2B.depth).toBe(2);
    expect(leaf2B.parentIndex).toBe(4);

    expect(result.indexOf(leaf2B)).toBe(6);
    expect(leaf2B.depth).toBe(2);
    expect(leaf2B.parentIndex).toBe(4);
  });
});
