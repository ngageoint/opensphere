goog.require('os.structs.TreeNode');

describe('os.structs.TreeNode', function() {
  it('should default everything to null except ID', function() {
    var node = new os.structs.TreeNode();
    expect(node.getId()).not.toBe(null);
    expect(node.getParent()).toBe(null);
    expect(node.getChildren()).toBe(null);
  });

  it('should be able to set children to an array or null', function() {
    var root = new os.structs.TreeNode();
    var first = new os.structs.TreeNode();
    var second = new os.structs.TreeNode();
    var third = new os.structs.TreeNode();
    var children = [first, second, third];
    root.setChildren(children);

    var rootChildren = root.getChildren();
    expect(rootChildren.length).toBe(3);
    expect(goog.array.contains(rootChildren, first)).toBe(true);
    expect(goog.array.contains(rootChildren, second)).toBe(true);
    expect(goog.array.contains(rootChildren, third)).toBe(true);
    expect(goog.events.hasListener(first, goog.events.EventType.PROPERTYCHANGE, false)).toBe(true);
    expect(goog.events.hasListener(second, goog.events.EventType.PROPERTYCHANGE, false)).toBe(true);
    expect(goog.events.hasListener(third, goog.events.EventType.PROPERTYCHANGE, false)).toBe(true);

    root.setChildren(null);
    expect(root.getChildren()).toBe(null);
    expect(goog.events.hasListener(first, goog.events.EventType.PROPERTYCHANGE, false)).toBe(false);
    expect(goog.events.hasListener(second, goog.events.EventType.PROPERTYCHANGE, false)).toBe(false);
    expect(goog.events.hasListener(third, goog.events.EventType.PROPERTYCHANGE, false)).toBe(false);
  });

  it('should know if it has children', function() {
    var root = new os.structs.TreeNode();
    var child = new os.structs.TreeNode();
    expect(root.hasChildren()).toBe(false);
    expect(child.hasChildren()).toBe(false);

    root.addChild(child);
    expect(root.hasChildren()).toBe(true);
    expect(child.hasChildren()).toBe(false);

    root.removeChild(child);
    expect(root.hasChildren()).toBe(false);
  });

  it('should be able to add a child node', function() {
    var root = new os.structs.TreeNode();
    var child = new os.structs.TreeNode();

    root.addChild(child);
    expect(root.getChildren()).toContain(child);
    expect(child.getParent()).toBe(root);
  });

  it('should be able to add a child node without reparenting the child', function() {
    var root = new os.structs.TreeNode();
    var child = new os.structs.TreeNode();

    root.addChild(child, true);
    expect(root.getChildren()).toContain(child);
    expect(child.getParent()).toBe(null);
  });

  it('should be able to add a child node at a given index', function() {
    var root = new os.structs.TreeNode();
    var child = new os.structs.TreeNode();
    var firstChild = new os.structs.TreeNode();
    var middleChild = new os.structs.TreeNode();

    root.addChild(child, false);
    root.addChild(firstChild, false, 0);
    expect(root.getChildren()).toContain(firstChild);
    expect(root.getChildren().indexOf(firstChild)).toBe(0);
    root.addChild(middleChild, false, 1);
    expect(root.getChildren()).toContain(middleChild);
    expect(root.getChildren().indexOf(middleChild)).toBe(1);
  });

  it('should not add a node that is already there', function() {
    var root = new os.structs.TreeNode();
    var child = new os.structs.TreeNode();

    root.addChild(child);
    root.addChild(child);

    expect(root.getChildren().length).toBe(1);
  });

  it('should add multiple children', function() {
    var root = new os.structs.TreeNode();
    var child1 = new os.structs.TreeNode();
    var child2 = new os.structs.TreeNode();
    var child3 = new os.structs.TreeNode();
    var child4 = new os.structs.TreeNode();

    // doesn't break with null/empty array
    root.addChildren(null);
    root.addChildren([]);
    expect(root.getChildren()).toBeNull();

    // add single
    root.addChildren([child1]);
    expect(root.getChildren().length).toBe(1);

    // add multiple
    root.addChildren([child2, child3]);
    expect(root.getChildren().length).toBe(3);

    // add all repeats does nothing
    root.addChildren([child1, child2, child3]);
    expect(root.getChildren().length).toBe(3);

    // add some repeats adds missing children
    root.addChildren([child1, child2, child3, child4]);
    expect(root.getChildren().length).toBe(4);
  });

  it('should be able to remove a child node', function() {
    var root = new os.structs.TreeNode();
    var child = new os.structs.TreeNode();

    root.addChild(child);
    var ret = root.removeChild(child);

    expect(root.getChildren()).toBe(null);
    expect(child.getParent()).toBe(null);
    expect(ret).toBe(child);
  });

  it('should be able to remove a child that is not parented to itself', function() {
    var root = new os.structs.TreeNode();
    var child = new os.structs.TreeNode();
    var other = new os.structs.TreeNode();

    root.addChild(child);
    other.addChild(child, true);

    var ret = other.removeChild(child);

    expect(other.getChildren()).toBe(null);
    expect(child.getParent()).toBe(root);
    expect(ret).toBe(child);
  });

  it('should not fail when trying to remove a node that is not there', function() {
    var root = new os.structs.TreeNode();
    var child = new os.structs.TreeNode();
    var other = new os.structs.TreeNode();

    var fn = function() {
      var ret = root.removeChild(other);
      expect(ret).toBe(null);
    };

    expect(fn).not.toThrow();
    root.addChild(child);
    expect(fn).not.toThrow();
  });

  it('should be able to find nodes by fields on the node', function() {
    var root = new os.structs.TreeNode();
    root.setId('rootId');
    root.setLabel('rootLabel');

    var child = new os.structs.TreeNode();
    child.setId('childId');
    child.setLabel('childLabel');

    var other = new os.structs.TreeNode();
    other.setId('otherId');
    other.setLabel('otherLabel');

    root.addChild(child);
    child.addChild(other);

    expect(root.find('id_', 'rootId')).toBe(root);
    expect(root.find('id_', 'childId')).toBe(child);
    expect(root.find('id_', 'otherId')).toBe(other);

    expect(root.find('label_', 'rootLabel')).toBe(root);
    expect(root.find('label_', 'childLabel')).toBe(child);
    expect(root.find('label_', 'otherLabel')).toBe(other);

    expect(root.find('id_', 'doesntExist')).toBeNull();
    expect(root.find('label_', 'doesntExist')).toBeNull();
    expect(root.find('notAField', 'rootId')).toBeNull();
  });

  it('should propagate children updates up the tree', function() {
    var root = new os.structs.TreeNode();
    root.setId('rootId');
    root.setLabel('rootLabel');

    var child = new os.structs.TreeNode();
    child.setId('childId');
    child.setLabel('childLabel');

    var grandchild = new os.structs.TreeNode();
    grandchild.setId('grandchild');
    grandchild.setLabel('otherLabel');

    var count = 0;
    var listener = function(e) {
      if (e.getProperty() == 'children') {
        count++;
      }
    };

    root.listen(goog.events.EventType.PROPERTYCHANGE, listener);

    root.addChild(child);
    expect(count).toBe(1);

    child.addChild(grandchild);
    expect(count).toBe(2);
  });

  it('should be able to detect if grandchild has grandparent', function() {
    var root = new os.structs.TreeNode();
    root.setId('rootId');
    root.setLabel('rootLabel');

    var child = new os.structs.TreeNode();
    child.setId('childId');
    child.setLabel('childLabel');

    var grandchild = new os.structs.TreeNode();
    grandchild.setId('grandchild');
    grandchild.setLabel('otherLabel');

    expect(grandchild.hasElder(root)).toBe(false);
    expect(grandchild.hasElder(child)).toBe(false);

    root.addChild(child);
    child.addChild(grandchild);

    expect(grandchild.hasElder(root)).toBe(true);
    expect(grandchild.hasElder(child)).toBe(true);
  });
});
