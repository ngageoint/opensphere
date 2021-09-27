goog.declareModuleId('os.ui.LayersWindowUI');

import './areas.js';
import './filters.js';
import './layers.js';
import {ROOT} from '../os.js';
import Module from './module.js';
import {apply} from './ui.js';

const Disposable = goog.require('goog.Disposable');
const {AreaState} = goog.require('os.query');
const {getFilterManager, getQueryManager} = goog.require('os.query.instance');


/**
 * The layers window directive
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  scope: {
    'tab': '@'
  },
  controller: Controller,
  templateUrl: ROOT + 'views/windows/layers.html'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'layerswin';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for area count directive.
 * @unrestricted
 */
export class Controller extends Disposable {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @ngInject
   */
  constructor($scope) {
    super();

    /**
     * The Angular scope.
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    getQueryManager().listen(goog.events.EventType.PROPERTYCHANGE, this.onQueriesChanged_, false, this);
    this.onQueriesChanged_();

    $scope.$on('$destroy', this.dispose.bind(this));
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    getQueryManager().unlisten(goog.events.EventType.PROPERTYCHANGE, this.onQueriesChanged_, false, this);

    this.scope_ = null;
  }

  /**
   * Handle changes to the query manager.
   *
   * @private
   */
  onQueriesChanged_() {
    if (this.scope_) {
      var qm = getQueryManager();
      var fm = getFilterManager();

      this.scope_['areaCount'] = 0;

      var states = qm.getAreaStates();
      for (var key in states) {
        if (key != AreaState.NONE) {
          this.scope_['areaCount'] += states[key];
        }
      }

      var filters = fm.getFilters() || [];
      this.scope_['filterCount'] = filters.reduce(function(result, filter, index) {
        return filter && qm.hasFilter(filter) ? result + 1 : result;
      }, 0);
    }

    apply(this.scope_);
  }
}
