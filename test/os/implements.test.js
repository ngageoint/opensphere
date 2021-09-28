goog.require('os.implements');

describe('os.implements', function() {
  const {default: osImplements} = goog.module.get('os.implements');

  var FLYABLE_ID = 'interface.flyable.id';
  var SWIMABLE_ID = 'interface.swimable.id';

  var Plane = function() {};
  var Frisbee = function() {};
  var Duck = function() {};
  var Clock = function() {};

  it('should not fail when passed a primitive or array', function() {
    spyOn(osImplements, 'addImplements');
    spyOn(osImplements, 'getImplements');

    expect(osImplements(null, FLYABLE_ID)).toBe(false);
    expect(osImplements(undefined, FLYABLE_ID)).toBe(false);
    expect(osImplements(true, FLYABLE_ID)).toBe(false);
    expect(osImplements(false, FLYABLE_ID)).toBe(false);
    expect(osImplements(42, FLYABLE_ID)).toBe(false);
    expect(osImplements('Penguin', FLYABLE_ID)).toBe(false);
    expect(osImplements([], FLYABLE_ID)).toBe(false);

    expect(osImplements.addImplements).not.toHaveBeenCalled();
    expect(osImplements.getImplements).not.toHaveBeenCalled();
  });

  it('should let a class implement an interface', function() {
    expect(osImplements(Plane, FLYABLE_ID)).toBe(true, 'should return true when adding implements');

    var myPlane = new Plane();
    expect(myPlane[osImplements.IMPLEMENTS_KEY]).toBeDefined();
    expect(myPlane[osImplements.IMPLEMENTS_KEY].length).toBe(1);
    expect(myPlane[osImplements.IMPLEMENTS_KEY][0]).toBe(FLYABLE_ID);
    expect(osImplements(myPlane, FLYABLE_ID)).toBe(true);
    expect(osImplements(myPlane, SWIMABLE_ID)).toBe(false);
  });

  it('should let 2 classes implement an interface', function() {
    expect(osImplements(Frisbee, FLYABLE_ID)).toBe(true, 'should return true when adding implements');

    var myPlane = new Plane();
    expect(myPlane[osImplements.IMPLEMENTS_KEY]).toBeDefined();
    expect(myPlane[osImplements.IMPLEMENTS_KEY].length).toBe(1);
    expect(myPlane[osImplements.IMPLEMENTS_KEY][0]).toBe(FLYABLE_ID);

    var myFrisbee = new Frisbee();
    expect(myFrisbee[osImplements.IMPLEMENTS_KEY]).toBeDefined();
    expect(myFrisbee[osImplements.IMPLEMENTS_KEY].length).toBe(1);
    expect(myFrisbee[osImplements.IMPLEMENTS_KEY][0]).toBe(FLYABLE_ID);

    expect(osImplements(myPlane, FLYABLE_ID)).toBe(true);
    expect(osImplements(myPlane, SWIMABLE_ID)).toBe(false);
    expect(osImplements(myFrisbee, FLYABLE_ID)).toBe(true);
    expect(osImplements(myFrisbee, SWIMABLE_ID)).toBe(false);
  });

  it('should let a class implement 2 interfaces', function() {
    expect(osImplements(Duck, FLYABLE_ID)).toBe(true, 'should return true when adding implements');
    expect(osImplements(Duck, SWIMABLE_ID)).toBe(true, 'should return true when adding implements');

    var myDuck = new Duck();
    expect(myDuck[osImplements.IMPLEMENTS_KEY]).toBeDefined();
    expect(myDuck[osImplements.IMPLEMENTS_KEY].length).toBe(2);
    expect(myDuck[osImplements.IMPLEMENTS_KEY].indexOf(FLYABLE_ID) >= 0).toBe(true);
    expect(myDuck[osImplements.IMPLEMENTS_KEY].indexOf(SWIMABLE_ID) >= 0).toBe(true);

    expect(osImplements(myDuck, FLYABLE_ID)).toBe(true);
    expect(osImplements(myDuck, SWIMABLE_ID)).toBe(true);
  });

  it('should let classes not implement an interface', function() {
    var myClock = new Clock();
    expect(osImplements(myClock, FLYABLE_ID)).toBe(false);
    expect(osImplements(myClock, SWIMABLE_ID)).toBe(false);

    var Daffy = function() {};
    goog.inherits(Daffy, Duck);

    var PARENT_ID = 'interface.superTest.parent';
    var CHILD_ID = 'interface.superTest.child';
    osImplements(Daffy, CHILD_ID);
    osImplements(Duck, PARENT_ID);

    expect(osImplements(new Daffy(), PARENT_ID)).toBe(true);
    expect(osImplements(new Daffy(), CHILD_ID)).toBe(true);
    expect(osImplements(new Duck(), PARENT_ID)).toBe(true);
    expect(osImplements(new Duck(), CHILD_ID)).toBe(false);
  });

  it('classes that extend a super class should inherit the superclass implementations', function() {
    var Daffy = function() {};
    goog.inherits(Daffy, Duck);
    expect(osImplements(new Daffy(), FLYABLE_ID)).toBe(true);
  });

  it('subclasses should be able to implement new interfaces', function() {
    var Daffy = function() {};
    var ID = 'interface.silly.id';
    goog.inherits(Daffy, Duck);
    osImplements(Daffy, ID);

    expect(osImplements(new Daffy(), ID)).toBe(true);
    expect(osImplements(new Duck(), ID)).toBe(false);
  });
});
