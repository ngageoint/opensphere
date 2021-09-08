goog.require('os.ui.layer.EllipseColumnsUI');

describe('os.ui.layer.EllipseColumnsUI', function() {
  const EllipseColumnsUI = goog.module.get('os.ui.layer.EllipseColumnsUI');

  var scope;
  var element;

  beforeEach(function() {
    inject(function($compile, $rootScope) {
      scope = $rootScope;

      const layer = jasmine.createSpyObj('layer', ['getId']);
      layer.getId.andReturn(undefined);
      layer.mappings = [];
      scope['layer'] = layer;

      const parent = $('<div></div>');
      element = angular.element(`<div></div>`).appendTo(parent);

      $compile(element)(scope);
    });
  });

  it('Feature Toggle settings key is set', function() {
    expect(EllipseColumnsUI.ALLOW_ELLIPSE_CONFIG).toBeDefined();
  });

  it('Create no mappings if form is not filled out', function() {
    const Controller = new EllipseColumnsUI.Controller(scope, element);

    const mappings = Controller.createMappings();

    expect(mappings).toBeDefined();
    expect(mappings.length).toBe(0);
  });

  it('Create Radius Mappings for Ellipse Columns', function() {
    const Controller = new EllipseColumnsUI.Controller(scope, element);

    Controller.inputType = 'circle';
    Controller.radiusColumn = {
      name: 'Radius'
    };
    Controller.radiusUnits = 'm';

    const mappings = Controller.createMappings();

    expect(mappings).toBeDefined();
    expect(mappings.length).toBe(1);
  });

  it('Create Ellipse Mappings for Ellipse Columns', function() {
    const Controller = new EllipseColumnsUI.Controller(scope, element);

    Controller.inputType = 'ellipse';
    Controller.semiMajorColumn = {
      name: 'semiMajor'
    };
    Controller.semiMajorUnits = 'm';

    Controller.semiMinorColumn = {
      name: 'semiMinor'
    };
    Controller.semiMinorUnits = 'm';

    Controller.orientation = {
      name: 'orientation'
    };

    const mappings = Controller.createMappings();

    expect(mappings).toBeDefined();
    expect(mappings.length).toBe(3);
  });
});
