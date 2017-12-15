goog.require('os.array');


describe('os.array', function() {
  it('should return indexes for a binary insert', function() {
    var list = [2, 4, 6, 8];
    var values = [
      {value: 5, index: 2},
      {value: 1, index: 0},
      {value: 6, index: -1},
      {value: 3, index: 2},
      {value: 9, index: 7}];

    values.forEach(function(item) {
      expect(os.array.binaryInsert(list, item.value)).toBe(item.index);
    });
  });

  it('should handle for each on a falsey array', function() {
    var things = [undefined, null];

    things.forEach(function(arg) {
      expect(os.array.forEachSafe.bind(null, arg)).not.toThrow();
    });
  });

  it('should handle for each on an array', function() {
    var list = [1, 1, 2, 3, 5, 8];

    var sum = 0;
    os.array.forEachSafe(list, function(num) {
      sum += num;
    });

    expect(sum).toBe(20);
  });

  it('should copy from a source to a destination array', function() {
    var dest = [];
    var src = [];

    for (var i = 0; i < 10; i++) {
      dest[i] = i;
      src[i] = i;
    }

    var srcStart = 2;
    var destStart = 8;
    var length = 3;
    os.array.arrayCopy(src, srcStart, dest, destStart, length);

    for (var i = 0, n = dest.length; i < n; i++) {
      if (i < destStart || i >= destStart + length) {
        expect(dest[i]).toBe(i);
      } else {
        expect(dest[i]).toBe(src[srcStart + i - destStart]);
      }
    }
  });

  it('should find duplicates in an array', function() {
    var thing = {thing: true};
    var list = [0, 0, false, '', null, undefined, 1, true, 2, 2, 2, 3, 4, '4',
      'yay', 'yay', null, null, undefined, undefined, thing, {thing: true}, thing];
    var dupes = os.array.findDuplicates(list);

    expect(dupes.length).toBe(9);
    expect(dupes[0]).toBe(0);
    expect(dupes[1]).toBe(2);
    expect(dupes[2]).toBe(2);
    expect(dupes[3]).toBe('yay');
    expect(dupes[4]).toBe(null);
    expect(dupes[5]).toBe(null);
    expect(dupes[6]).toBe(undefined);
    expect(dupes[7]).toBe(undefined);
    expect(dupes[8]).toBe(thing);
  });

  it('should sort arrays by an object field', function() {
    var a = {
      'num': 1,
      'str': 'test1'
    };

    var b = {
      'num': 2,
      'str': 'test2'
    };

    var arr = [a, b];
    var sorted = arr.sort(goog.partial(os.array.sortByField, 'num'));
    expect(goog.array.equals(sorted, [a, b])).toBeTruthy();

    sorted = arr.sort(goog.partial(os.array.sortByFieldDesc, 'num'));
    expect(goog.array.equals(sorted, [b, a])).toBeTruthy();

    sorted = arr.sort(goog.partial(os.array.sortByField, 'str'));
    expect(goog.array.equals(sorted, [a, b])).toBeTruthy();

    sorted = arr.sort(goog.partial(os.array.sortByFieldDesc, 'str'));
    expect(goog.array.equals(sorted, [b, a])).toBeTruthy();
  });

  describe('os.array.join', function() {
    var copyFunc = function(a, b) {
      // destructive shallow copy
      for (var key in a) {
        b[key] = a[key];
      }

      return b;
    };

    var indexer = function(item) {
      return item.id;
    };

    var sortByName = function(a, b) {
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    };

    var joinFuncs = [os.array.join];

    it('should join 2 sets', function() {
      for (var j = 0, jj = joinFuncs.length; j < jj; j++) {
        var sets = [{
          data: [
            {id: 'A', name: 'Will'},
            {id: 'yermom', name: 'Jessica'},
            {id: 2, name: 'Brian'},
            {id: 'nope', name: 'Kevin'}
          ],
          indexer: indexer,
          crossProduct: true
        }, {
          data: [
            {id: 'A', fave: 'blue'},
            {id: 'yermom', fave: 'green'},
            {id: 2, fave: 'red', name: 'Red Brian'}
          ],
          indexer: indexer,
          crossProduct: false
        }];

        var expected = [
          {id: 'A', name: 'Will', fave: 'blue'},
          {id: 'yermom', name: 'Jessica', fave: 'green'},
          {id: 2, name: 'Red Brian', fave: 'red'},
          {id: 'nope', name: 'Kevin'}
        ];

        var result = joinFuncs[j](sets, copyFunc);
        expected.sort(sortByName);
        result.sort(sortByName);

        expect(result.length).toBe(expected.length);

        for (var i = 0, n = expected.length; i < n; i++) {
          var ex = expected[i];
          for (var key in ex) {
            expect(result[i][key]).toBe(ex[key]);
          }
        }
      }
    });

    it('should join 3 sets', function() {
      for (var j = 0, jj = joinFuncs.length; j < jj; j++) {
        var sets = [{
          data: [
            {id: 'A', name: 'Will'},
            {id: 'yermom', name: 'Jessica'},
            {id: 2, name: 'Brian'},
            {id: 'nope', name: 'Kevin'}
          ],
          indexer: indexer,
          crossProduct: true
        }, {
          data: [
            {id: 'A', fave: 'blue'},
            {id: 'yermom', fave: 'green'},
            {id: 2, fave: 'red', name: 'Red Brian'},
            {id: undefined, fave: 'orange', name: 'nobody'},
            {id: null, fave: 'fuschia', name: 'nobody'}
          ],
          indexer: indexer,
          crossProduct: false
        }, {
          data: [
            {id: 'A', tacos: 'yes'},
            {id: 'yermom', tacos: 'no'},
            {id: 2, tacos: 'perhaps'},
            {id: 'unique', tacos: 'nope'}
          ],
          indexer: indexer,
          crossProduct: false
        }];

        var expected = [
          {id: 'A', name: 'Will', fave: 'blue', tacos: 'yes'},
          {id: 'yermom', name: 'Jessica', fave: 'green', tacos: 'no'},
          {id: 2, name: 'Red Brian', fave: 'red', tacos: 'perhaps'},
          {id: 'nope', name: 'Kevin'}
        ];

        var result = joinFuncs[j](sets, copyFunc);
        expected.sort(sortByName);
        result.sort(sortByName);

        expect(result.length).toBe(expected.length);

        for (var i = 0, n = expected.length; i < n; i++) {
          var ex = expected[i];
          for (var key in ex) {
            expect(result[i][key]).toBe(ex[key]);
          }
        }
      }
    });

    it('should join edge case 1', function() {
      for (var j = 0, jj = joinFuncs.length; j < jj; j++) {
        // the second set is completely disjoint and before the first
        var sets = [{
          data: [
            {id: 5, name: 'Will'},
            {id: 6, name: 'Jessica'},
            {id: 7, name: 'Brian'}
          ],
          indexer: indexer,
          crossProduct: true
        }, {
          data: [
            {id: 1, fave: 'blue'},
            {id: 2, fave: 'green'},
            {id: 3, fave: 'red'}
          ],
          indexer: indexer,
          crossProduct: false
        }, {
          data: [
            {id: 1, tacos: 'yes'},
            {id: 2, tacos: 'no'},
            {id: 5, tacos: 'perhaps'}
          ],
          indexer: indexer,
          crossProduct: false
        }];

        var expected = [
          {id: 5, name: 'Will', tacos: 'perhaps'},
          {id: 6, name: 'Jessica'},
          {id: 7, name: 'Brian'}
        ];

        var result = joinFuncs[j](sets, copyFunc);
        expected.sort(sortByName);
        result.sort(sortByName);

        expect(result.length).toBe(expected.length);

        for (var i = 0, n = expected.length; i < n; i++) {
          var ex = expected[i];
          for (var key in ex) {
            expect(result[i][key]).toBe(ex[key]);
          }
        }
      }
    });

    it('should join edge case 2', function() {
      for (var j = 0, jj = joinFuncs.length; j < jj; j++) {
        // the second set is completely disjoint and ahead of the first
        var sets = [{
          data: [
            {id: 1, name: 'Will'},
            {id: 2, name: 'Jessica'},
            {id: 3, name: 'Brian'}
          ],
          indexer: indexer,
          crossProduct: true
        }, {
          data: [
            {id: 5, fave: 'blue'},
            {id: 6, fave: 'green'},
            {id: 7, fave: 'red'}
          ],
          indexer: indexer,
          crossProduct: false
        }, {
          data: [
            {id: 1, tacos: 'yes'},
            {id: 2, tacos: 'no'},
            {id: 5, tacos: 'perhaps'}
          ],
          indexer: indexer,
          crossProduct: false
        }];

        var expected = [
          {id: 1, name: 'Will', tacos: 'yes'},
          {id: 2, name: 'Jessica', tacos: 'no'},
          {id: 3, name: 'Brian'}
        ];

        var result = joinFuncs[j](sets, copyFunc);
        expected.sort(sortByName);
        result.sort(sortByName);

        expect(result.length).toBe(expected.length);

        for (var i = 0, n = expected.length; i < n; i++) {
          var ex = expected[i];
          for (var key in ex) {
            expect(result[i][key]).toBe(ex[key]);
          }
        }
      }
    });

    it('should handle noop joins that could cause infinite loops', function() {
      for (var j = 0, jj = joinFuncs.length; j < jj; j++) {
        // the base set keys don't match any of the other join sets
        var sets = [{
          data: [
            {id: 1, name: 'Will'},
            {id: 2, name: 'Jessica'},
            {id: 3, name: 'Brian'}
          ],
          indexer: indexer,
          crossProduct: true
        }, {
          data: [
            {id: 5, fave: 'blue'},
            {id: 6, fave: 'green'},
            {id: 7, fave: 'red'}
          ],
          indexer: indexer,
          crossProduct: false
        }, {
          data: [
            {id: 8, tacos: 'yes'},
            {id: 9, tacos: 'no'},
            {id: 10, tacos: 'perhaps'}
          ],
          indexer: indexer,
          crossProduct: false
        }];

        var expected = [
          {id: 1, name: 'Will'},
          {id: 2, name: 'Jessica'},
          {id: 3, name: 'Brian'}
        ];

        var result = joinFuncs[j](sets, copyFunc);
        expected.sort(sortByName);
        result.sort(sortByName);

        expect(result.length).toBe(expected.length);

        for (var i = 0, n = expected.length; i < n; i++) {
          var ex = expected[i];
          for (var key in ex) {
            expect(result[i][key]).toBe(ex[key]);
          }
        }
      }
    });

    it('should handle noop joins that could cause infinite loops in the other direction', function() {
      for (var j = 0, jj = joinFuncs.length; j < jj; j++) {
        // the base set keys don't match any of the other join sets and are all greater than the other keys
        var sets = [{
          data: [
            {id: 10, name: 'Will'},
            {id: 20, name: 'Jessica'},
            {id: 30, name: 'Brian'}
          ],
          indexer: indexer,
          crossProduct: true
        }, {
          data: [
            {id: 5, fave: 'blue'},
            {id: 6, fave: 'green'},
            {id: 7, fave: 'red'}
          ],
          indexer: indexer,
          crossProduct: false
        }, {
          data: [
            {id: 8, tacos: 'yes'},
            {id: 9, tacos: 'no'},
            {id: 10, tacos: 'perhaps'}
          ],
          indexer: indexer,
          crossProduct: false
        }];

        var expected = [
          {id: 10, name: 'Will'},
          {id: 20, name: 'Jessica'},
          {id: 30, name: 'Brian'}
        ];

        var result = joinFuncs[j](sets, copyFunc);
        expected.sort(sortByName);
        result.sort(sortByName);

        expect(result.length).toBe(expected.length);

        for (var i = 0, n = expected.length; i < n; i++) {
          var ex = expected[i];
          for (var key in ex) {
            expect(result[i][key]).toBe(ex[key]);
          }
        }
      }
    });

    xit('should handle null/undefined keys correctly', function() {
      for (var j = 0, jj = joinFuncs.length; j < jj; j++) {
        // the base set keys don't match any of the other join sets and are all greater than the other keys
        var sets = [{
          data: [
            {id: undefined, name: 'Will'},
            {id: null, name: 'Jessica'},
            {id: '', name: 'Jeremy'},
            {id: 1, name: 'Brian'}
          ],
          indexer: indexer,
          crossProduct: true
        }, {
          data: [
            {id: 5, fave: 'blue'},
            {id: 6, fave: 'green'},
            {id: 7, fave: 'red'}
          ],
          indexer: indexer,
          crossProduct: false
        }, {
          data: [
            {id: 8, tacos: 'yes'},
            {id: 9, tacos: 'no'},
            {id: 10, tacos: 'perhaps'}
          ],
          indexer: indexer,
          crossProduct: false
        }];

        var expected = [
          {id: 10, name: 'Will'},
          {id: 20, name: 'Jessica'},
          {id: 30, name: 'Brian'}
        ];

        var result = joinFuncs[j](sets, copyFunc);
        expected.sort(sortByName);
        result.sort(sortByName);

        expect(result.length).toBe(expected.length);

        for (var i = 0, n = expected.length; i < n; i++) {
          var ex = expected[i];
          for (var key in ex) {
            expect(result[i][key]).toBe(ex[key]);
          }
        }
      }
    });

    it('should throw an error if multiple data sets have crossProduct=true', function() {
      var sets = [{
        data: [1, 2, 3],
        indexer: indexer,
        crossProduct: true
      }, {
        data: [3, 4, 5],
        indexer: indexer,
        crossProduct: false
      }, {
        data: [5, 6, 7],
        indexer: indexer,
        crossProduct: true
      }];

      expect(os.array.join.bind(null, sets, copyFunc)).toThrow();
    });

    it('should binary search arrays with a stride', function() {
      // sorted small numbers at offset 0, sorted large numbers at offset 1
      var arr = [2, 200, 4, 400, 6, 600, 8, 800];
      var stride = 2;

      // offset 0 values

      // values at the front of the array
      expect(os.array.binaryStrideSearch(arr, -10, stride, 0)).toBe(~0);

      // values at the end of the array
      expect(os.array.binaryStrideSearch(arr, 20, stride, 0)).toBe(~arr.length);

      // values in the middle of the array
      expect(os.array.binaryStrideSearch(arr, 3, stride, 0)).toBe(~2);
      expect(os.array.binaryStrideSearch(arr, 5, stride, 0)).toBe(~4);
      expect(os.array.binaryStrideSearch(arr, 7, stride, 0)).toBe(~6);

      // values in the array on the offset
      expect(os.array.binaryStrideSearch(arr, 2, stride, 0)).toBe(0);
      expect(os.array.binaryStrideSearch(arr, 4, stride, 0)).toBe(2);
      expect(os.array.binaryStrideSearch(arr, 6, stride, 0)).toBe(4);
      expect(os.array.binaryStrideSearch(arr, 8, stride, 0)).toBe(6);

      // values in the array not on the offset
      expect(os.array.binaryStrideSearch(arr, 200, stride, 0)).toBe(~arr.length);
      expect(os.array.binaryStrideSearch(arr, 400, stride, 0)).toBe(~arr.length);
      expect(os.array.binaryStrideSearch(arr, 600, stride, 0)).toBe(~arr.length);

      // offset 1 values

      // values at the front of the array
      expect(os.array.binaryStrideSearch(arr, 0, stride, 1)).toBe(~0);

      // values at the end of the array
      expect(os.array.binaryStrideSearch(arr, 1000, stride, 0)).toBe(~arr.length);

      // values in the middle of the array
      expect(os.array.binaryStrideSearch(arr, 300, stride, 1)).toBe(~2);
      expect(os.array.binaryStrideSearch(arr, 500, stride, 1)).toBe(~4);
      expect(os.array.binaryStrideSearch(arr, 700, stride, 1)).toBe(~6);

      // values in the array on the offset
      expect(os.array.binaryStrideSearch(arr, 200, stride, 1)).toBe(0);
      expect(os.array.binaryStrideSearch(arr, 400, stride, 1)).toBe(2);
      expect(os.array.binaryStrideSearch(arr, 600, stride, 1)).toBe(4);
      expect(os.array.binaryStrideSearch(arr, 800, stride, 1)).toBe(6);

      // values in the array not on the offset
      expect(os.array.binaryStrideSearch(arr, 2, stride, 1)).toBe(~0);
      expect(os.array.binaryStrideSearch(arr, 4, stride, 1)).toBe(~0);
      expect(os.array.binaryStrideSearch(arr, 6, stride, 1)).toBe(~0);

      // odd sized array
      arr.push(10);
      arr.push(1000);

      // offset 0 values

      // values at the front of the array
      expect(os.array.binaryStrideSearch(arr, -10, stride, 0)).toBe(~0);

      // values at the end of the array
      expect(os.array.binaryStrideSearch(arr, 20, stride, 0)).toBe(~arr.length);

      // values in the middle of the array
      expect(os.array.binaryStrideSearch(arr, 3, stride, 0)).toBe(~2);
      expect(os.array.binaryStrideSearch(arr, 5, stride, 0)).toBe(~4);
      expect(os.array.binaryStrideSearch(arr, 7, stride, 0)).toBe(~6);
      expect(os.array.binaryStrideSearch(arr, 9, stride, 0)).toBe(~8);

      // values in the array on the offset
      expect(os.array.binaryStrideSearch(arr, 2, stride, 0)).toBe(0);
      expect(os.array.binaryStrideSearch(arr, 4, stride, 0)).toBe(2);
      expect(os.array.binaryStrideSearch(arr, 6, stride, 0)).toBe(4);
      expect(os.array.binaryStrideSearch(arr, 8, stride, 0)).toBe(6);
      expect(os.array.binaryStrideSearch(arr, 10, stride, 0)).toBe(8);

      // values in the array not on the offset
      expect(os.array.binaryStrideSearch(arr, 200, stride, 0)).toBe(~arr.length);
      expect(os.array.binaryStrideSearch(arr, 400, stride, 0)).toBe(~arr.length);
      expect(os.array.binaryStrideSearch(arr, 600, stride, 0)).toBe(~arr.length);

      // offset 1 values

      // values at the front of the array
      expect(os.array.binaryStrideSearch(arr, 0, stride, 1)).toBe(~0);

      // values at the end of the array
      expect(os.array.binaryStrideSearch(arr, 1001, stride, 0)).toBe(~arr.length);

      // values in the middle of the array
      expect(os.array.binaryStrideSearch(arr, 300, stride, 1)).toBe(~2);
      expect(os.array.binaryStrideSearch(arr, 500, stride, 1)).toBe(~4);
      expect(os.array.binaryStrideSearch(arr, 700, stride, 1)).toBe(~6);
      expect(os.array.binaryStrideSearch(arr, 900, stride, 1)).toBe(~8);

      // values in the array on the offset
      expect(os.array.binaryStrideSearch(arr, 200, stride, 1)).toBe(0);
      expect(os.array.binaryStrideSearch(arr, 400, stride, 1)).toBe(2);
      expect(os.array.binaryStrideSearch(arr, 600, stride, 1)).toBe(4);
      expect(os.array.binaryStrideSearch(arr, 800, stride, 1)).toBe(6);
      expect(os.array.binaryStrideSearch(arr, 1000, stride, 1)).toBe(8);

      // values in the array not on the offset
      expect(os.array.binaryStrideSearch(arr, 2, stride, 1)).toBe(~0);
      expect(os.array.binaryStrideSearch(arr, 4, stride, 1)).toBe(~0);
      expect(os.array.binaryStrideSearch(arr, 6, stride, 1)).toBe(~0);
    });

    it('should throw an error if multiple data sets have crossProduct=true', function() {
      var sets = [{
        data: [1, 2, 3],
        indexer: indexer,
        crossProduct: true
      }, {
        data: [3, 4, 5],
        indexer: indexer,
        crossProduct: false
      }, {
        data: [5, 6, 7],
        indexer: indexer,
        crossProduct: true
      }];

      expect(os.array.join.bind(null, sets, copyFunc)).toThrow();
    });
  });
});
