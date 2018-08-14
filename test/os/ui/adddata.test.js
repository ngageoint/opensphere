goog.require('os.ui.events.UIEventParams');
goog.require('os.ui.AddDataCtrl');

describe('os.ui.AddDataCtrl', function() {
  it('should handle parameters ', inject(function($rootScope) {
    var windowScope = $rootScope.$new();
    var ctrlScope = windowScope.$new();
    var element = $('<div></div>');
    var addDataCtrl = new os.ui.AddDataCtrl(ctrlScope, element);

    expect(addDataCtrl.scope['filterName']).toBeNull();

    var params = {};
    params[os.ui.events.UIEventParams.FILTER_FUNC] = function() {};
    params[os.ui.events.UIEventParams.FILTER_NAME] = 'unit test filter name';
    windowScope.$broadcast('os.ui.window.params', params);

    expect(addDataCtrl.scope['filterName']).toBe('unit test filter name');

    addDataCtrl.clearFilter();

    expect(addDataCtrl.scope['filterName']).toBeNull();
  }));
});
