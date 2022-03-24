goog.require('goog.events.KeyCodes');
goog.require('os');
goog.require('os.ui.window.ConfirmUI');

describe('os.ui.window.ConfirmUI', () => {
  const KeyCodes = goog.module.get('goog.events.KeyCodes');

  let compile;
  let rootScope;
  let controller;
  let element;
  let scope;

  /**
   * Initialize the Angular component.
   * @param {Object=} opt_scope Properties to assign to the scope.
   */
  const initComponent = (opt_scope = {}) => {
    destroyComponent();

    scope = Object.assign(rootScope.$new(true), opt_scope);

    element = angular.element(`<confirm></confirm>`);
    compile(element)(scope);
    scope.$apply();

    controller = element.controller('confirm');
  };

  /**
   * Destroy the Angular component.
   */
  const destroyComponent = () => {
    if (scope) {
      scope.$destroy();
      scope = null;
      controller = null;
    }
  };

  // Load the Angular module
  beforeEach(
      angular.mock.module('app')
  );

  beforeEach(inject(($compile, $rootScope) => {
    compile = $compile;
    rootScope = $rootScope;
  }));

  afterEach(() => {
    destroyComponent();
  });

  it('should initialize', () => {
    initComponent();
    expect(controller.scope_).toBeDefined();
    expect(controller.scope_.$parent).toBe(scope);
    expect(controller.scope_.valid).toBe(true);
    expect(controller.element_[0]).toBe(element[0]);

    initComponent({valid: false});
    expect(controller.scope_.valid).toBe(false);
  });

  it('should clean up on scope $destroy', () => {
    initComponent();
    scope.$destroy();

    expect(controller.scope_).toBeNull();
    expect(controller.element_).toBeNull();
    expect(controller.keyHandler_.isDisposed()).toBe(true);
  });

  it('should create yes/no buttons from scope options', () => {
    const options = {
      yesText: 'Yes Test',
      yesIcon: 'fa-yep',
      yesButtonTitle: 'Yes tooltip',
      noText: 'No Test',
      noIcon: 'fa-nope',
      noButtonTitle: 'No tooltip'
    };

    initComponent(options);

    const yesButton = element.find('button[type="submit"]');
    expect(yesButton.length).toBe(1);
    expect(yesButton[0].innerText.trim()).toBe(options.yesText);
    expect(yesButton[0].title).toBe(options.yesButtonTitle);
    expect(yesButton.find('i').hasClass(options.yesIcon)).toBe(true);

    let noButton = element.find('button[type="button"]');
    expect(noButton.length).toBe(1);
    expect(noButton[0].innerText.trim()).toBe(options.noText);
    expect(noButton[0].title).toBe(options.noButtonTitle);
    expect(noButton.find('i').hasClass(options.noIcon)).toBe(true);

    options.hideCancel = true;
    initComponent(options);

    noButton = element.find('button[type="button"]');
    expect(noButton.length).toBe(0);
  });

  it('should fire a callback and close when cancelled', () => {
    let called = false;
    initComponent({
      cancelCallback: () => {
        called = true;
      }
    });

    spyOn(controller, 'close_');

    controller.cancel();

    expect(called).toBe(true);
    expect(controller.close_).toHaveBeenCalled();
  });

  it('should fire callbacks and close when confirmed', () => {
    const expected = 'It works!';

    let confirmValue;
    let checkValue;

    initComponent({
      checkboxCallback: (value) => {
        checkValue = value;
      },
      confirmCallback: (value) => {
        confirmValue = value;
      },
      confirmValue: expected
    });

    spyOn(controller, 'close_');

    controller.checkboxSelection = true;
    controller.confirm();

    expect(confirmValue).toBe(expected);
    expect(checkValue).toBe(true);
    expect(controller.close_).toHaveBeenCalled();
  });

  it('should close on Escape keypress', () => {
    initComponent();

    spyOn(controller, 'cancel');
    controller.handleKeyEvent_({keyCode: KeyCodes.ESC});
    expect(controller.cancel).toHaveBeenCalled();
  });
});
