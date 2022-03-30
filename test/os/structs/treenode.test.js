goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('os.structs.TreeNode');

import {includes} from 'ol/src/array.js';

describe('os.structs.TreeNode', function() {
  const googEvents = goog.module.get('goog.events');
  const GoogEventType = goog.module.get('goog.events.EventType');
  const {default: TreeNode} = goog.module.get('os.structs.TreeNode');

  it('should default everything to null except ID', function() {
    var node = new TreeNode();
    expect(node.getId()).not.toBe(null);
    expect(node.getParent()).toBe(null);
    expect(node.getChildren()).toBe(null);
  });

  it('should be able to set children to an array or null', function() {
    var root = new TreeNode();
    var first = new TreeNode();
    var second = new TreeNode();
    var third = new TreeNode();
    var children = [first, second, third];
    root.setChildren(children);

    var rootChildren = root.getChildren();
    expect(rootChildren.length).toBe(3);
    expect(includes(rootChildren, first)).toBe(true);
    expect(includes(rootChildren, second)).toBe(true);
    expect(includes(rootChildren, third)).toBe(true);
    expect(googEvents.hasListener(first, GoogEventType.PROPERTYCHANGE, false)).toBe(true);
    expect(googEvents.hasListener(second, GoogEventType.PROPERTYCHANGE, false)).toBe(true);
    expect(googEvents.hasListener(third, GoogEventType.PROPERTYCHANGE, false)).toBe(true);

    root.setChildren(null);
    expect(root.getChildren()).toBe(null);
    expect(googEvents.hasListener(first, GoogEventType.PROPERTYCHANGE, false)).toBe(false);
    expect(googEvents.hasListener(second, GoogEventType.PROPERTYCHANGE, false)).toBe(false);
    expect(googEvents.hasListener(third, GoogEventType.PROPERTYCHANGE, false)).toBe(false);
  });

  it('should know if it has children', function() {
    var root = new TreeNode();
    var child = new TreeNode();
    expect(root.hasChildren()).toBe(false);
    expect(child.hasChildren()).toBe(false);

    root.addChild(child);
    expect(root.hasChildren()).toBe(true);
    expect(child.hasChildren()).toBe(false);

    root.removeChild(child);
    expect(root.hasChildren()).toBe(false);
  });

  it('should be able to add a child node', function() {
    var root = new TreeNode();
    var child = new TreeNode();

    root.addChild(child);
    expect(root.getChildren()).toContain(child);
    expect(child.getParent()).toBe(root);
  });

  it('should be able to add a child node without reparenting the child', function() {
    var root = new TreeNode();
    var child = new TreeNode();

    root.addChild(child, true);
    expect(root.getChildren()).toContain(child);
    expect(child.getParent()).toBe(null);
  });

  it('should be able to add a child node at a given index', function() {
    var root = new TreeNode();
    var child = new TreeNode();
    var firstChild = new TreeNode();
    var middleChild = new TreeNode();

    root.addChild(child, false);
    root.addChild(firstChild, false, 0);
    expect(root.getChildren()).toContain(firstChild);
    expect(root.getChildren().indexOf(firstChild)).toBe(0);
    root.addChild(middleChild, false, 1);
    expect(root.getChildren()).toContain(middleChild);
    expect(root.getChildren().indexOf(middleChild)).toBe(1);
  });

  it('should not add a node that is already there', function() {
    var root = new TreeNode();
    var child = new TreeNode();

    root.addChild(child);
    root.addChild(child);

    expect(root.getChildren().length).toBe(1);
  });

  it('should add multiple children', function() {
    var root = new TreeNode();
    var child1 = new TreeNode();
    var child2 = new TreeNode();
    var child3 = new TreeNode();
    var child4 = new TreeNode();

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
    var root = new TreeNode();
    var child = new TreeNode();

    root.addChild(child);
    var ret = root.removeChild(child);

    expect(root.getChildren()).toBe(null);
    expect(child.getParent()).toBe(null);
    expect(ret).toBe(child);
  });

  it('should be able to remove a child that is not parented to itself', function() {
    var root = new TreeNode();
    var child = new TreeNode();
    var other = new TreeNode();

    root.addChild(child);
    other.addChild(child, true);

    var ret = other.removeChild(child);

    expect(other.getChildren()).toBe(null);
    expect(child.getParent()).toBe(root);
    expect(ret).toBe(child);
  });

  it('should not fail when trying to remove a node that is not there', function() {
    var root = new TreeNode();
    var child = new TreeNode();
    var other = new TreeNode();

    var fn = function() {
      var ret = root.removeChild(other);
      expect(ret).toBe(null);
    };

    expect(fn).not.toThrow();
    root.addChild(child);
    expect(fn).not.toThrow();
  });

  it('should be able to find nodes by fields on the node', function() {
    var root = new TreeNode();
    root.setId('rootId');
    root.setLabel('rootLabel');

    var child = new TreeNode();
    child.setId('childId');
    child.setLabel('childLabel');

    var other = new TreeNode();
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
    var root = new TreeNode();
    root.setId('rootId');
    root.setLabel('rootLabel');

    var child = new TreeNode();
    child.setId('childId');
    child.setLabel('childLabel');

    var grandchild = new TreeNode();
    grandchild.setId('grandchild');
    grandchild.setLabel('otherLabel');

    var count = 0;
    var listener = function(e) {
      if (e.getProperty() == 'children') {
        count++;
      }
    };

    root.listen(GoogEventType.PROPERTYCHANGE, listener);

    root.addChild(child);
    expect(count).toBe(1);

    child.addChild(grandchild);
    expect(count).toBe(2);
  });

  it('should be able to detect if grandchild has grandparent', function() {
    var root = new TreeNode();
    root.setId('rootId');
    root.setLabel('rootLabel');

    var child = new TreeNode();
    child.setId('childId');
    child.setLabel('childLabel');

    var grandchild = new TreeNode();
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
