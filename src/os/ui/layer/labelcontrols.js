goog.provide('os.ui.layer.LabelControlsCtrl');
goog.provide('os.ui.layer.labelControlsDirective');

goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('os.defines');
goog.require('os.metrics.Metrics');
goog.require('os.style.label');
goog.require('os.ui.Module');


/**
 * @enum {string}
 */
os.ui.layer.LabelControlsEventType = {
  COLUMN_CHANGE: 'labelcontrols:columnChange',
  SHOW_LABELS_CHANGE: 'labelcontrols:showLabelsChange'
};


/**
 * The labelcontrols directive
 * @return {angular.Directive}
 */
os.ui.layer.labelControlsDirective = function() {
  return {
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
    templateUrl: os.ROOT + 'views/layer/labelcontrols.html',
    controller: os.ui.layer.LabelControlsCtrl,
    controllerAs: 'labelCtrl'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('labelcontrols', [os.ui.layer.labelControlsDirective]);



/**
 * Controller function for the labelcontrols directive
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @param {!angular.$timeout} $timeout Angular timeout.
 * @extends {goog.Disposable}
 * @constructor
 * @ngInject
 */
os.ui.layer.LabelControlsCtrl = function($scope, $element, $timeout) {
  os.ui.layer.LabelControlsCtrl.base(this, 'constructor');

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
   * The maximum number of labels to allow.
   * @type {number}
   */
  this['labelLimit'] = os.settings.get(['maxLabels'], 5);

  // make the labels sortable via drag handle
  this.element.find('.js-label-container').sortable(this.getSortOptions());

  $timeout(this.validate_.bind(this));

  $scope.$on('$destroy', this.dispose.bind(this));
};
goog.inherits(os.ui.layer.LabelControlsCtrl, goog.Disposable);


/**
 * @inheritDoc
 */
os.ui.layer.LabelControlsCtrl.prototype.disposeInternal = function() {
  os.ui.layer.LabelControlsCtrl.base(this, 'disposeInternal');

  this.scope = null;
  this.element = null;
};


/**
 * Get options for the label sortable.
 * @return {!Object}
 * @protected
 */
os.ui.layer.LabelControlsCtrl.prototype.getSortOptions = function() {
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
};


/**
 * Handles column changes
 */
os.ui.layer.LabelControlsCtrl.prototype.onColumnChange = function() {
  if (this.scope) {
    this.sort_();
    this.validate_();

    this.scope.$emit(os.ui.layer.LabelControlsEventType.COLUMN_CHANGE);
  }
};
goog.exportProperty(
    os.ui.layer.LabelControlsCtrl.prototype,
    'onColumnChange',
    os.ui.layer.LabelControlsCtrl.prototype.onColumnChange);


/**
 * Handles changes to the show labels checkbox.
 * @protected
 */
os.ui.layer.LabelControlsCtrl.prototype.onShowLabelsChange = function() {
  if (this.scope) {
    this.scope.$emit(os.ui.layer.LabelControlsEventType.SHOW_LABELS_CHANGE, this.scope['showLabels']);
  }
};
goog.exportProperty(
    os.ui.layer.LabelControlsCtrl.prototype,
    'onShowLabelsChange',
    os.ui.layer.LabelControlsCtrl.prototype.onShowLabelsChange);


/**
 * Add a new label
 */
os.ui.layer.LabelControlsCtrl.prototype.addLabel = function() {
  this.scope['labels'].push(os.style.label.cloneConfig());
  this.onColumnChange();
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.Layer.LABEL_COLUMN_ADD, 1);
};
goog.exportProperty(
    os.ui.layer.LabelControlsCtrl.prototype,
    'addLabel',
    os.ui.layer.LabelControlsCtrl.prototype.addLabel);


/**
 * Remove a label
 * @param {os.style.label.LabelConfig} label
 */
os.ui.layer.LabelControlsCtrl.prototype.removeLabel = function(label) {
  goog.array.remove(this.scope['labels'], label);
  this.onColumnChange();
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.Layer.LABEL_COLUMN_REMOVE, 1);
};
goog.exportProperty(
    os.ui.layer.LabelControlsCtrl.prototype,
    'removeLabel',
    os.ui.layer.LabelControlsCtrl.prototype.removeLabel);


/**
 * Sort the labels so "None" labels are at the end of the list.
 * @private
 */
os.ui.layer.LabelControlsCtrl.prototype.sort_ = function() {
  if (this.scope && this.scope['labels']) {
    // sort the array in place so changes affect the array on label commands
    var labels = this.scope['labels'];
    var n = labels.length;
    while (n--) {
      if (labels[n]['column'] == null) {
        labels.push(labels.splice(n, 1)[0]);
      }
    }

    os.ui.apply(this.scope);
  }
};


/**
 * Validate the form.
 * @private
 */
os.ui.layer.LabelControlsCtrl.prototype.validate_ = function() {
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

    os.ui.apply(this.scope);
  }
};


/**
 * Handle label drag start.
 * @param {!jQuery.Event} event
 * @param {!{item: jQuery, placeholder: jQuery}} ui
 * @protected
 */
os.ui.layer.LabelControlsCtrl.prototype.onDragStart = function(event, ui) {
  // add a buffer to the bottom of the containment to account for the container padding
  var sortable = this.element.find('.c-labelcontainer').sortable('instance');
  if (sortable && sortable['containment']) {
    sortable['containment'][3] += 3;
  }

  // placeholder should be the same height as the item being dragged so the container size doesn't change
  if (ui['helper'] && ui['placeholder']) {
    ui['placeholder'].height(ui['helper'].height());
  }

  if (ui['item']) {
    // show the grippy dragging cursor
    ui['item'].find('.handle').addClass('moving');

    // save the start index
    this.startIndex_ = ui['item'].index();
  }
};


/**
 * Handle label drag end.
 * @param {!jQuery.Event} event
 * @param {!{item: Element}} ui
 * @protected
 */
os.ui.layer.LabelControlsCtrl.prototype.onDragEnd = function(event, ui) {
  if (ui['item']) {
    // revert to grippy hover cursor
    ui['item'].find('.handle').removeClass('moving');

    // if the index changed, update the label order
    var stopIndex = ui['item'].index();
    if (this.startIndex_ != stopIndex) {
      goog.array.moveItem(this.scope['labels'], this.startIndex_, stopIndex);
      os.ui.apply(this.scope);
      this.onColumnChange();
    }
  }
};
