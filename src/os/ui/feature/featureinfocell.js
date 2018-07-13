goog.provide('os.ui.feature.FeatureInfoCellCtrl');
goog.provide('os.ui.feature.featureInfoCellDirective');

goog.require('goog.object');
goog.require('goog.string');
goog.require('os.defines');
goog.require('os.ui');
goog.require('os.ui.Module');
goog.require('os.ui.columnactions.ColumnActionManager');
goog.require('os.ui.columnactions.SimpleColumnActionModel');
goog.require('os.ui.formatter');
goog.require('os.ui.location.SimpleLocationDirective');
goog.require('os.ui.propertyInfoDirective');
goog.require('os.ui.text');


/**
 * The featureinfo directive
 * @return {angular.Directive}
 */
os.ui.feature.featureInfoCellDirective = function() {
  return {
    restrict: 'E',
    scope: {
      'property': '='
    },
    replace: true,
    templateUrl: os.ROOT + 'views/feature/featureinfocell.html',
    controller: os.ui.feature.FeatureInfoCellCtrl,
    controllerAs: 'cell'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('featureinfocell', [os.ui.feature.featureInfoCellDirective]);



/**
 * Controller function for the featureinfo directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$sce} $sce
 * @constructor
 * @ngInject
 */
os.ui.feature.FeatureInfoCellCtrl = function($scope, $element, $sce) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;

  /**
   * @type {?angular.$sce}
   * @private
   */
  this.sce_ = $sce;

  /**
   * Value to show in the copy window
   * @type {string}
   * @private
   */
  this.copyValue_ = '';
  this.init_();
  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Clean up.
 * @private
 */
os.ui.feature.FeatureInfoCellCtrl.prototype.destroy_ = function() {
  this.scope_ = null;
  this.element_ = null;
  this.sce_ = null;
};


/**
 * Setup the cell by the type
 * @private
 */
os.ui.feature.FeatureInfoCellCtrl.prototype.init_ = function() {
  var property = this.scope_['property'];
  var value = property['value'];
  this.scope_['type'] = '';
  if (value) {
    this.scope_['ca'] = new os.ui.columnactions.SimpleColumnActionModel(property['field']);
    this.scope_['actions'] =
        os.ui.columnactions.ColumnActionManager.getInstance().getActions(null, this.scope_['ca'], value);

    if (property['field'] == os.Fields.PROPERTIES && typeof value === 'object') {
      // add the View Properties link
      this.scope_['type'] = 'prop';
    } else if (this.scope_['actions'].length > 0) {
      // we have column actions, use those
      this.scope_['type'] = 'ca';
      if (this.scope_['actions'].length == 1) {
        this.scope_['action'] = this.scope_['actions'][0].getAction(value);
        this.scope_['description'] = this.scope_['actions'][0].getDescription();
      }
    } else if (os.fields.DESC_REGEXP.test(property['field'])) {
      // we have a description, tell it to use that formatter
      this.scope_['type'] = 'desc';
    } else {
      // default case, just show it
      this.copyValue_ = this.scope_['property']['value'];
      this.scope_['property']['value'] =
          // We want Angular to trust the HTML we generate. We do NOT trust the value, and it is sanitized
          // elsewhere.
          this.sce_.trustAsHtml('<span>' + os.ui.formatter.urlNewTabFormatter(value) + '</span>');
      this.element_.parent().dblclick(this.onDblClick_.bind(this));
    }
  }
};


/**
 * Show the description tab
 */
os.ui.feature.FeatureInfoCellCtrl.prototype.showDescription = function() {
  this.scope_.$emit(os.ui.feature.FeatureInfoCtrl.SHOW_DESCRIPTION);
};
goog.exportProperty(
    os.ui.feature.FeatureInfoCellCtrl.prototype,
    'showDescription',
    os.ui.feature.FeatureInfoCellCtrl.prototype.showDescription);


/**
 * View properties
 */
os.ui.feature.FeatureInfoCellCtrl.prototype.viewProperties = function() {
  var feature = /** @type {!ol.Feature} */ (this.scope_['property']['feature']);
  var properties = /** @type {!Object} */ (feature.get(os.Fields.PROPERTIES));
  var id = /** @type {!string} */ (feature.get(os.Fields.ID));
  if (properties instanceof Object && typeof id === 'string') {
    os.ui.launchPropertyInfo(id, properties);
  }
};
goog.exportProperty(
    os.ui.feature.FeatureInfoCellCtrl.prototype,
    'viewProperties',
    os.ui.feature.FeatureInfoCellCtrl.prototype.viewProperties);


/**
 * Pick column action
 */
os.ui.feature.FeatureInfoCellCtrl.prototype.pickColumnAction = function() {
  os.ui.columnactions.launchColumnActionPrompt(this.scope_['actions'],
      this.scope_['property']['value'],
      this.scope_['ca']);
};
goog.exportProperty(
    os.ui.feature.FeatureInfoCellCtrl.prototype,
    'pickColumnAction',
    os.ui.feature.FeatureInfoCellCtrl.prototype.pickColumnAction);


/**
 * @private
 */
os.ui.feature.FeatureInfoCellCtrl.prototype.onDblClick_ = function() {
  os.ui.text.copy(this.copyValue_);
};
