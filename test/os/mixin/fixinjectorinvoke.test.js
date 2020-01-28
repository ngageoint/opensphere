goog.require('os.mixin.fixInjectorInvoke');

describe('fixInjectorInvoke', () => {
  const fixInjectorInvoke = goog.module.get('os.mixin.fixInjectorInvoke');

  let injector;
  beforeEach(() => {
    injector = {
      invoke: () => {}
    };
  });

  it('should pass through arguments to the original invoke function', () => {
    spyOn(injector, 'invoke').andCallThrough();
    const originalInvoke = injector.invoke;

    fixInjectorInvoke(injector);
    injector.invoke(1, 2, 3, 4);

    expect(originalInvoke).toHaveBeenCalledWith(1, 2, 3, 4);
  });

  it('should set $$ngIsClass as a null own property on the function arg', () => {
    fixInjectorInvoke(injector);

    const fn = () => {};
    injector.invoke(fn);

    expect(fn.hasOwnProperty('$$ngIsClass')).toBe(true);
    expect(fn.$$ngIsClass).toBe(null);
  });

  it('should handle fn as the last array arg', () => {
    fixInjectorInvoke(injector);

    const fn = () => {};
    injector.invoke(['something', fn]);

    expect(fn.hasOwnProperty('$$ngIsClass')).toBe(true);
    expect(fn.$$ngIsClass).toBe(null);
  });

  it('should not modify $$ngIsClass if already set as an own property', () => {
    fixInjectorInvoke(injector);

    const fn = () => {};
    fn.$$ngIsClass = false;
    injector.invoke(fn);
    expect(fn.$$ngIsClass).toBe(false);
  });
});
