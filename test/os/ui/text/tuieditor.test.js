goog.require('os.ui.text.TuiEditor');
goog.require('os.ui.text.TuiEditorCtrl');
goog.require('os.ui.text.tuiEditorDirective');

describe('os.ui.text.tuiEditorDirective', () => {
  it('should copy blank text', () => {
    const result = os.ui.text.tuiEditorDirective();

    expect(result.scope.isRequired).toEqual('=');
  });
});

describe('os.ui.text.TuiEditorCtrl', () => {
  let $scope;
  let element;
  let $timeout;
  let ctrl;

  beforeEach(function() {
    inject(function($compile, $rootScope, _$timeout_) {
      $scope = $rootScope;
      $timeout = _$timeout_;
      element = angular.element('<tuieditor></tuieditor>');
      $compile(element)($scope);
    });
  });

  it('should instantiate correctly', () => {
    ctrl = new os.ui.text.TuiEditorCtrl($scope, element, $timeout);

    expect(ctrl.initialText_).toEqual('');
  });

  it('should handle destruction well', () => {
    ctrl = new os.ui.text.TuiEditorCtrl($scope, element, $timeout);

    const ele = jasmine.createSpyObj('element', ['off']);
    ctrl.element = ele;

    expect(ele.off).not.toHaveBeenCalled();

    ctrl.destroy();

    expect(ele.off).toHaveBeenCalled();
    expect(ctrl.element).toBeNull();
  });
});
