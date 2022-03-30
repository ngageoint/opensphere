goog.declareModuleId('os.ui.data.AddColumnUI');

import FeatureEventType from '../../data/featureeventtype.js';
import PropertyChangeEvent from '../../events/propertychangeevent.js';
import {getMapContainer} from '../../map/mapinstance.js';
import {ROOT} from '../../os.js';
import PropertyChange from '../../source/propertychange.js';
import {notifyStyleChange, setFeatureStyle} from '../../style/style.js';
import Module from '../module.js';
import {close, create} from '../window.js';
import WindowEventType from '../windoweventtype.js';
import {isDuplicateColumn} from './addcolumnform.js';

const {default: Vector} = goog.requireType('os.source.Vector');


/**
 * The addcolumn directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'source': '='
  },
  templateUrl: ROOT + 'views/data/addcolumn.html',
  controller: Controller,
  controllerAs: 'addcolumn'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'addcolumn';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the addcolumn directive
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
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
     * @type {Vector}
     * @private
     */
    this.source_ = $scope['source'];

    /**
     * @type {Array<Feature>}
     * @private
     */
    this.features_ = this.source_.getSelectedItems();

    /**
     * @type {string}
     */
    this['name'] = '';

    /**
     * @type {string}
     */
    this['value'] = '';

    /**
     * Form validators.
     * @type {!Array<!Object>}
     */
    this['validators'] = [];

    if (this.source_) {
      this['validators'].push({
        'id': 'duplicate',
        'model': 'name',
        'handler': isDuplicateColumn.bind(null, this.source_)
      });
    }

    $timeout(function() {
      $element.find('input[name="name"]').focus();
    });

    $scope.$emit(WindowEventType.READY);
    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * Clean up.
   *
   * @private
   */
  destroy_() {
    this.scope_ = null;
    this.element_ = null;
  }

  /**
   * Closes the window.
   *
   * @export
   */
  cancel() {
    close(this.element_);
  }

  /**
   * Finishes and adds the column.
   *
   * @export
   */
  finish() {
    if (!this.scope_['addColumnForm'].$invalid) {
      var name = /** @type {string} */ (this['name']).toUpperCase();

      if (this.features_.length > 0) {
        for (var i = 0, ii = this.features_.length; i < ii; i++) {
          // set the value on each feature and fire an event to notify that a change occurred
          var feature = this.features_[i];
          var oldVal = feature.get(name);
          feature.set(name, this['value']);
          setFeatureStyle(feature);
          feature.dispatchFeatureEvent(FeatureEventType.VALUECHANGE, this['value'], oldVal);
        }

        // add the column to the source
        this.source_.addColumn(name, undefined, true, true);
        var event = new PropertyChangeEvent(PropertyChange.DATA);
        this.source_.dispatchEvent(event);

        var layer = getMapContainer().getLayer(this.source_.getId());
        if (layer) {
          notifyStyleChange(layer, this.features_);
        }
      }

      this.cancel();
    }
  }
}

/**
 * Launches the window for the given source.
 *
 * @param {Vector} source
 */
export const launchAddColumn = (source) => {
  var options = {
    'id': 'addcolumn',
    'x': 'center',
    'y': 'center',
    'label': 'Add column to ' + source.getTitle(),
    'show-close': true,
    'modal': true,
    'width': 500,
    'height': 'auto',
    'icon': 'fa fa-plus'
  };

  var scopeOptions = {
    'source': source
  };

  var template = '<addcolumn source="source"></addcolumn>';
  create(options, template, undefined, undefined, undefined, scopeOptions);
};
