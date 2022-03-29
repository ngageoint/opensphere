goog.require('os.ui.SettingsButtonUI');

describe('os.ui.SettingsButtonUI', () => {
  let controller;
  let element;
  let scope;

  // Load the Angular module
  beforeEach(angular.mock.module('app'));

  beforeEach(inject(($compile, $rootScope) => {
    scope = $rootScope.$new(true);
    element = angular.element(`<settings-button></settings-button>`);
    $compile(element)(scope);
    scope.$apply();

    controller = element.controller('settings-button');
  }));

  afterEach(() => {
    scope.$destroy();
  });

  it('should initialize', () => {
    expect(controller.scope).toBeDefined();
    expect(controller.scope.$parent).toBe(scope);
    expect(controller.element[0]).toBe(element[0]);
    expect(controller.flag).toBe('settings');
  });

  it('should dispose on scope $destroy', () => {
    scope.$destroy();

    expect(controller.scope).toBeNull();
    expect(controller.element).toBeNull();
  });

  it('should toggle settings on click', () => {
    spyOn(controller, 'toggle');
    controller.element.click();
    expect(controller.toggle).toHaveBeenCalled();
  });

  it('should be active when the window is open', () => {
    let isActive = false;
    spyOn(controller, 'isWindowActive').andCallFake(() => isActive);

    scope.$apply();
    expect(element.hasClass('active')).toBe(false);

    isActive = true;
    scope.$apply();
    expect(element.hasClass('active')).toBe(true);
  });
});
