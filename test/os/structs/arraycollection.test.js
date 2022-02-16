goog.require('goog.structs');
goog.require('os.array');
goog.require('os.structs.ArrayCollection');
goog.require('os.structs.EventType');

describe('os.structs.ArrayCollection', function() {
  const {default: ArrayCollection} = goog.module.get('os.structs.ArrayCollection');
  const {default: EventType} = goog.module.get('os.structs.EventType');
  const {defaultSort} = goog.module.get('os.array');

  /**
   * Mock filter function for unit tests
   * @param {*} val The value
   * @param {number} i The index
   * @param {Array} arr The array
   * @return {boolean} Whether or not to include the value
   */
  const mockFilter = function(val, i, arr) {
    return val % 2 === 0;
  };

  it('should add items from the constructor', function() {
    var c = new ArrayCollection([1, 3, 2]);
    var other = new ArrayCollection();
    expect(c.source_.length).toBe(3);
    expect(c.source_[0]).toBe(1);
    expect(c.source_[1]).toBe(3);
    expect(c.source_[2]).toBe(2);
    expect(other.source_.length).toBe(0);
  });

  it('should be able to add items through add()', function() {
    var c = new ArrayCollection();
    c.add(1);
    c.add(3);
    c.add(2);
    expect(c.source_.length).toBe(3);
    expect(c.source_[0]).toBe(1);
    expect(c.source_[1]).toBe(3);
    expect(c.source_[2]).toBe(2);
  });

  it('should be able to return the index of an item', function() {
    var c = new ArrayCollection([1, 3, 2]);
    expect(c.getItemIndex(2)).toBe(2);
    expect(c.getItemIndex(3)).toBe(1);
    expect(c.getItemIndex(1)).toBe(0);
    expect(c.getItemIndex(999)).toBe(-1);
  });

  it('should be report if it contains an item', function() {
    var c = new ArrayCollection([1, 3, 2]);
    expect(c.contains(1)).toBe(true);
    expect(c.contains(2)).toBe(true);
    expect(c.contains(3)).toBe(true);
    expect(c.contains(999)).toBe(false);
  });

  it('should properly report the count', function() {
    var c = new ArrayCollection([1, 3, 2]);
    expect(c.getCount()).toBe(3);
  });

  it('should be able to remove items through remove()', function() {
    var c = new ArrayCollection([1, 3, 2]);
    c.remove(3);
    expect(c.getValues()).not.toContain(3);
    expect(c.getValues().length).toBe(2);
  });

  it('should be able to add items through addAll()', function() {
    var c = new ArrayCollection();
    c.addAll([1, 3, 2]);
    expect(c.source_.length).toBe(3);
    expect(c.source_[0]).toBe(1);
    expect(c.source_[1]).toBe(3);
    expect(c.source_[2]).toBe(2);

    var x = new ArrayCollection([4, 5, 6]);
    c.addAll(x);
    expect(c.source_.length).toBe(6);
    expect(c.source_[3]).toBe(4);
    expect(c.source_[4]).toBe(5);
    expect(c.source_[5]).toBe(6);
  });

  it('should be abnle to remove items through removeAll()', function() {
    var c = new ArrayCollection([1, 2, 3, 4, 5, 6]);
    c.removeAll([1, 2, 3]);

    expect(c.source_.length).toBe(3);
    expect(c.source_[0]).toBe(4);
    expect(c.source_[1]).toBe(5);
    expect(c.source_[2]).toBe(6);

    c.removeAll(new ArrayCollection([4, 5, 6]));
    expect(c.source_.length).toBe(0);
  });

  it('should properly report when it is empty', function() {
    var c = new ArrayCollection();
    expect(c.isEmpty()).toBe(true);
  });

  it('should properly handle a sort added later', function() {
    var c = new ArrayCollection([3, 2, 1]);
    c.setSort(defaultSort);
    expect(c.sortChanged_).toBe(true);
    expect(c.getSort()).toBe(defaultSort);
    c.refresh();
    expect(c.sortChanged_).toBe(false);

    expect(c.source_[0]).toBe(1);
    expect(c.source_[1]).toBe(2);
    expect(c.source_[2]).toBe(3);
  });

  it('should keep items sorted when added with a sort', function() {
    var c = new ArrayCollection([1, 3, 5]);
    c.setSort(defaultSort);
    c.refresh();

    c.add(2);
    expect(c.source_[1]).toBe(2);
  });

  it('should remove via binary search with a sort', function() {
    var c = new ArrayCollection([3, 2, 1]);
    c.setSort(defaultSort);
    c.refresh();

    c.remove(2);
    expect(c.source_[1]).toBe(3);
  });

  it('should find the proper index with a sort', function() {
    var c = new ArrayCollection([3, 2, 1]);
    c.setSort(defaultSort);
    c.refresh();

    expect(c.getItemIndex(3)).toBe(2);
  });

  it('should properly handle a filter added later', function() {
    var c = new ArrayCollection([1, 2, 3, 4]);
    c.setFilter(mockFilter);
    expect(c.getFilter()).toBe(mockFilter);
    expect(c.filterChanged_).toBe(true);
    c.refresh();
    expect(c.filterChanged_).toBe(false);

    expect(c.source_.length).toBe(4);
    expect(c.view_.length).toBe(2);
    expect(c.getValues()).toContain(2);
    expect(c.getValues()).toContain(4);
    expect(c.getValues()).toBe(c.view_);
  });

  it('should properly add items with a filter', function() {
    var c = new ArrayCollection();
    c.setFilter(mockFilter);
    c.refresh();

    c.add(1);

    expect(c.source_.length).toBe(1);
    expect(c.view_.length).toBe(0);
    expect(c.getValues().length).toBe(0);

    c.add(2);

    expect(c.source_.length).toBe(2);
    expect(c.view_.length).toBe(1);
    expect(c.getValues()).toContain(2);
  });

  it('should properly remove items with a filter', function() {
    var c = new ArrayCollection([1, 2, 3, 4]);
    c.setFilter(mockFilter);
    c.refresh();

    c.remove(4);

    expect(c.source_.length).toBe(3);
    expect(c.view_.length).toBe(1);

    c.remove(3);
    expect(c.source_.length).toBe(2);
    expect(c.view_.length).toBe(1);
  });

  it('should find the proper index with a filter', function() {
    var c = new ArrayCollection([1, 2, 3, 4]);
    c.setFilter(mockFilter);
    c.refresh();

    expect(c.getItemIndex(2)).toBe(0);
    expect(c.getItemIndex(3)).toBe(-1);
  });

  it('should properly handle both a filter and a sort added later', function() {
    var c = new ArrayCollection([4, 3, 2, 1]);
    c.setSort(defaultSort);
    c.setFilter(mockFilter);
    c.refresh();

    expect(c.source_.length).toBe(4);
    expect(c.view_.length).toBe(2);
    expect(c.getValues().length).toBe(2);
    expect(c.view_[0]).toBe(2);
    expect(c.view_[1]).toBe(4);
  });

  it('should properly handle adding items with both a filter and a sort', function() {
    var c = new ArrayCollection();
    c.setSort(defaultSort);
    c.setFilter(mockFilter);
    c.refresh();

    c.add(3);

    expect(c.source_.length).toBe(1);
    expect(c.view_.length).toBe(0);
    expect(c.getValues().length).toBe(0);

    c.add(2);

    expect(c.source_.length).toBe(2);
    expect(c.view_.length).toBe(1);
    expect(c.getValues().length).toBe(1);
    expect(c.source_[0]).toBe(2);
    expect(c.view_[0]).toBe(2);
  });

  it('should properly handle removing items with both a filter and a sort', function() {
    var c = new ArrayCollection([4, 3, 2, 1]);
    c.setSort(defaultSort);
    c.setFilter(mockFilter);
    c.refresh();

    c.remove(3);
    expect(c.source_.length).toBe(3);
    expect(c.view_.length).toBe(2);
    expect(c.getValues().length).toBe(2);
    expect(c.source_).not.toContain(3);

    c.remove(2);
    expect(c.source_.length).toBe(2);
    expect(c.view_.length).toBe(1);
    expect(c.getValues().length).toBe(1);
    expect(c.source_).not.toContain(2);
    expect(c.view_).not.toContain(2);
  });

  it('should find the proper index with both a filter and a sort', function() {
    var c = new ArrayCollection([4, 3, 2, 1]);
    c.setSort(defaultSort);
    c.setFilter(mockFilter);
    c.refresh();

    expect(c.getItemIndex(2)).toBe(0);
    expect(c.getItemIndex(4)).toBe(1);
    expect(c.getItemIndex(3)).toBeLessThan(0);
  });

  it('should be able to replace data', function() {
    var c = new ArrayCollection([2, 3]);
    c.replace(2, 1);
    expect(c.source_[0]).toBe(1);
  });

  it('should be able to remove by index', function() {
    var c = new ArrayCollection([0, 1, 2, 3]);
    var item = c.removeAt(3);

    expect(item).toBe(3);
    expect(c.getValues()).not.toContain(item);

    c.setFilter(mockFilter);
    c.refresh();

    item = c.removeAt(2);
    expect(item).toBe(null);

    item = c.removeAt(1, true);
    expect(item).toBe(1);
    expect(c.source_).not.toContain(item);

    item = c.removeAt(1);
    expect(item).toBe(2);
    expect(c.getValues()).not.toContain(item);
  });

  it('should clear data', function() {
    var c = new ArrayCollection([4, 3, 2, 1]);
    c.setFilter(mockFilter);
    c.refresh();

    c.clear();

    expect(c.source_.length).toBe(0);
    expect(c.view_.length).toBe(0);

    // and be able to add filtered/nonfiltered after clearing
    c.add(1);
    c.add(2);

    expect(c.source_).toContain(1);
    expect(c.view_).toContain(2);
  });

  it('should send a data change event for each change', function() {
    var c = new ArrayCollection([4, 3, 2, 1]);
    var count = 0;
    var listener = function(e) {
      count++;
    };

    c.listen(EventType.VIEW_DATA_CHANGED, listener);

    c.add(5);
    expect(count).toBe(1);
    c.replace(5, 6);
    expect(count).toBe(2);
    c.remove(6);
    expect(count).toBe(3);
    c.refresh();
    expect(count).toBe(4);
  });

  it('should pool data change events when a delay is set', function() {
    var c = new ArrayCollection([4, 3, 2, 1]);
    var count = 0;
    var listener = function(e) {
      count++;
    };

    c.listen(EventType.VIEW_DATA_CHANGED, listener);
    c.setChangeDelay(20);

    runs(function() {
      c.add(5);
      c.replace(5, 6);
      c.remove(6);
      c.refresh();
    });

    waitsFor(function() {
      return count == 1;
    }, 'event to fire');
  });

  it('does not require refresh when filter set after construction', function() {
    var c = new ArrayCollection();
    c.setFilter(function(item) {
      return typeof item === 'number' && item > 10;
    });
    c.add(1);
    c.add(20);
    expect(c.contains(1)).toBe(false);
    expect(c.contains(20)).toBe(true);
  });

  it('retains the view after setting the filter without calling refresh', function() {
    var c = new ArrayCollection();
    c.setFilter(function(item) {
      return typeof item === 'number' && item > 10;
    });
    c.add(1);
    c.add(20);
    expect(c.getValues()).toEqual([20]);
    c.setFilter(null);
    expect(c.getValues()).toEqual([20]);
    c.refresh();
    expect(c.getValues()).toEqual([1, 20]);
  });
  // TODO: add tests of the basic goog.structs calls
});
