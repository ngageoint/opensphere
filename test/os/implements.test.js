goog.require('os.implements');

describe('os.implements', function() {
  var FLYABLE_ID = 'interface.flyable.id';
  var SWIMABLE_ID = 'interface.swimable.id';

  var Plane = function() {};
  var Frisbee = function() {};
  var Duck = function() {};
  var Clock = function() {};

  it('should not fail when passed a primitive or array', function() {
    spyOn(os, 'addImplements_');
    spyOn(os, 'getImplements_');

    expect(os.implements(null, FLYABLE_ID)).toBe(false);
    expect(os.implements(undefined, FLYABLE_ID)).toBe(false);
    expect(os.implements(true, FLYABLE_ID)).toBe(false);
    expect(os.implements(false, FLYABLE_ID)).toBe(false);
    expect(os.implements(42, FLYABLE_ID)).toBe(false);
    expect(os.implements('Penguin', FLYABLE_ID)).toBe(false);
    expect(os.implements([], FLYABLE_ID)).toBe(false);

    expect(os.addImplements_).not.toHaveBeenCalled();
    expect(os.getImplements_).not.toHaveBeenCalled();
  });

  it('should let a class implement an interface', function() {
    expect(os.implements(Plane, FLYABLE_ID)).toBe(true, 'should return true when adding implements');

    var myPlane = new Plane();
    expect(myPlane[os.IMPLEMENTS_KEY]).toBeDefined();
    expect(myPlane[os.IMPLEMENTS_KEY].length).toBe(1);
    expect(myPlane[os.IMPLEMENTS_KEY][0]).toBe(FLYABLE_ID);
    expect(os.implements(myPlane, FLYABLE_ID)).toBe(true);
    expect(os.implements(myPlane, SWIMABLE_ID)).toBe(false);
  });

  it('should let 2 classes implement an interface', function() {
    expect(os.implements(Frisbee, FLYABLE_ID)).toBe(true, 'should return true when adding implements');

    var myPlane = new Plane();
    expect(myPlane[os.IMPLEMENTS_KEY]).toBeDefined();
    expect(myPlane[os.IMPLEMENTS_KEY].length).toBe(1);
    expect(myPlane[os.IMPLEMENTS_KEY][0]).toBe(FLYABLE_ID);

    var myFrisbee = new Frisbee();
    expect(myFrisbee[os.IMPLEMENTS_KEY]).toBeDefined();
    expect(myFrisbee[os.IMPLEMENTS_KEY].length).toBe(1);
    expect(myFrisbee[os.IMPLEMENTS_KEY][0]).toBe(FLYABLE_ID);

    expect(os.implements(myPlane, FLYABLE_ID)).toBe(true);
    expect(os.implements(myPlane, SWIMABLE_ID)).toBe(false);
    expect(os.implements(myFrisbee, FLYABLE_ID)).toBe(true);
    expect(os.implements(myFrisbee, SWIMABLE_ID)).toBe(false);
  });

  it('should let a class implement 2 interfaces', function() {
    expect(os.implements(Duck, FLYABLE_ID)).toBe(true, 'should return true when adding implements');
    expect(os.implements(Duck, SWIMABLE_ID)).toBe(true, 'should return true when adding implements');

    var myDuck = new Duck();
    expect(myDuck[os.IMPLEMENTS_KEY]).toBeDefined();
    expect(myDuck[os.IMPLEMENTS_KEY].length).toBe(2);
    expect(myDuck[os.IMPLEMENTS_KEY].indexOf(FLYABLE_ID) >= 0).toBe(true);
    expect(myDuck[os.IMPLEMENTS_KEY].indexOf(SWIMABLE_ID) >= 0).toBe(true);

    expect(os.implements(myDuck, FLYABLE_ID)).toBe(true);
    expect(os.implements(myDuck, SWIMABLE_ID)).toBe(true);
  });

  it('should let classes not implement an interface', function() {
    var myClock = new Clock();
    expect(os.implements(myClock, FLYABLE_ID)).toBe(false);
    expect(os.implements(myClock, SWIMABLE_ID)).toBe(false);

    var Daffy = function() {};
    goog.inherits(Daffy, Duck);

    var PARENT_ID = 'interface.superTest.parent';
    var CHILD_ID = 'interface.superTest.child';
    os.implements(Daffy, CHILD_ID);
    os.implements(Duck, PARENT_ID);

    expect(os.implements(new Daffy(), PARENT_ID)).toBe(true);
    expect(os.implements(new Daffy(), CHILD_ID)).toBe(true);
    expect(os.implements(new Duck(), PARENT_ID)).toBe(true);
    expect(os.implements(new Duck(), CHILD_ID)).toBe(false);
  });

  it('classes that extend a super class should inherit the superclass implementations', function() {
    var Daffy = function() {};
    goog.inherits(Daffy, Duck);
    expect(os.implements(new Daffy(), FLYABLE_ID)).toBe(true);
  });

  it('subclasses should be able to implement new interfaces', function() {
    var Daffy = function() {};
    var ID = 'interface.silly.id';
    goog.inherits(Daffy, Duck);
    os.implements(Daffy, ID);

    expect(os.implements(new Daffy(), ID)).toBe(true);
    expect(os.implements(new Duck(), ID)).toBe(false);
  });
});
