goog.provide('os.ui.feature.FeatureInfoCtrl');
goog.provide('os.ui.feature.featureInfoDirective');

goog.require('goog.Disposable');
goog.require('ol.events');
goog.require('ol.geom.Point');
goog.require('os.map');
goog.require('os.ui.Module');
goog.require('os.ui.feature.featureInfoCellDirective');
goog.require('os.ui.feature.tab.descriptionEnableFunction');
goog.require('os.ui.feature.tab.descriptionTabDirective');
goog.require('os.ui.feature.tab.propertiesTabDirective');
goog.require('os.ui.location.SimpleLocationDirective');
goog.require('os.ui.tab.Tab');
goog.require('os.ui.uiSwitchDirective');


/**
 * The featureinfo directive
 * @return {angular.Directive}
 */
os.ui.feature.featureInfoDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/feature/featureinfo.html',
    controller: os.ui.feature.FeatureInfoCtrl,
    controllerAs: 'info'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('featureinfo', [os.ui.feature.featureInfoDirective]);



/**
 * Controller function for the featureinfo directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {goog.Disposable}
 * @constructor
 * @ngInject
 */
os.ui.feature.FeatureInfoCtrl = function($scope, $element) {
  os.ui.feature.FeatureInfoCtrl.base(this, 'constructor');

  /**
   * @type {?angular.Scope}
   */
  this.scope = $scope;

  /**
   * Array of tabs to show.
   * @type {Array.<os.ui.tab.Tab>}
   */
  this['tabs'] = os.ui.feature.FeatureInfoCtrl.TABS;

  /**
   * Number of tabs that are currently shown
   * @type {number}
   */
  this['numTabsShown'] = 1;

  /**
   * @type {function(os.ui.tab.Tab):string}
   */
  this['getUi'] = goog.bind(this.getUi_, this);

  /**
   * @type {?angular.JQLite}
   */
  this.element = $element;

  /**
   * Feature change key.
   * @type {?ol.EventsKey}
   * @private
   */
  this.changeKey_ = null;

  this.setInitialActiveTab_();

  os.unit.UnitManager.getInstance().listen(goog.events.EventType.PROPERTYCHANGE, this.updateGeometry, false, this);
  os.dispatcher.listen(os.data.FeatureEventType.VALUECHANGE, this.onValueChange, false, this);
  $scope.$watch('items', this.onFeatureChange.bind(this));
  $scope.$on(os.ui.feature.FeatureInfoCtrl.SHOW_DESCRIPTION, this.showDescription.bind(this));
  $scope.$on('$destroy', this.dispose.bind(this));
};
goog.inherits(os.ui.feature.FeatureInfoCtrl, goog.Disposable);


/**
 * The default properties tab.
 * @type {os.ui.tab.Tab}
 */
os.ui.feature.FeatureInfoCtrl.PROPERTIES_TAB = new os.ui.tab.Tab('props', 'Properties', 'fa-th', 'propertiestab');


/**
 * The description tab.
 * @type {os.ui.tab.Tab}
 */
os.ui.feature.FeatureInfoCtrl.DESCRIPTION_TAB = new
    os.ui.tab.Tab('desc', 'Description', 'fa-newspaper-o', 'descriptiontab',
        null, os.ui.feature.tab.descriptionEnableFunction);


/**
 * Array of tabs to show on this mashup.
 * @type {Array.<os.ui.tab.Tab>}
 */
os.ui.feature.FeatureInfoCtrl.TABS = [
  os.ui.feature.FeatureInfoCtrl.PROPERTIES_TAB,
  os.ui.feature.FeatureInfoCtrl.DESCRIPTION_TAB
];


/**
 * Angular event type for switching this view to the description tab.
 * @type {string}
 * @const
 */
os.ui.feature.FeatureInfoCtrl.SHOW_DESCRIPTION = 'os.ui.feature.FeatureInfoCtrl.showDescription';


/**
 * Angular event type for updating all tabs.
 * @type {string}
 * @const
 */
os.ui.feature.FeatureInfoCtrl.UPDATE_TABS = 'os.ui.feature.FeatureInfoCtrl.updateTabs';


/**
 * @inheritDoc
 */
os.ui.feature.FeatureInfoCtrl.prototype.disposeInternal = function() {
  os.ui.feature.FeatureInfoCtrl.base(this, 'disposeInternal');

  if (this.changeKey_) {
    ol.events.unlistenByKey(this.changeKey_);
    this.changeKey_ = null;
  }

  os.unit.UnitManager.getInstance().unlisten(goog.events.EventType.PROPERTYCHANGE, this.updateGeometry, false, this);
  os.dispatcher.unlisten(os.data.FeatureEventType.VALUECHANGE, this.onValueChange, false, this);
  this.element = null;
  this.scope = null;
};


/**
 * Handle value change events by updating the table.
 * @param {os.data.FeatureEvent} event
 * @suppress {checkTypes} To allow access to feature['id'].
 */
