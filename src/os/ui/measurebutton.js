goog.module('os.ui.MeasureButtonUI');
goog.module.declareLegacyNamespace();

const dispatcher = goog.require('os.Dispatcher');
const Settings = goog.require('os.config.Settings');
const Measure = goog.require('os.interaction.Measure');
const Method = goog.require('os.interpolate.Method');
const {getMapContainer} = goog.require('os.map.instance');
const Metrics = goog.require('os.metrics.Metrics');
const {Map: MapKeys} = goog.require('os.metrics.keys');
const Module = goog.require('os.ui.Module');
const DrawEventType = goog.require('os.ui.draw.DrawEventType');
const Menu = goog.require('os.ui.menu.Menu');
const MenuButtonCtrl = goog.require('os.ui.menu.MenuButtonCtrl');
const MenuItem = goog.require('os.ui.menu.MenuItem');
const MenuItemType = goog.require('os.ui.menu.MenuItemType');

const DrawEvent = goog.requireType('os.ui.draw.DrawEvent');
const MenuEvent = goog.requireType('os.ui.menu.MenuEvent');


/**
 * The add data button bar directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'showLabel': '='
  },
  controller: Controller,
  controllerAs: 'ctrl',
  template: '<div class="btn-group" ng-right-click="ctrl.openMenu()">' +
    '<button class="btn btn-secondary" id="measureButton" title="Measure between points"' +
    ' ng-click="ctrl.toggle()"' +
    ' ng-class="{active: measuring}">' +
    '<i class="fa fa-fw fa-drafting-compass"></i> {{showLabel ? \'Measure\' : \'\'}}' +
    '</button>' +
    '<button class="btn btn-secondary dropdown-toggle dropdown-toggle-split" ng-click="ctrl.openMenu()"' +
    ' ng-class="{active: menu}">' +
    '</button></div>'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'measure-button';

/**
 * add the directive to the module
 */
Module.directive('measureButton', [directive]);

/**
 * Controller function for the nav-top directive
 * @unrestricted
 */
class Controller extends MenuButtonCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element The element
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);

    this.menu = Controller.MEASURE;
    this.menu.listen(Method.GEODESIC, this.onMeasureTypeChange_, false, this);
    this.menu.listen(Method.RHUMB, this.onMeasureTypeChange_, false, this);

    this.flag = 'measure';
    this.metricKey = MapKeys.MEASURE_TOGGLE;

    this.scope['measuring'] = false;

    dispatcher.getInstance().listen(DrawEventType.DRAWEND, this.onDrawEnd_, false, this);
    dispatcher.getInstance().listen(DrawEventType.DRAWCANCEL, this.onDrawEnd_, false, this);

    /**
     * @type {!string}
     * @private
     */
    this.key_ = 'measureMethod';
    Measure.method = /** @type {Method} */ (Settings.getInstance().get(this.key_, Measure.method));
  }

  /**
   * @param {boolean=} opt_value The toggle value
   * @override
   * @export
   */
  toggle(opt_value) {
    var measure = this.getMeasureInteraction_();

    if (measure) {
      opt_value = opt_value !== undefined ? opt_value : !measure.getActive();

      measure.setEnabled(opt_value);
      measure.setActive(opt_value);
      this.scope['measuring'] = opt_value;

      if (opt_value && this.metricKey) {
        Metrics.getInstance().updateMetric(this.metricKey, 1);
      }
    }
  }

  /**
   * @param {DrawEvent} evt The draw event
   * @private
   */
  onDrawEnd_(evt) {
    if (evt.target instanceof Measure) {
      this.toggle(false);
    }
  }

  /**
   * @return {?Measure} The measure interaction
   * @private
   */
  getMeasureInteraction_() {
    var interactions = getMapContainer().getMap().getInteractions().getArray();
    var measure = interactions.find((interaction) => {
      return interaction instanceof Measure && interaction.isType('measure');
    });
    return /** @type {Measure} */ (measure);
  }

  /**
   * @param {MenuEvent<undefined>} evt The event from the menu
   * @private
   */
  onMeasureTypeChange_(evt) {
    Measure.method = /** @type {Method} */ (evt.type);
    Settings.getInstance().set(this.key_, evt.type);
    this.toggle(true);
  }

  /**
   * Helper function for changing icons.
   *
   * @this {MenuItem}
   */
  static updateIcons() {
    if (this.eventType === Measure.method) {
      this.icons = ['<i class="fa fa-fw fa-dot-circle-o"></i>'];
    } else {
      this.icons = ['<i class="fa fa-fw fa-circle-o"></i>'];
    }
  }
}

/**
 * @type {Menu<undefined>|undefined}
 */
Controller.MEASURE = new Menu(new MenuItem({
  type: MenuItemType.ROOT,
  children: [{
    label: 'Measure Geodesic',
    eventType: Method.GEODESIC,
    tooltip: 'Measures the shortest distance between two points (variable bearing).',
    beforeRender: Controller.updateIcons
  }, {
    label: 'Measure Rhumb Line',
    eventType: Method.RHUMB,
    tooltip: 'Measures the path of constant bearing between two points.',
    beforeRender: Controller.updateIcons
  }]
}));

exports = {
  Controller,
  directive,
  directiveTag
};
