goog.declareModuleId('os.ui.layer.LabelControlsUI');

import {remove} from 'ol/src/array.js';

import '../geo/position.js';
import Settings from '../../config/settings.js';
import Metrics from '../../metrics/metrics.js';
import {Layer} from '../../metrics/metricskeys.js';
import {ROOT} from '../../os.js';
import {MAX_SIZE, MIN_SIZE, cloneConfig} from '../../style/label.js';
import Module from '../module.js';
import {apply} from '../ui.js';
import LabelControlsEventType from './labelcontrolseventtype.js';

const Disposable = goog.require('goog.Disposable');
const {moveItem} = goog.require('goog.array');

const {LabelConfig} = goog.requireType('os.style.label');


/**
 * The labelcontrols directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'labels': '=',
    'columns': '=',
    'labelColor': '=',
    'labelSize': '=',
    'showLabels': '=?',
    'required': '=?',
    'alwaysShowLabels': '@'
  },
  templateUrl: ROOT + 'views/layer/labelcontrols.html',
  controller: Controller,
  controllerAs: 'labelCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'labelcontrols';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the labelcontrols directive
 * @unrestricted
 */
export class Controller extends Disposable {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @param {!angular.$timeout} $timeout Angular timeout.
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
    super();

    /**
     * The Angular scope.
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;

    /**
     * The root DOM element.
     * @type {?angular.JQLite}
     * @protected
     */
    this.element = $element;

    /**
     * The start index for drag operations.
     * @type {number}
     * @private
     */
    this.startIndex_ = -1;

    /**
     * The maximum label size.
     * @type {number}
     */
    this['maxSize'] = MAX_SIZE;

    /**
     * The minimum label size.
     * @type {number}
     */
    this['minSize'] = MIN_SIZE;

    /**
     * The maximum number of labels to allow.
     * @type {number}
     */
    this['labelLimit'] = Settings.getInstance().get(['maxLabels'], 5);

    // make the labels sortable via drag handle
    this.element.find('.js-label-container').sortable(this.getSortOptions());

    $timeout(this.validate_.bind(this));

    $scope.$on('$destroy', this.dispose.bind(this));
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    this.scope = null;
    this.element = null;
  }

  /**
   * Get options for the label sortable.
   *
   * @return {!Object}
   * @protected
   */
  getSortOptions() {
    return {
      'items': 'tr',
      'handle': '.js-handle',
      'axis': 'y',
      'containment': 'parent',
      'snap': true,
      'tolerance': 'pointer',
      'start': this.onDragStart.bind(this),
      'stop': this.onDragEnd.bind(this)
    };
  }

  /**
   * Handles column changes
   *
   * @export
   */
  onColumnChange() {
    if (this.scope) {
      this.sort_();
      this.validate_();

      this.scope.$emit(LabelControlsEventType.COLUMN_CHANGE);
    }
  }

  /**
   * Handles changes to the show labels checkbox.
   *
   * @export
   */
  onShowLabelsChange() {
    if (this.scope) {
      this.scope.$emit(LabelControlsEventType.SHOW_LABELS_CHANGE, this.scope['showLabels']);
    }
  }

  /**
   * Add a new label
   *
   * @export
   */
  addLabel() {
    this.scope['labels'].push(cloneConfig());
    this.onColumnChange();
    Metrics.getInstance().updateMetric(Layer.LABEL_COLUMN_ADD, 1);
  }

  /**
   * Remove a label
   *
   * @param {LabelConfig} label
   * @export
   */
  removeLabel(label) {
    remove(this.scope['labels'], label);
    this.onColumnChange();
    Metrics.getInstance().updateMetric(Layer.LABEL_COLUMN_REMOVE, 1);
  }

  /**
   * Sort the labels so "None" labels are at the end of the list.
   *
   * @private
   */
  sort_() {
    if (this.scope && this.scope['labels']) {
      // sort the array in place so changes affect the array on label commands
      var labels = this.scope['labels'];
      var n = labels.length;
      while (n--) {
        if (labels[n]['column'] == null) {
          labels.push(labels.splice(n, 1)[0]);
        }
      }

      apply(this.scope);
    }
  }

  /**
   * Validate the form.
   *
   * @private
   */
  validate_() {
    if (this.scope && this.scope['labels']) {
      var labelForm = /** @type {angular.NgModelController} */ (this.scope['labelForm']);
      if (labelForm) {
        if (this.scope['required']) {
          labelForm.$setValidity('columnRequired', this.scope['labels'].some(function(obj) {
            return !!obj['column'];
          }));
        } else {
          labelForm.$setValidity('columnRequired', true);
        }
      }

      apply(this.scope);
    }
  }

  /**
   * Handle label drag start.
   *
   * @param {!jQuery.Event} event
   * @param {!{item: jQuery, placeholder: jQuery}} ui
   * @protected
   */
  onDragStart(event, ui) {
    // add a buffer to the bottom of the containment to account for the container padding
    var sortable = this.element.find('.js-label-container').sortable('instance');
    if (sortable && sortable['containment']) {
      sortable['containment'][3] += 3;
    }

    // placeholder should be the same height as the item being dragged so the container size doesn't change
    if (ui['helper'] && ui['placeholder']) {
      ui['placeholder'].height(ui['helper'].height());
    }

    if (ui['item']) {
      // show the grippy dragging cursor
      ui['item'].find('.js-handle').addClass('moving');

      // save the start index
      this.startIndex_ = ui['item'].index();
    }
  }

  /**
   * Handle label drag end.
   *
   * @param {!jQuery.Event} event
   * @param {!{item: Element}} ui
   * @protected
   */
  onDragEnd(event, ui) {
    if (ui['item']) {
      // revert to grippy hover cursor
      ui['item'].find('.js-handle').removeClass('moving');

      // if the index changed, update the label order
      var stopIndex = ui['item'].index();
      if (this.startIndex_ != stopIndex) {
        moveItem(this.scope['labels'], this.startIndex_, stopIndex);
        apply(this.scope);
        this.onColumnChange();
      }
    }
  }
}
