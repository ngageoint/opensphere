goog.require('os.data.groupby.MockTypeGroupBy');
goog.require('os.structs.TriStateTreeNode');


describe('os.data.groupby.BaseGroupBy', function() {
  it('should create groups and keep track of counts', function() {
    var by = new os.data.groupby.MockTypeGroupBy();
    by.init();

    // this is just for brevity, don't actually do this in the code
    var node1 = new os.structs.TriStateTreeNode();
    node1.type = 'Group A';

    var node2 = new os.structs.TriStateTreeNode();
    node2.type = 'Group B';

    var results = [];
    by.groupBy(node1, results);
    by.count(node1);

    expect(results.length).toBe(1);
    expect(results[0].getLabel()).toBe('Group A (1)');
    expect(node1.getParent()).not.toBe(results[0]);

    by.groupBy(node2, results);
    by.count(node2);
    expect(results.length).toBe(2);
    expect(results[1].getLabel()).toBe('Group B (1)');

    var node3 = new os.structs.TriStateTreeNode();
    node3.type = 'Group A';
    by.count(node3);
    expect(results[0].getLabel()).toBe('Group A (1 of 2)');
  });
});

