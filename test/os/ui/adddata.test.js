goog.require('os.ui.AddDataUI');
goog.require('os.ui.events.UIEventParams');

describe('os.ui.AddDataUI', function() {
  const {Controller: AddDataCtrl} = goog.module.get('os.ui.AddDataUI');
  const UIEventParams = goog.module.get('os.ui.events.UIEventParams');

  it('should handle parameters ', inject(function($rootScope) {
    var windowScope = $rootScope.$new();
    var ctrlScope = windowScope.$new();
    var element = $('<div></div>');
    var addDataCtrl = new AddDataCtrl(ctrlScope, element);

    expect(addDataCtrl.scope['filterName']).toBeNull();

    var params = {};
    params[UIEventParams.FILTER_FUNC] = function() {};
    params[UIEventParams.FILTER_NAME] = 'unit test filter name';
    windowScope.$broadcast('os.ui.window.params', params);

    expect(addDataCtrl.scope['filterName']).toBe('unit test filter name');

    addDataCtrl.clearFilter();

    expect(addDataCtrl.scope['filterName']).toBeNull();
  }));
});
