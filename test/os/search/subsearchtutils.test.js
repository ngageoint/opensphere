goog.require('os.search.SearchFacetDepartment');
goog.require('os.search.SubSearchUtils');


describe('os.search.SubSearchUtils', function() {
  it ('removes a path and it\'s children from list', () => {
    let list = [['a', 'b'], ['a', 'b', 'c'], ['d']];
    let arr = ['a', 'b'];
    os.search.SubSearchUtils.removeList(list, arr);
    expect(JSON.stringify(list)).toBe('[["d"]]');

    list = [['a', 'b'], ['a', 'b', 'c'], ['d']];
    arr = ['a', 'b', 'c'];
    os.search.SubSearchUtils.removeList(list, arr);
    expect(JSON.stringify(list)).toBe('[["a","b"],["d"]]');

    list = [['a', 'b'], ['a', 'b', 'c'], ['d']];
    arr = ['d'];
    os.search.SubSearchUtils.removeList(list, arr);
    expect(JSON.stringify(list)).toBe('[["a","b"],["a","b","c"]]');

    list = [['a', 'b'], ['a', 'b', 'c'], ['d']];
    arr = ['z'];
    os.search.SubSearchUtils.removeList(list, arr);
    expect(JSON.stringify(list)).toBe('[["a","b"],["a","b","c"],["d"]]');
  });

  it ('can tell if a list is a subset of another list', () => {
    let listA = [['a', 'b'], ['a', 'b', 'c'], ['d']];
    let listB = [['a', 'b'], ['a', 'b', 'c']];
    expect(os.search.SubSearchUtils.subsetOfList(listA, listB)).toBe(true);

    listA = [['a', 'b'], ['a', 'b', 'c'], ['d']];
    listB = [['a', 'b']];
    expect(os.search.SubSearchUtils.subsetOfList(listA, listB)).toBe(true);

    listA = [['a', 'b'], ['a', 'b', 'c'], ['d']];
    listB = [['a', 'b', 'c', 'd']];
    expect(os.search.SubSearchUtils.subsetOfList(listA, listB)).toBe(false);

    listA = [['a', 'b'], ['a', 'b', 'c'], ['d']];
    listB = [['a', 'b', 'c'], ['d']];
    expect(os.search.SubSearchUtils.subsetOfList(listA, listB)).toBe(true);

    listA = [['a', 'b'], ['a', 'b', 'c'], ['d']];
    listB = [];
    expect(os.search.SubSearchUtils.subsetOfList(listA, listB)).toBe(true);

    listA = [['a', 'b'], ['a', 'b', 'c'], ['d']];
    listB = [['a', 'b'], ['a', 'b', 'c'], ['d'], ['e', 'f']];
    expect(os.search.SubSearchUtils.subsetOfList(listA, listB)).toBe(false);
  });

  it ('can tell if a department is disabled by default', () => {
    let defDisabled = [['exercise', 'a'], ['exercise', 'b']];
    let dep = ['exercise'];
    expect(os.search.SubSearchUtils.isDefaultDisabled(defDisabled, dep)).toBe(false);

    defDisabled = [['exercise', 'a'], ['exercise', 'b']];
    dep = ['exercise', 'b'];
    expect(os.search.SubSearchUtils.isDefaultDisabled(defDisabled, dep)).toBe(true);

    defDisabled = [['exercise', 'a'], ['exercise', 'b']];
    dep = ['a'];
    expect(os.search.SubSearchUtils.isDefaultDisabled(defDisabled, dep)).toBe(false);
  });

  it ('can tell if a search facet department is a sub search', () => {
    /**
     * @type {os.search.SearchFacetDepartment}
     */
    const child1 = {
      id: 'c',
      name: 'csearch',
      path: ['a', 'b', 'c'],
      children: []
    };

    /**
     * @type {os.search.SearchFacetDepartment}
     */
    const child2 = {
      id: 'd',
      name: 'dsearch',
      path: ['a', 'b', 'd'],
      children: []
    };

    /**
     * @type {os.search.SearchFacetDepartment}
     */
    const subcat = {
      id: 'b',
      name: 'bsearch',
      path: ['a', 'b'],
      children: [child1, child2]
    };

    /**
     * @type {os.search.SearchFacetDepartment}
     */
    const root = {
      id: 'a',
      name: 'asearch',
      path: ['a'],
      children: [subcat]
    };

    /**
     * @type {os.search.SearchFacetDepartment}
     */
    const other = {
      id: 'other',
      name: 'othersearch',
      path: ['other'],
      children: []
    };

    const registeredSubSearches = [
      ['a', 'b', 'c'], ['a', 'b', 'd']
    ];

    expect(os.search.SubSearchUtils.isSubSearch(root, registeredSubSearches)).toBe(true);
    expect(os.search.SubSearchUtils.isSubSearch(subcat, registeredSubSearches)).toBe(true);
    expect(os.search.SubSearchUtils.isSubSearch(child1, registeredSubSearches)).toBe(true);
    expect(os.search.SubSearchUtils.isSubSearch(child2, registeredSubSearches)).toBe(true);
    expect(os.search.SubSearchUtils.isSubSearch(other, registeredSubSearches)).toBe(false);
  });
});
