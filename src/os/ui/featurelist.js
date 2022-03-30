goog.declareModuleId('os.ui.FeatureListUI');

import {listen, unlistenByKey} from 'ol/src/events.js';

import './slider.js';
import './sourcegrid.js';
import LayerEventType from '../events/layereventtype.js';
import SelectionType from '../events/selectiontype.js';
import {getMapContainer} from '../map/mapinstance.js';
import {ROOT} from '../os.js';
import PropertyChange from '../source/propertychange.js';
import * as list from './menu/listmenu.js';
import Module from './module.js';
import {apply, sanitizeId} from './ui.js';
import {bringToFront, close, create, exists} from './window.js';

const {assert} = goog.require('goog.asserts');
const GoogEventType = goog.require('goog.events.EventType');
const {containsValue} = goog.require('goog.object');

const {default: LayerEvent} = goog.requireType('os.events.LayerEvent');
const {default: PropertyChangeEvent} = goog.requireType('os.events.PropertyChangeEvent');
const {default: VectorSource} = goog.requireType('os.source.Vector');
const {default: Menu} = goog.requireType('os.ui.menu.Menu');


/**
 * The `featurelist` directive. Displays vector source features in a grid.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'source': '='
  },
  templateUrl: ROOT + 'views/windows/featurelist.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'featurelist';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller class for the feature list.
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * The Angular scope.
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    /**
     * The root DOM element.
     * @type {?angular.JQLite}
     * @private
     */
    this.element_ = $element;

    /**
     * The vector source.
     * @type {VectorSource}
     * @private
     */
    this.source_ = /** @type {VectorSource} */ ($scope['source']);

    /**
     * The context menu for the source grid.
     * @type {Menu}
     */
    this['contextMenu'] = list.getMenu();

    /**
     * If data should be filtered to selected only.
     * @type {boolean}
     */
    this['selectedOnly'] = false;

    /**
     * The grid row height.
     * @type {number}
     */
    this['rowHeight'] = 0;

    /**
     * The row height control step value.
     * @type {number}
     */
    this['rowStep'] = 1;

    /**
     * The status message to display in the footer.
     * @type {string}
     */
    this['status'] = '';

    /**
     * Identifier for control id's.
     * @type {string}
     */
    this['uid'] = sanitizeId('featureList-' + this.source_.getId());

    assert(this.source_ != null, 'Feature list source must be defined');
    this.listenKey = listen(this.source_, GoogEventType.PROPERTYCHANGE, this.onSourceChange_, this);
    $scope.$watch('ctrl.rowStep', this.updateRowHeight_.bind(this));

    var map = getMapContainer();
    map.listen(LayerEventType.REMOVE, this.onLayerRemoved_, false, this);

    this.updateRowHeight_();
    this.updateStatus_();
  }

  /**
   * Angular $onDestroy lifecycle hook.
   */
  $onDestroy() {
    var map = getMapContainer();
    map.unlisten(LayerEventType.REMOVE, this.onLayerRemoved_, false, this);

    if (this.source_) {
      unlistenByKey(this.listenKey);
      this.source_ = null;
    }

    this.scope_ = null;
    this.element_ = null;
  }

  /**
   * Closes the window.
   *
   * @export
   */
  close() {
    close(this.element_);
  }

  /**
   * Updates the row height based on the step
   *
   * @private
   */
  updateRowHeight_() {
    this['rowHeight'] = (Controller.DEFAULT_ROW_HEIGHT * this['rowStep']) + 4;
  }

  /**
   * Handles layer removed event from the map.
   *
   * @param {LayerEvent} event The layer event.
   * @private
   */
  onLayerRemoved_(event) {
    if (event.layer && event.layer.getSource() === this.source_) {
      // close the window if the layer is removed
      this.close();
    }
  }

  /**
   * Handles change events on the source.
   *
   * @param {PropertyChangeEvent} e The change event.
   * @private
   */
  onSourceChange_(e) {
    var p = e.getProperty();
    if (p === PropertyChange.FEATURES || p === PropertyChange.FEATURE_VISIBILITY || containsValue(SelectionType, p)) {
      // refresh status if the features or selection changes
      this.updateStatus_();
      apply(this.scope_);
    }
  }

  /**
   * Updates the status text for the current source.
   *
   * @private
   */
  updateStatus_() {
    var message = '';

    if (this.source_ && !this.source_.isDisposed()) {
      var details = [];

      var selected = this.source_.getSelectedItems();
      if (selected && selected.length > 0) {
        details.push(selected.length + ' selected');
      }

      var model = this.source_.getTimeModel();
      if (model) {
        var total = model.getSize();
        var shown = this.source_.getFilteredFeatures().length;
        if (total > 0) {
          message += shown + ' record' + (shown != 1 ? 's' : '');

          var hidden = total - shown;
          if (hidden > 0) {
            details.push(hidden + ' hidden');
          }
        }
      } else {
        var total = this.source_.getFeatures();
        if (total && total.length > 0) {
          message += total.length + ' record' + (total.length != 1 ? 's' : '');
        }
      }

      if (this['selectedOnly']) {
        details.push('showing selected only');
      }

      if (details.length > 0) {
        message += ' (' + details.join(', ') + ')';
      }
    }

    this['status'] = message;
  }
}

/**
 * The default row height, excluding padding.
 * @type {number}
 * @const
 */
Controller.DEFAULT_ROW_HEIGHT = 21;

/**
 * Launches a feature list for a source.
 *
 * @param {!VectorSource} source The source.
 */
export const launchFeatureList = function(source) {
  // only launch a single window per source
  var windowId = sanitizeId('featureList-' + source.getId());
  if (exists(windowId)) {
    bringToFront(windowId);
  } else {
    var scopeOptions = {
      'source': source
    };

    var windowOptions = {
      'id': windowId,
      'label': source.getTitle(true),
      'icon': 'fa fa-table',
      'x': 'center',
      'y': 'center',
      'width': 800,
      'min-width': 600,
      'max-width': 2000,
      'height': 600,
      'min-height': 400,
      'max-height': 2000,
      'modal': false,
      'show-close': true
    };

    var template = `<${directiveTag} source="source"></${directiveTag}>`;
    create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
};
