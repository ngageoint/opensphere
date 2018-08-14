goog.require('os.ui.MockTypeGroupBy');
goog.require('os.ui.slick.SlickTreeNode');
goog.require('os.ui.slick.TreeSearch');


describe('os.ui.slick.TreeSearch', function() {
  var list = [];

  var node = new os.ui.slick.SlickTreeNode();
  node.setId('greek');
  node.setLabel('Greek');
  list.push(node);

  node = new os.ui.slick.SlickTreeNode();
  node.setId('A');
  node.setLabel('Alpha');
  node.type = 'Greek';
  list[0].addChild(node);

  node = new os.ui.slick.SlickTreeNode();
  node.setId('B2');
  node.setLabel('Beta');
  node.type = 'Greek';
  list[0].addChild(node);

  node = new os.ui.slick.SlickTreeNode();
  node.setId('yermom');
  node.setLabel('Yermom');
  node.type = 'Large';
  list.push(node);

  node = new os.ui.slick.SlickTreeNode();
  node.setId('B');
  node.setLabel('Beta');
  node.type = 'Greek';
  list[0].addChild(node);

  it('should search everything', function() {
    var o = {};
    var s = new os.ui.slick.TreeSearch(list, 'data', o);
    s.beginSearch('', null);

    expect(o.data).toBeTruthy();
    expect(o.data.length).toBe(2);
    expect(o.data[0].getId()).toBe('greek');
    expect(o.data[1].getId()).toBe('yermom');
  });

  it('should search nothing', function() {
    var o = {};
    var s = new os.ui.slick.TreeSearch([], 'data', o, 'No soup for you!');
    s.beginSearch('', null);

    expect(o.data).toBeTruthy();
    expect(o.data.length).toBe(1);
    expect(o.data[0].getLabel()).toBe('No soup for you!');
  });

  it('should search with a specific term', function() {
    var o = {};
    var s = new os.ui.slick.TreeSearch(list, 'data', o);
    s.beginSearch('beta', null);

    expect(o.data).toBeTruthy();
    expect(o.data.length).toBe(2);
    expect(o.data[0].getId()).toBe('B');
    expect(o.data[1].getId()).toBe('B2');
  });

  it('should leave out itty bitty terms unless it is the only term', function() {
    var o = {};
    var s = new os.ui.slick.TreeSearch(list, 'data', o);
    s.beginSearch('be', null);

    expect(o.data).toBeTruthy();
    expect(o.data.length).toBe(2);
    expect(o.data[0].getId()).toBe('B');
    expect(o.data[1].getId()).toBe('B2');

    s.beginSearch('"alpha b"');

    expect(o.data).toBeTruthy();
    expect(o.data.length).toBe(1);
    expect(o.data[0].getLabel()).toBe('Alpha');
  });

  it('should rock a filter function like a boss', function() {
    var o = {};
    var s = new os.ui.slick.TreeSearch(list, 'data', o);
    s.setFilterFunction(function(item) {
      return item.getId().length == 1;
    });

    s.beginSearch('be', null);
    expect(o.data).toBeTruthy();
    expect(o.data.length).toBe(1);
    expect(o.data[0].getId()).toBe('B');
  });

  it('should group search results', function() {
    var o = {};
    var s = new os.ui.slick.TreeSearch(list, 'data', o);

    // group everything
    s.beginSearch('', new os.ui.MockTypeGroupBy());

    expect(o.data).toBeTruthy();
    expect(o.data.length).toBe(2);
    expect(o.data[0].getLabel()).toBe('Greek (3)');
    expect(o.data[1].getLabel()).toBe('Large (1)');

    // group search results
    s.beginSearch('be', new os.ui.MockTypeGroupBy());

    expect(o.data).toBeTruthy();
    expect(o.data.length).toBe(1);
    expect(o.data[0].getLabel()).toBe('Greek (2 of 3)');
  });

  it('should maintain open items between searches if possible', function() {
    var o = {};
    var s = new os.ui.slick.TreeSearch(list, 'data', o);

    var tgb = new os.ui.MockTypeGroupBy();

    // initial state
    s.beginSearch('', tgb);

    // expand the node
    o.data[0].collapsed = false;

    // tighter search
    s.beginSearch('be', tgb);

    expect(o.data[0].collapsed).toBe(false);
  });

  it('should not die an unclean death with odd terms', function() {
    var o = {};
    var s = new os.ui.slick.TreeSearch(list, 'data', o);

    var fn = function() {
      s.beginSearch('-()\[]+?*.$\^|,:#<!\\', null);
    };

    expect(fn).not.toThrow();
  });
});
