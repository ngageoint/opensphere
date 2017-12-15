goog.require('os.object');
goog.require('goog.object');

describe('os.object', function() {
  it('should detect primitives correctly', function() {
    expect(os.object.isPrimitive(1)).toBe(true);
    expect(os.object.isPrimitive('yermom')).toBe(true);
    expect(os.object.isPrimitive(NaN)).toBe(true);
    expect(os.object.isPrimitive(true)).toBe(true);
    expect(os.object.isPrimitive([1, 2])).toBe(true);
    expect(os.object.isPrimitive({yermom: 1})).toBe(false);
  });

  var SomeClass = function() {
  };
  SomeClass.prototype.isFavorite = function() {
    return 'maybe';
  };

  it('should merge objects with overwrite', function() {
    var instance1 = new SomeClass();
    var from = {
      nest: {
        val: true,
        count: 10
      },
      notNest: 'someValue',
      oldValue: os.object.DELETE_VAL,
      instance: instance1
    };

    var to = {
      notNest: {some: true},
      oldValue: 'not used'
    };

    os.object.merge(from, to, true);
    expect(to.nest.val).toBe(true);
    expect(to.nest.count).toBe(10);
    expect(to.notNest).toBe('someValue');
    expect(to.oldValue).toBe(undefined);
    expect(to.instance === instance1).toBe(true);
  });

  it('should merge objects without overwrite', function() {
    var from = {
      nest: {
        val: true,
        count: 10
      },
      notNest: 'someValue',
      oldValue: os.object.DELETE_VAL
    };

    var to = {
      notNest: {some: true},
      oldValue: 'not used'
    };

    os.object.merge(from, to, false);
    expect(to.nest.val).toBe(true);
    expect(to.nest.count).toBe(10);
    expect(to.notNest).not.toBe('someValue');
    expect(to.oldValue).toBe('not used');
  });

  it('should assign values to nested keys', function() {
    var abc = {};

    // test assigning a key to a path that doesn't exist
    os.object.set(abc, ['a', 'b', 'c'], 3);
    expect(abc.a).toBeDefined();
    expect(abc.a.b).toBeDefined();
    expect(abc.a.b.c).toBe(3);

    // test assigning muliple keys to the same root path
    os.object.set(abc, ['a', 'b', 'c', 'x'], 'ex');
    os.object.set(abc, ['a', 'b', 'c', 'y'], 'why');
    os.object.set(abc, ['a', 'b', 'c', 'z'], 'zzz');
    expect(abc.a).toBeDefined();
    expect(abc.a.b).toBeDefined();
    expect(abc.a.b.c).toBeDefined();
    expect(abc.a.b.c.x).toBe('ex');
    expect(abc.a.b.c.y).toBe('why');
    expect(abc.a.b.c.z).toBe('zzz');


    // test assignment of falsy values
    os.object.set(abc, ['a', 'b', 'c', 'd'], null);
    expect(abc.a).toBeDefined();
    expect(abc.a.b).toBeDefined();
    expect(abc.a.b.c).toBeDefined();
    expect(abc.a.b.c.d).toBeNull();

    // test unchanged after empty array
    os.object.set(abc, [], 'bogus');
    expect(abc.a).toBeDefined();
    expect(abc.a.b).toBeDefined();
    expect(abc.a.b.c).toBeDefined();
    expect(abc.a.b.c.d).toBeNull();
    expect(abc.a.b.c.x).toBe('ex');
    expect(abc.a.b.c.y).toBe('why');
    expect(abc.a.b.c.z).toBe('zzz');

    // test overwriting a key
    os.object.set(abc, ['a', 'b'], 2);
    expect(abc.a).toBeDefined();
    expect(abc.a.b).toBe(2);
    expect(abc.a.b.c).toBeUndefined();

    os.object.set(abc, ['a'], 'AYE');
    expect(abc.a).toBe('AYE');

    // test assigning as an object
    os.object.set(abc, ['some', 'object', 'path'], { deeply: { nested: 'here' } });
    expect(abc.some.object.path).toBeDefined();
    expect(abc.some.object.path.deeply.nested).toBe('here');

    // test assigning a key as a number
    os.object.set(abc, [1, 2], 'twelve');
    expect(abc[1][2]).toBe('twelve');
  });

  it('should ignore the IGNORE_VAL value during merges', function() {
    var to = {
      ignoreMe: 'please'
    };

    var from = {
      ignoreMe: os.object.IGNORE_VAL,
      other: 2
    };

    os.object.merge(from, to, true);
    expect(to.ignoreMe).toBe('please');
    expect(to.other).toBe(2);
  });

  it('should optionally overwrite with null/undefined', function() {
    var from = {
      nested: {
        field1: null,
        field2: undefined,
        field3: true
      }
    };

    var to = {
      nested: {
        field1: 0,
        field2: false,
        field3: false
      }
    };

    var result = {};
    os.object.merge(to, result);
    os.object.merge(from, result, true);

    expect(result.nested.field1).toBe(null);
    expect(result.nested.field2).toBe(undefined);
    expect(result.nested.field3).toBe(true);

    result = {};
    os.object.merge(to, result);
    os.object.merge(from, result, true, false);

    expect(result.nested.field1).toBe(0);
    expect(result.nested.field2).toBe(false);
    expect(result.nested.field3).toBe(true);
  });

  it('should extract values', function() {
    var objectCtor = function(id, name) {
      this.id_ = this['id'] = id;
      this.name_ = this['name'] = name;

      this.getId = function() {
        return this.id_;
      };

      this.getName = function() {
        return this.name_;
      };
    };

    var items = [
      new objectCtor(0, 'John'),
      new objectCtor(1, 'Delorian'),
      new objectCtor(2, 'JD'),
      new objectCtor(3, 'Bambi')
    ];

    var idAttrExtractor = os.object.getValueExtractor('id');
    var idFunExtractor = os.object.getValueExtractor('getId');
    var nameAttrExtractor = os.object.getValueExtractor('name');
    var nameFunExtractor = os.object.getValueExtractor('getName');

    for (var i = 0, ii = items.length; i < ii; i++) {
      var item = items[i];
      expect(idAttrExtractor(item)).toBe(item['id']);
      expect(idFunExtractor(item)).toBe(item.getId());
      expect(nameAttrExtractor(item)).toBe(item['name']);
      expect(nameFunExtractor(item)).toBe(item.getName());
    }
  });

  it('should get compare field values', function() {
    var TestThing = function(name, age) {
      this['name'] = name;
      this.age_ = age;
    };
    TestThing.prototype.getAge = function() {
      return this.age_;
    };
    TestThing.prototype.alias = function() {
      return this['name'];
    };

    var dog = new TestThing('Rover', 5);
    expect(os.object.getCompareFieldValue_('name', dog)).toBe('Rover');
    expect(os.object.getCompareFieldValue_('age', dog)).toBe(5);
    expect(os.object.getCompareFieldValue_('alias', dog)).toBe('Rover');
    expect(os.object.getCompareFieldValue_('gender', dog)).toBe('');
  });

  it('should compare objects by specified field', function() {
    var TestThing = function(name, age) {
      this['name'] = name;
      this.age_ = age;
    };
    TestThing.prototype.getAge = function() {
      return this.age_;
    };
    TestThing.prototype.alias = function() {
      return this['name'];
    };

    var rover = new TestThing('Rover', 5);
    var fido = new TestThing('Fido', 5);

    expect(os.object.compareByField('name', rover, fido)).toBe(1);
    expect(os.object.compareByField('name', fido, rover)).toBe(-1);

    expect(os.object.compareByField('age', rover, fido)).toBe(0);
    expect(os.object.compareByField('age', fido, rover)).toBe(0);

    expect(os.object.compareByField('alias', rover, fido)).toBe(1);
    expect(os.object.compareByField('alias', fido, rover)).toBe(-1);

    expect(os.object.compareByField('gender', rover, fido)).toBe(0);
    expect(os.object.compareByField('gender', fido, rover)).toBe(0);

    expect(os.object.compareByField('name', null, rover)).toBe(-1);
    expect(os.object.compareByField('name', rover, null)).toBe(1);
    expect(os.object.compareByField('name', null, null)).toBe(0);
  });

  it('should reduce an object to delimited keys and values', function() {
    var result;
    var o = {
      a: 'valueA',
      arr: [1, 2, 3],
      num: 101,
      'null': null,
      'undefined': undefined
    };
    result = os.object.reduce(o);
    expect(result).toBeDefined();
    expect(result['a']).toBe('valueA');
    expect(result['arr'].length).toBe(3);
    expect(result['arr'][0]).toBe(1);
    expect(result['arr'][1]).toBe(2);
    expect(result['arr'][2]).toBe(3);
    expect(result['num']).toBe(101);
    expect(result['null']).toBeNull();
    expect(result['undefined']).toBeUndefined();

    o.oneLevelNest = {
      b: 'valueB',
      c: 'valueC',
      arr: [4, 5, 6],
      num: 102,
      'null': null,
      'undefined': undefined
    };
    result = os.object.reduce(o);
    expect(result).toBeDefined();
    expect(result['a']).toBe('valueA');
    expect(result['oneLevelNest.b']).toBe('valueB');
    expect(result['oneLevelNest.c']).toBe('valueC');
    expect(result['oneLevelNest.arr'].length).toBe(3);
    expect(result['oneLevelNest.arr'][0]).toBe(4);
    expect(result['oneLevelNest.arr'][1]).toBe(5);
    expect(result['oneLevelNest.arr'][2]).toBe(6);
    expect(result['oneLevelNest.num']).toBe(102);
    expect(result['oneLevelNest.null']).toBeNull();
    expect(result['oneLevelNest.undefined']).toBeUndefined();

    o.twoLevelNest = {
      d: 'valueD',
      nested: {
        e: 'valueE',
        arr: [7, 8, 9],
        num: 103,
        'null': null,
        'undefined': undefined
      },
      f: 'valueF'
    };
    result = os.object.reduce(o);
    expect(result).toBeDefined();
    expect(result['a']).toBe('valueA');
    expect(result['oneLevelNest.b']).toBe('valueB');
    expect(result['oneLevelNest.c']).toBe('valueC');
    expect(result['oneLevelNest.arr'].length).toBe(3);
    expect(result['oneLevelNest.arr'][0]).toBe(4);
    expect(result['oneLevelNest.arr'][1]).toBe(5);
    expect(result['oneLevelNest.arr'][2]).toBe(6);
    expect(result['oneLevelNest.num']).toBe(102);
    expect(result['oneLevelNest.null']).toBeNull();
    expect(result['oneLevelNest.undefined']).toBeUndefined();

    expect(result['twoLevelNest.d']).toBe('valueD');
    expect(result['twoLevelNest.nested.e']).toBe('valueE');
    expect(result['twoLevelNest.nested.arr'].length).toBe(3);
    expect(result['twoLevelNest.nested.arr'][0]).toBe(7);
    expect(result['twoLevelNest.nested.arr'][1]).toBe(8);
    expect(result['twoLevelNest.nested.arr'][2]).toBe(9);
    expect(result['twoLevelNest.nested.num']).toBe(103);
    expect(result['twoLevelNest.nested.null']).toBeNull();
    expect(result['twoLevelNest.nested.undefined']).toBeUndefined();
    expect(result['twoLevelNest.f']).toBe('valueF');
  });

  it('should parse values', function() {
    var o = {
      a: '[1, 2, 3]',
      b: '4',
      c: 'null',
      d: '{}',
      e: '"f"'
    };

    os.object.parseValues(o);

    expect(o instanceof Object).toBe(true);
    expect(o.a.length).toBe(3);
    expect(o.a[0]).toBe(1);
    expect(o.a[1]).toBe(2);
    expect(o.a[2]).toBe(3);
    expect(o.b).toBe(4);
    expect(o.c).toBeNull();
    expect(o.d instanceof Object).toBe(true);
    expect(o.e).toBe('f');
  });

  it('should stringify values', function() {
    var o = {
      a: [1, 2, 3],
      b: 4,
      c: null,
      d: {},
      e: 'f'
    };

    os.object.stringifyValues(o);

    expect(o instanceof Object).toBe(true);
    expect(o.a).toBe('[1,2,3]');
    expect(o.b).toBe('4');
    expect(o.c).toBe('null');
    expect(o.d).toBe('{}');
    expect(o.e).toBe('"f"');
  });

  it('should delete', function() {
    var o1 = {
      a: {
        b: {
          c: {
            d: 'd'
          }
        }
      }
    };
    os.object.delete(o1, 'a.b.c.d');
    expect(o1).toBeDefined();
    expect(goog.object.getCount(o1)).toBe(0);

    var o2 = {
      a: {
        b: {
          c: {
            d: 'd',
            e: 'e'
          }
        }
      }
    };
    os.object.delete(o2, 'a.b.c.d');
    expect(o2).toBeDefined();
    expect(o2.a).toBeDefined();
    expect(o2.a.b).toBeDefined();
    expect(o2.a.b.c).toBeDefined();
    expect(o2.a.b.c.d).not.toBeDefined();
    expect(o2.a.b.c.e).toBe('e');

    var o3 = {
      a: {
        b: {
          c: {
            d: 'd',
            e: 'e'
          },
          f: 'f'
        }
      }
    };
    os.object.delete(o3, 'a.b.c');
    expect(o3).toBeDefined();
    expect(o3.a).toBeDefined();
    expect(o3.a.b).toBeDefined();
    expect(o3.a.b.c).not.toBeDefined();
    expect(o3.a.b.f).toBe('f');
  });
});