os.ui.feature.FeatureInfoCtrl.prototype.onValueChange = function(event) {
  if (event && this.scope) {
    var feature = /** @type {ol.Feature|undefined} */ (this.scope['items'][0]);
    if (feature && feature['id'] === event['id']) {
      this.updateGeometry();
      this.updateTabs_();

      os.ui.apply(this.scope);
    }
  }
};


/**
 * Handle change events fired by the feature.
 * @param {ol.events.Event} event
 */
os.ui.feature.FeatureInfoCtrl.prototype.onFeatureChangeEvent = function(event) {
  this.updateGeometry();
  this.updateTabs_();

  os.ui.apply(this.scope);
};


/**
 * Handle feature changes on the scope.
 * @param {Array<ol.Feature>} newVal The new value
 *
 * @todo Should polygons display the center point? See {@link ol.geom.Polygon#getInteriorPoint}. What about line
 *       strings? We can get the center of the extent, but that's not very helpful. For now, only display the location
 *       for point geometries.
 */
os.ui.feature.FeatureInfoCtrl.prototype.onFeatureChange = function(newVal) {
  if (this.isDisposed()) {
    return;
  }

  if (this.changeKey_) {
    ol.events.unlistenByKey(this.changeKey_);
    this.changeKey_ = null;
  }

  this.updateGeometry();
  this.updateTabs_();

  if (newVal) {
    var feature = newVal[0];
    if (feature) {
      // listen for change events fired by the feature so the window can be updated
      this.changeKey_ = ol.events.listen(feature, ol.events.EventType.CHANGE, this.onFeatureChangeEvent, this);
    }
  }
};


/**
 * Update the geometry information displayed for the feature.
 * @protected
 */
os.ui.feature.FeatureInfoCtrl.prototype.updateGeometry = function() {
  if (this.scope) {
    this.scope['lon'] = undefined;
    this.scope['lat'] = undefined;
    this.scope['alt'] = undefined;

    var feature = /** @type {ol.Feature|undefined} */ (this.scope['items'][0]);
    if (feature) {
      var geom = feature.getGeometry();
      if (geom instanceof ol.geom.Point) {
        var coord = geom.getFirstCoordinate();
        coord = ol.proj.toLonLat(coord, os.map.PROJECTION);

        if (coord && coord.length > 1) {
          this.scope['lon'] = coord[0];
          this.scope['lat'] = coord[1];

          if (coord.length > 2) {
            var um = os.unit.UnitManager.getInstance();
            this.scope['alt'] = um.formatToBestFit('distance', coord[2], os.math.Units.METERS, um.getBaseSystem(), 2);
          }
        }
      }
    }
  }
};


/**
 * Save active tab
 * @param {os.ui.tab.Tab} tab
 * @export
 */
os.ui.feature.FeatureInfoCtrl.prototype.setActiveTab = function(tab) {
  this.scope['activeTab'] = tab;
};


/**
 * Sets the intial active tab.  Defaults to properties tab.
 * @private
 */
os.ui.feature.FeatureInfoCtrl.prototype.setInitialActiveTab_ = function() {
  var initialActiveTab = this['tabs'].find(function(tab) {
    return tab.id == 'props';
  });

  if (initialActiveTab) {
    this.setActiveTab(initialActiveTab);
  } else if (this['tabs'].length > 0) {
    this.setActiveTab(this['tabs'][0]);
  }
};


/**
 * Gets the UI for the currently active tab.
 * @param {os.ui.tab.Tab} item
 * @return {string}
 * @private
 */
os.ui.feature.FeatureInfoCtrl.prototype.getUi_ = function(item) {
  item['data'] = /** @type {ol.Feature|undefined} */ (this.scope['items'][0]);
  return item['template'];
};


/**
 * Update the visibility of the tabs and broadcast update event
 * @private
 */
os.ui.feature.FeatureInfoCtrl.prototype.updateTabs_ = function() {
  var numShown = 0;
  for (var i = 0; i < this['tabs'].length; i++) {
    if (this['tabs'][i]['enableFunc']) {
      var showTab = this['tabs'][i]['enableFunc'](this['tabs'][i]['data']);
      this['tabs'][i]['isShown'] = showTab;
      if (showTab) {
        numShown++;
      }
    } else {
      this['tabs'][i]['isShown'] = true;
      numShown++;
    }
  }
  this['numTabsShown'] = numShown;

  this.scope.$broadcast(os.ui.feature.FeatureInfoCtrl.UPDATE_TABS, this.scope['items'][0]);
};


/**
 * Switches to the description tab.
 * @param {angular.Scope.Event} event
 */
os.ui.feature.FeatureInfoCtrl.prototype.showDescription = function(event) {
  this.setActiveTab(os.ui.feature.FeatureInfoCtrl.DESCRIPTION_TAB);
};
