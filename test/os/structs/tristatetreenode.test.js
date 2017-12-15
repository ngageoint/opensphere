goog.require('os.structs.TriState');
goog.require('os.structs.TriStateTreeNode');
goog.require('goog.events.EventType');

describe('os.structs.TriStateTreeNode', function() {
  var root;
  var folder1, folder2;
  var leaf1A, leaf1B, leaf2A, leaf2B;

  beforeEach(function() {
    root = new os.structs.TriStateTreeNode();
    root.setId('root');

    folder1 = new os.structs.TriStateTreeNode();
    folder1.setId('folder1');

    folder2 = new os.structs.TriStateTreeNode();
    folder2.setId('folder2');

    leaf1A = new os.structs.TriStateTreeNode();
    leaf1A.setId('leaf1A');

    leaf1B = new os.structs.TriStateTreeNode();
    leaf1B.setId('leaf1B');

    leaf2A = new os.structs.TriStateTreeNode();
    leaf2A.setId('leaf2A');

    leaf2B = new os.structs.TriStateTreeNode();
    leaf2B.setId('leaf2B');

    folder1.setChildren([leaf1A, leaf1B]);
    folder2.setChildren([leaf2A, leaf2B]);

    root.addChild(folder1);
    root.addChild(folder2);
  });

  it('should default to everything off', function() {
    var list = [root, folder1, folder2, leaf1A, leaf1B, leaf2A, leaf2B];
    for (var i = 0, n = list.length; i < n; i++) {
      expect(list[i].getState()).toBe(os.structs.TriState.OFF);
      var c = list[i].getChildren();
      expect(list[i].counts_[os.structs.TriState.OFF]).toBe(c ? c.length : 0);
      expect(list[i].counts_[os.structs.TriState.ON]).toBe(0);
    }
  });

  it('should turn all nodes on when the root is turned on', function() {
    root.setState(os.structs.TriState.ON);

    var list = [root, folder1, folder2, leaf1A, leaf1B, leaf2A, leaf2B];
    for (var i = 0, n = list.length; i < n; i++) {
      expect(list[i].getState()).toBe(os.structs.TriState.ON);
      var c = list[i].getChildren();
      expect(list[i].counts_[os.structs.TriState.ON]).toBe(c ? c.length : 0);
      expect(list[i].counts_[os.structs.TriState.OFF]).toBe(0);
    }
  });

  it('should turn all nodes off when the root node is turned off', function() {
    root.setState(os.structs.TriState.ON);
    root.setState(os.structs.TriState.OFF);

    var list = [root, folder1, folder2, leaf1A, leaf1B, leaf2A, leaf2B];
    for (var i = 0, n = list.length; i < n; i++) {
      expect(list[i].getState()).toBe(os.structs.TriState.OFF);
      var c = list[i].getChildren();
      expect(list[i].counts_[os.structs.TriState.OFF]).toBe(c ? c.length : 0);
      expect(list[i].counts_[os.structs.TriState.ON]).toBe(0);
    }
  });

  it('should make root BOTH and children ON when folder1 is turned on', function() {
    folder1.setState(os.structs.TriState.ON);

    expect(root.getState()).toBe(os.structs.TriState.BOTH);
    expect(folder1.getState()).toBe(os.structs.TriState.ON);
    expect(leaf1A.getState()).toBe(os.structs.TriState.ON);
    expect(leaf1B.getState()).toBe(os.structs.TriState.ON);
    expect(folder2.getState()).toBe(os.structs.TriState.OFF);
  });

  it('should make all parents BOTH when a leaf is turned on', function() {
    leaf1A.setState(os.structs.TriState.ON);

    expect(folder1.getState()).toBe(os.structs.TriState.BOTH);
    expect(root.getState()).toBe(os.structs.TriState.BOTH);
    expect(folder2.getState()).toBe(os.structs.TriState.OFF);
  });

  it('should update parents when a child is removed', function() {
    root.setState(os.structs.TriState.ON);
    leaf1B.setState(os.structs.TriState.OFF);
    leaf2B.setState(os.structs.TriState.OFF);

    // initially 1A/2A are ON, 1B/2B are OFF, so all parents should be BOTH
    expect(root.getState()).toBe(os.structs.TriState.BOTH);
    expect(folder1.getState()).toBe(os.structs.TriState.BOTH);
    expect(folder2.getState()).toBe(os.structs.TriState.BOTH);

    // remove 1A, F1 should transition from BOTH to OFF
    folder1.removeChild(leaf1A);
    expect(root.getState()).toBe(os.structs.TriState.BOTH);
    expect(folder1.getState()).toBe(os.structs.TriState.OFF);
    expect(folder2.getState()).toBe(os.structs.TriState.BOTH);

    // remove 2B, F2 should transition from BOTH to ON
    folder2.removeChild(leaf2B);
    expect(root.getState()).toBe(os.structs.TriState.BOTH);
    expect(folder1.getState()).toBe(os.structs.TriState.OFF);
    expect(folder2.getState()).toBe(os.structs.TriState.ON);

    // remove 2A, F2 should transition from ON to OFF
    folder2.removeChild(leaf2A);
    expect(root.getState()).toBe(os.structs.TriState.OFF);
    expect(folder1.getState()).toBe(os.structs.TriState.OFF);
    expect(folder2.getState()).toBe(os.structs.TriState.OFF);
  });

  it('should not accept bogus states', function() {
    root.setState('yermom');
    expect(root.getState()).toBe(os.structs.TriState.OFF);
  });

  it('should not dispatch an event if the state does not change', function() {
    var count = 0;
    var listener = function(e) {
      count++;
    };

    root.listen(goog.events.EventType.PROPERTYCHANGE, listener);
    root.setState(root.getState());
    expect(count).toBe(0);
  });
});
