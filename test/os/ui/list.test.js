goog.require('os.ui.ListCtrl');
goog.require('os.ui.list');
goog.require('os.ui.listDirective');

/**
 * add
 * remove
 * removeList
 * copy
 * get
 * exists
 *
 */

describe('os.ui.list', function() {
  var $scope, element;

  beforeEach(function() {
    if (os.ui.list.map_) {
      os.ui.list.map_.clear();
    }
    doIt();
  });

  it('should add string to the global map and retrieve it', function() {
    const listId = 'js-test-actions';
    os.ui.list.add(listId, 'test-actions-dir');
    const result = os.ui.list.get(listId);
    expect(result).toBeTruthy();
  });

  it('should add the RegExp to the global map and retrieve it', function() {
    const regex = new RegExp('test-actions-*');
    os.ui.list.add(regex, 'test-actions-dir');
    const result = os.ui.list.get(regex);
    expect(result).toBeTruthy();
  });

  it('should match regex list id and add new list to map', inject(function($compile, $rootScope) {
    $scope = $rootScope;

    const regex = new RegExp('test-actions-*');
    os.ui.list.add(regex, 'test-actions-dir');

    const parent = $('<div></div>');
    element = angular.element('<list list-id="test-actions-test1"></list>').appendTo(parent);
    $compile(element)($scope);

    const ctrl = new os.ui.ListCtrl($scope, element, $compile);

    const attr = {
      'listId': 'test-actions-test1'
    };
    os.ui.listLink($scope, null, attr, ctrl);

    const result = os.ui.list.get('test-actions-test1');
    expect(result).toBeTruthy();
    expect(result[0].element).toBeTruthy();
  }));

  it('should add new regex object to same list', function() {
    let regex = new RegExp('test-actions-*');
    os.ui.list.add(regex, 'test-actions-dir');
    regex = new RegExp('test-actions-*');
    os.ui.list.add(regex, 'test-actions-dir2');
    regex = new RegExp('test-actions-*');
    const result = os.ui.list.get(regex);
    expect(result.length).toBe(2);
  });

  it('should remove item from list based on regex', function() {
    let regex = new RegExp('test-actions-*');
    os.ui.list.add(regex, 'test-actions-dir');
    os.ui.list.add(regex, 'test-actions-dir2');
    let result = os.ui.list.get(regex);
    expect(result.length).toBe(2);
    regex = new RegExp('test-actions-*');
    os.ui.list.remove(regex, 'test-actions-dir');
    result = os.ui.list.get(regex);
    expect(result.length).toBe(1);
  });

  it('should remove list based on regex', function() {
    let regex = new RegExp('test-actions-*');
    os.ui.list.add(regex, 'test-actions-dir');
    os.ui.list.add(regex, 'test-actions-dir2');
    let result = os.ui.list.get(regex);
    expect(result.length).toBe(2);
    regex = new RegExp('test-actions-*');
    os.ui.list.removeList(regex);
    result = os.ui.list.get(regex);
    expect(result).toBe(null);
  });

  it('should copy regex list regex to regex list', function() {
    const regex1 = new RegExp('test-actions-*');
    os.ui.list.add(regex1, 'test-actions-dir');
    os.ui.list.add(regex1, 'test-actions-dir2');
    os.ui.list.add(regex1, 'test-actions-dir3');
    const regex2 = new RegExp('more-test-actions-*');
    os.ui.list.copy(regex1, regex2);
    let result = os.ui.list.get(regex2);
    expect(result.length).toBe(3);
  });

  it('should copy regex list regex to string list', function() {
    const regex1 = new RegExp('test-actions-*');
    os.ui.list.add(regex1, 'test-actions-dir');
    os.ui.list.add(regex1, 'test-actions-dir2');
    os.ui.list.add(regex1, 'test-actions-dir3');
    const listId = 'test-actions-12345';
    os.ui.list.copy(regex1, listId);
    let result = os.ui.list.get(listId);
    expect(result.length).toBe(3);
  });

  it('should test if markup exists in regex list', function() {
    const regex = new RegExp('test-actions-*');
    os.ui.list.add(regex, 'test-actions-dir');
    os.ui.list.add(regex, 'test-actions-dir2');
    os.ui.list.add(regex, 'test-actions-dir3');
    let result = os.ui.list.exists(regex, 'test-actions-dir2');
    expect(result).toBe(true);
    result = os.ui.list.exists(regex, 'bogus-dir');
    expect(result).toBe(false);
  });

  function doIt() {
    console.log('do it');
  }
});
