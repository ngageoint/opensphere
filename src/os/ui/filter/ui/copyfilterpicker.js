goog.provide('os.ui.filter.ui.CopyFilterPickerCtrl');
goog.provide('os.ui.filter.ui.CopyFilterPickerModel');
goog.provide('os.ui.filter.ui.copyFilterPickerDirective');
goog.require('goog.string');
goog.require('os.ui.Module');


/**
 * @typedef {{
 *   'name': string,
 *   'mapping': (os.column.ColumnMapping|undefined),
 *   'targetFilterKey': string,
 *   'sourceColumnName': string,
 *   'targetColumns': Array<Object>,
 *   'selectedTargetColumn': Object
 * }}
 */
os.ui.filter.ui.CopyFilterPickerModel;


/**
 * The copyfilterpicker directive
 * @return {angular.Directive}
 */
os.ui.filter.ui.copyFilterPickerDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      /**
       * type {Array<os.ui.filter.ui.CopyFilterPickerModel>}
       */
      'models': '=',
      /**
       * type {string}
       */
      'sourceLayerName': '=',
      /**
       * type {string}
       */
      'sourceFilterKey': '='
    },
    templateUrl: os.ROOT + 'views/filter/copyfilterpicker.html',
    controller: os.ui.filter.ui.CopyFilterPickerCtrl,
    controllerAs: 'copyFilterPickerCtrl'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('copyfilterpicker', [os.ui.filter.ui.copyFilterPickerDirective]);



/**
 * Controller function for the copyfilterpicker directive
 * @param {!angular.Scope} $scope
 * @param {!angular.$timeout} $timeout
 * @constructor
 * @ngInject
 */
os.ui.filter.ui.CopyFilterPickerCtrl = function($scope, $timeout) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {string}
   * @private
   */
  this.sourceFilterKey_ = $scope['sourceFilterKey'];

  /**
   * @type {string}
   */
  this['duplicateText'] = 'Duplicate columns are not allowed.';

  $timeout(this.validate.bind(this));
  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Clean up.
 * @private
 */
os.ui.filter.ui.CopyFilterPickerCtrl.prototype.destroy_ = function() {
  if (this.scope_['copyFilterPickerForm']) {
    // Reset this form's validity on remove.
    // If we don't do this, the parent form will stay invalid, probably an angular bug.
    this.scope_['copyFilterPickerForm'].$setValidity('duplicate', true);
  }

  this.scope_ = null;
};


/**
 * Validates the picker section.
 */
os.ui.filter.ui.CopyFilterPickerCtrl.prototype.validate = function() {
  var modelArray = /** @type {Array<Object>} */ (this.scope_['models']);
  var found = os.array.findDuplicates(modelArray, function(model) {
    return model['selectedTargetColumn'] ? model['selectedTargetColumn']['name'] : goog.string.getRandomString();
  });
  var duplicates = found.length > 0;

  var inUse = false;
  var targetColumnName = '';
  var sourceColumnName = '';
  for (var i = 0, ii = modelArray.length; i < ii; i++) {
    var model = modelArray[i];
    if (model['selectedTargetColumn']) {
      var targetFilterKey = model['targetFilterKey'];
      targetColumnName = model['selectedTargetColumn']['name'];
      var targetHash = targetFilterKey + '#' + targetColumnName;
      var cm = os.column.ColumnMappingManager.getInstance().getOwnerMapping(targetHash);
      if (cm) {
        var sourceColumn = cm.getColumn(this.sourceFilterKey_);
        if (sourceColumn && sourceColumn['column'] !== model['sourceColumnName']) {
          sourceColumnName = sourceColumn['column'];
          inUse = true;
          break;
        }
      }
    }
  }

  if (inUse) {
    this['inUseText'] = '<b>' + targetColumnName + '</b> is already associated with <b>' + sourceColumnName + '</b>.';
  }

  this.scope_['copyFilterPickerForm'].$setValidity('duplicate', !duplicates);
  this.scope_['copyFilterPickerForm'].$setValidity('inUse', !inUse);
};
goog.exportProperty(
    os.ui.filter.ui.CopyFilterPickerCtrl.prototype,
    'validate',
    os.ui.filter.ui.CopyFilterPickerCtrl.prototype.validate);
