goog.require('os.ui.datetime.StartEndDateCtrl');


describe('os.ui.datetime.StartEndDateCtrl', function() {
  it('should compare two dates', inject(function($rootScope) {
    var ctrl = new os.ui.datetime.StartEndDateCtrl($rootScope.$new());
    expect(ctrl.equals(null, null)).toBe(true);
    expect(ctrl.equals(null, undefined)).toBe(true);
    expect(ctrl.equals(null, '')).toBe(true);
    expect(ctrl.equals(undefined, null)).toBe(true);
    expect(ctrl.equals(undefined, undefined)).toBe(true);
    expect(ctrl.equals(undefined, '')).toBe(true);
    expect(ctrl.equals('', null)).toBe(true);
    expect(ctrl.equals('', undefined)).toBe(true);
    expect(ctrl.equals('', '')).toBe(true);
    expect(ctrl.equals(new Date(null), null)).toBe(false);
    expect(ctrl.equals(new Date(undefined), undefined)).toBe(false);
    expect(ctrl.equals(new Date(''), '')).toBe(false);

    var now = Date.now();
    var a = new Date(now);
    var b = new Date(now);
    var other = now - 1000;
    expect(ctrl.equals(a, b)).toBe(true);
    expect(ctrl.equals(a, a)).toBe(true);
    expect(ctrl.equals(b, b)).toBe(true);
    expect(ctrl.equals(new Date(other), a)).toBe(false);
    expect(ctrl.equals(new Date(other), b)).toBe(false);
  }));
});
