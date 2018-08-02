goog.provide('os.ui.MeasureButtonCtrl');
goog.provide('os.ui.measureButtonDirective');

goog.require('os.interaction.Measure');
goog.require('os.metrics.keys');
goog.require('os.ui.Module');
goog.require('os.ui.menu.Menu');
goog.require('os.ui.menu.MenuButtonCtrl');
goog.require('os.ui.menu.MenuItem');
goog.require('os.ui.menu.MenuItemType');
goog.require('os.ui.ol.interaction.AbstractDraw');

/**
 * The add data button bar directive
 * @return {angular.Directive}
 */
os.ui.measureButtonDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'showLabel': '='
    },
    controller: os.ui.MeasureButtonCtrl,
    controllerAs: 'ctrl',
    template: '<div class="measure-group btn-group" ng-right-click="ctrl.openMenu()">' +
      '<button class="btn btn-default" id="measureButton" title="Measure between points"' +
      ' ng-click="ctrl.toggle()"' +
      ' ng-class="{active: measuring}">' +
      '<i class="fa fa-arrows-h"></i> {{showLabel ? \'Measure\' : \'\'}}' +
      '</button>' +
      '<button class="btn addon" ng-click="ctrl.openMenu()"' +
      ' ng-class="{active: menu}">' +
      '<i class="fa fa-chevron-down"></i>' +
      '</button></div>'
  };
};


/**
 * add the directive to the module
 */
os.ui.Module.directive('measureButton', [os.ui.measureButtonDirective]);


/**
 * Controller function for the nav-top directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element The element
 * @extends {os.ui.menu.MenuButtonCtrl}
 * @constructor
 * @ngInject
 */
os.ui.MeasureButtonCtrl = function($scope, $element) {
  os.ui.MeasureButtonCtrl.base(this, 'constructor', $scope, $element);

  this.menu = os.ui.MeasureButtonCtrl.MEASURE;
  this.menu.listen(os.interpolate.Method.GEODESIC, this.onMeasureTypeChange_, false, this);
  this.menu.listen(os.interpolate.Method.RHUMB, this.onMeasureTypeChange_, false, this);

  this.flag = 'measure';
  this.metricKey = os.metrics.keys.Map.MEASURE_TOGGLE;

  this.scope['measuring'] = false;

  /**
   * @type {Object<string, boolean>}
   * @private
   */
  this.prevActiveMap_ = {};

  os.dispatcher.listen(os.ui.ol.draw.DrawEventType.DRAWEND, this.onDrawEnd_, false, this);
  os.dispatcher.listen(os.ui.ol.draw.DrawEventType.DRAWCANCEL, this.onDrawEnd_, false, this);

  /**
   * @type {!string}
   * @private
   */
  this.key_ = 'measureMethod';
  os.interaction.Measure.method = /** @type {os.interpolate.Method} */ (
      os.settings.get(this.key_, os.interaction.Measure.method));
};
goog.inherits(os.ui.MeasureButtonCtrl, os.ui.menu.MenuButtonCtrl);


/**
 * @type {os.ui.menu.Menu<undefined>|undefined}
 */
os.ui.MeasureButtonCtrl.MEASURE = new os.ui.menu.Menu(new os.ui.menu.MenuItem({
  type: os.ui.menu.MenuItemType.ROOT,
  children: [{
    label: 'Measure Geodesic',
    eventType: os.interpolate.Method.GEODESIC,
    tooltip: 'Measures the shortest distance between two points (variable bearing).',
    beforeRender: os.ui.MeasureButtonCtrl.updateIcons
  }, {
    label: 'Measure Rhumb Line',
    eventType: os.interpolate.Method.RHUMB,
    tooltip: 'Measures the path of constant bearing between two points.',
    beforeRender: os.ui.MeasureButtonCtrl.updateIcons
  }]
}));


/**
 * @param {boolean=} opt_value The toggle value
 * @override
 */
os.ui.MeasureButtonCtrl.prototype.toggle = function(opt_value) {
  var measure = this.getMeasureInteraction_();

  if (measure) {
    opt_value = goog.isDef(opt_value) ? opt_value : !measure.getActive();

    if (opt_value) {
      this.prevActiveMap_ = {};
    }

    var interactions = os.MapContainer.getInstance().getMap().getInteractions().getArray();

    for (var i = 0, n = interactions.length; i < n; i++) {
      if (interactions[i] instanceof os.ui.ol.interaction.AbstractDraw) {
        var interaction = /** @type {os.ui.ol.interaction.AbstractDraw} */ (interactions[i]);
        var type = interaction.getType();

        if (opt_value) {
          this.prevActiveMap_[type] = interaction.getActive();
          interaction.setActive(false);
        } else if (type in this.prevActiveMap_) {
          interaction.setActive(this.prevActiveMap_[type]);
        } else {
          interaction.setActive(false);
        }
      }
    }

    measure.setEnabled(opt_value);
    measure.setActive(opt_value);
    this.scope['measuring'] = opt_value;

    if (opt_value && this.metricKey) {
      os.metrics.Metrics.getInstance().updateMetric(this.metricKey, 1);
    }
  }
};
goog.exportProperty(os.ui.MeasureButtonCtrl.prototype, 'toggle', os.ui.MeasureButtonCtrl.prototype.toggle);


/**
 * @param {os.ui.ol.draw.DrawEvent} evt The draw event
 * @private
 */
os.ui.MeasureButtonCtrl.prototype.onDrawEnd_ = function(evt) {
  if (evt.target instanceof os.interaction.Measure) {
    this.toggle(false);
  }
};


/**
 * @return {?os.interaction.Measure} The measure interaction
 * @private
 */
os.ui.MeasureButtonCtrl.prototype.getMeasureInteraction_ = function() {
  var interactions = os.MapContainer.getInstance().getMap().getInteractions().getArray();

  for (var i = 0, n = interactions.length; i < n; i++) {
    if (interactions[i] instanceof os.interaction.Measure) {
      return /** @type {os.interaction.Measure} */ (interactions[i]);
    }
  }

  return null;
};


/**
 * @param {os.ui.menu.MenuEvent<undefined>} evt The event from the menu
 * @private
 */
os.ui.MeasureButtonCtrl.prototype.onMeasureTypeChange_ = function(evt) {
  os.interaction.Measure.method = /** @type {os.interpolate.Method} */ (evt.type);
  os.settings.set(this.key_, evt.type);
  this.toggle(true);
};


/**
 * Helper function for changing icons.
 * @this {os.ui.menu.MenuItem}
 */
os.ui.MeasureButtonCtrl.updateIcons = function() {
  if (this.eventType === os.interaction.Measure.method) {
    this.icons = ['<i class="fa fa-fw fa-dot-circle-o"></i>'];
  } else {
    this.icons = ['<i class="fa fa-fw fa-circle-o"></i>'];
  }
};

