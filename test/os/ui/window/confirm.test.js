goog.require('goog.events.KeyCodes');
goog.require('os.defines');
goog.require('os.ui.window.ConfirmUI');

describe('os.ui.window.ConfirmUI', () => {
  const KeyCodes = goog.module.get('goog.events.KeyCodes');

  let compile;
  let rootScope;
  let controller;
  let scope;

  /**
   * Initialize the Angular component.
   * @param {Object=} opt_scope Properties to assign to the scope.
   */
  const initComponent = (opt_scope = {}) => {
    destroyComponent();

    scope = Object.assign(rootScope.$new(true), opt_scope);

    const $element = angular.element(`<confirm></confirm>`);
    compile($element)(scope);
    scope.$apply();

    controller = $element.controller('confirm');
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

  // Load the Angular module and template
  beforeEach(module('app'));
  beforeEach(module(`${os.ROOT}views/window/confirm.html`));

  beforeEach(inject(($compile, $rootScope) => {
    compile = $compile;
    rootScope = $rootScope;
  }));

  afterEach(() => {
    destroyComponent();
  });

  it('should initialize', () => {
    initComponent();
    expect(controller.scope_.valid).toBe(true);

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

  it('should fire a callback and close when confirmed', () => {
    const expected = 'It works!';
    let confirmValue;

    initComponent({
      confirmCallback: (value) => {
        confirmValue = value;
      },
      confirmValue: expected
    });

    spyOn(controller, 'close_');

    controller.confirm();

    expect(confirmValue).toBe(expected);
    expect(controller.close_).toHaveBeenCalled();
  });

  it('should fire a callback on checkbox change', () => {
    let checkValue;

    initComponent({
      checkboxCallback: (value) => {
        checkValue = value;
      }
    });

    controller.updateCheckbox(true);
    expect(checkValue).toBe(true);

    controller.updateCheckbox(false);
    expect(checkValue).toBe(false);
  });

  it('should close on Escape keypress', () => {
    initComponent();

    spyOn(controller, 'cancel');
    controller.handleKeyEvent_({keyCode: KeyCodes.ESC});
    expect(controller.cancel).toHaveBeenCalled();
  });
});
