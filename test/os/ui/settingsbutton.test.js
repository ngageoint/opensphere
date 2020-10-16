goog.require('os.ui.settingsButtonDirective');

describe('os.ui.settingsButtonDirective', () => {
  let controller;
  let scope;

  // Load the Angular module
  beforeEach(module('app'));

  beforeEach(inject(($compile, $rootScope) => {
    scope = $rootScope.$new(true);
    const $element = angular.element(`<settings-button></settings-button>`);
    $compile($element)(scope);
    scope.$apply();

    controller = $element.controller('settings-button');
  }));

  afterEach(() => {
    scope.$destroy();
  });

  it('should initialize', () => {
    expect(controller.flag).toBe('settings');
  });

  it('should toggle settings on click', () => {
    spyOn(controller, 'toggle');
    controller.element.click();
    expect(controller.toggle).toHaveBeenCalled();
  });
});
