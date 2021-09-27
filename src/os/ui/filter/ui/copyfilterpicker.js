goog.declareModuleId('os.ui.filter.ui.CopyFilterPickerUI');

import {ROOT} from '../../../os.js';
import Module from '../../module.js';

const {getRandomString} = goog.require('goog.string');
const {findDuplicates} = goog.require('os.array');
const ColumnMappingManager = goog.require('os.column.ColumnMappingManager');

const {default: CopyFilterPickerModel} = goog.requireType('os.ui.filter.ui.CopyFilterPickerModel');


/**
 * The copyfilterpicker directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    /**
     * type {Array<CopyFilterPickerModel>}
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
  templateUrl: ROOT + 'views/filter/copyfilterpicker.html',
  controller: Controller,
  controllerAs: 'copyFilterPickerCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'copyfilterpicker';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the copyfilterpicker directive
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.$timeout} $timeout
   * @ngInject
   */
  constructor($scope, $timeout) {
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
  }

  /**
   * Clean up.
   *
   * @private
   */
  destroy_() {
    if (this.scope_['copyFilterPickerForm']) {
      // Reset this form's validity on remove.
      // If we don't do this, the parent form will stay invalid, probably an angular bug.
      this.scope_['copyFilterPickerForm'].$setValidity('duplicate', true);
    }

    this.scope_ = null;
  }

  /**
   * Validates the picker section.
   *
   * @export
   */
  validate() {
    var modelArray = /** @type {Array<Object>} */ (this.scope_['models']);
    var found = findDuplicates(modelArray, function(model) {
      return model['selectedTargetColumn'] ? model['selectedTargetColumn']['name'] : getRandomString();
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
        var cm = ColumnMappingManager.getInstance().getOwnerMapping(targetHash);
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
  }
}
