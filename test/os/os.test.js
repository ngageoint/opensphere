goog.require('os.mock');
goog.require('os.style.StyleManager');


describe('ol.Feature mixins', function() {
  it('should fire events by default', function() {
    var o = new ol.Object();
    expect(o.eventsEnabled).toBe(true);
    o.suppressEvents();
    expect(o.eventsEnabled).toBe(false);
    o.enableEvents();
    expect(o.eventsEnabled).toBe(true);
  });

  it('should not fire events by default', function() {
    var f = new ol.Feature();
    expect(f.eventsEnabled).toBe(false);
    f.enableEvents();
    expect(f.eventsEnabled).toBe(true);
    f.suppressEvents();
    expect(f.eventsEnabled).toBe(false);
  });

  it('should expose an ID property', function() {
    var f = new ol.Feature();
    f.setId('abc');
    expect(f.id).toBeTruthy();
  });
});

describe('os.sequence', function() {
  it('should call functions 1) in order and 2) with a specified wait in between', function() {
    var count = {
      'f1': 0,
      'f2': 0,
      'f3': 0
    };
    var f1 = function() {
      count['f1']++;
    };
    var f2 = function() {
      count['f2']++;
    };
    var f3 = function() {
      count['f3']++;
    };

    var start = new Date().getTime();
    var step = 10;

    // the call being tested
    os.sequence(null, 'test', step, f1, f2, f3);

    expect(count['f1']).toBe(0);
    expect(count['f2']).toBe(0);
    expect(count['f3']).toBe(0);

    waitsFor('first step to finish', function() {
      if (count['f1']) {
        expect((new Date().getTime()) - start >= (1 * step)).toBe(true);
        expect((new Date().getTime()) - start <= (2 * step)).toBe(true);
        expect(count['f1']).toBe(1);
        expect(count['f2']).toBe(0);
        expect(count['f3']).toBe(0);
        return true;
      }
      return false;
    }, 100);

    waitsFor('second step to finish', function() {
      if (count['f2']) {
        expect((new Date().getTime()) - start >= (2 * step)).toBe(true);
        expect((new Date().getTime()) - start <= (3 * step)).toBe(true);
        expect(count['f1']).toBe(1);
        expect(count['f2']).toBe(1);
        expect(count['f3']).toBe(0);
        return true;
      }
      return false;
    }, 100);

    waitsFor('third step to finish', function() {
      if (count['f3']) {
        expect((new Date().getTime()) - start >= (3 * step)).toBe(true);
        expect((new Date().getTime()) - start <= (4 * step)).toBe(true);
        expect(count['f1']).toBe(1);
        expect(count['f2']).toBe(1);
        expect(count['f3']).toBe(1);
        return true;
      }
      return false;
    }, 100);
  });
});

