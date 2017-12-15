goog.provide('os.ui.wiz.WizardPreviewCtrl');
goog.provide('os.ui.wiz.wizardPreviewDirective');

goog.require('os.data.ColumnDefinition');
goog.require('os.im.mapping');
goog.require('os.ui.Module');
goog.require('os.ui.slick.slickGridDirective');
goog.require('os.ui.slick.slickHeaderButtonDirective');


/**
 * The import wizard preview directive
 * @return {angular.Directive}
 */
os.ui.wiz.wizardPreviewDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'config': '=',
      'resizeWith': '@'
    },
    templateUrl: os.ROOT + 'views/wiz/wizardpreview.html',
    controller: os.ui.wiz.WizardPreviewCtrl,
    controllerAs: 'wizPreview'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('wizardpreview', [os.ui.wiz.wizardPreviewDirective]);



/**
 * Controller for the wizard preview directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @constructor
 * @ngInject
 */
os.ui.wiz.WizardPreviewCtrl = function($scope, $element, $timeout) {
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
   * @type {?angular.$timeout}
   * @private
   */
  this.timeout_ = $timeout;

  var avgColWidth;
  try {
    avgColWidth = $element.width() / $scope['config']['columns'].length;
  } catch (e) {
    avgColWidth = 0;
  }

  /**
   * Grid options.
   * @type {Object.<string, *>}
   */
  this['options'] = {
    'dataItemColumnValueExtractor': this.getValue_,
    'defaultColumnWidth': 120,
    'enableColumnReorder': false,
    'fullWidthRows': true,
    'forceFitColumns': avgColWidth >= 200,
    'multiSelect': false,
    'rowHeight': 21
  };

  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.container_ = null;

  /**
   * @type {?function()}
   * @private
   */
  this.resizeFn_ = null;

  if ($scope['resizeWith']) {
    this.resizeFn_ = this.resizePreview_.bind(this);
    this.container_ = $element.parents($scope['resizeWith']);
    this.container_.resize(this.resizeFn_);
    this.resizePreview_(500);
  }

  $scope.$on('resizePreview', this.onResize_.bind(this));
  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Clean up references/listeners.
 * @private
 */
os.ui.wiz.WizardPreviewCtrl.prototype.destroy_ = function() {
  if (this.container_) {
    if (this.resizeFn_) {
      this.container_.removeResize(this.resizeFn_);
      this.resizeFn_ = null;
    }

    this.container_ = null;
  }

  this.timeout_ = null;
  this.element_ = null;
  this.scope_ = null;
};


/**
 * Handle resize events received on the scope.
 * @param {angular.Scope.Event} event
 * @param {number=} opt_delay Timeout delay for the resize.
 * @private
 */
os.ui.wiz.WizardPreviewCtrl.prototype.onResize_ = function(event, opt_delay) {
  this.resizePreview_(opt_delay);
};


/**
 * Resizes the preview pane to use available space.
 * @param {number=} opt_delay Timeout delay for the resize.
 * @private
 */
os.ui.wiz.WizardPreviewCtrl.prototype.resizePreview_ = function(opt_delay) {
  this.timeout_(goog.bind(function() {
    if (this.element_ && this.scope_) {
      var sibHeight = 0;
      var siblings = this.element_.siblings();
      for (var i = 0, n = siblings.length; i < n; i++) {
        sibHeight += $(siblings[i]).outerHeight();
      }

      var oldHeight = this.element_.height();
      var previewHeight = Math.max(this.element_.parent().outerHeight() - sibHeight - 2, 0);
      if (previewHeight && oldHeight != previewHeight) {
        this.element_.height(previewHeight);
        this.scope_.$broadcast('resize');
      }
    }
  }, this), opt_delay);
};


/**
 * Gets a value from an object
 * @param {Object} item
 * @param {(os.data.ColumnDefinition|string)} col
 * @return {*} The value
 * @private
 */
os.ui.wiz.WizardPreviewCtrl.prototype.getValue_ = function(item, col) {
  var field = goog.isString(col) ? col : col['field'];
  return os.im.mapping.getItemField(item, field);
};


/**
 * Updates whether to include the column or not
 * There must be a minimum of two columns
 * @param {os.data.ColumnDefinition} column
 * @param {Object} button
 * @param {string} command
 * @param {Array.<os.data.ColumnDefinition>} columns
 */
os.ui.wiz.WizardPreviewCtrl.prototype.onCommand = function(column, button, command, columns) {
  var count = 0;
  for (var i = 0, ii = columns.length; i < ii; i++) {
    if (columns[i]['include']) {
      count++;
    }
  }

  if (command === 'exclude-column' && (count - 1) > 1) {
    button['cssClass'] = 'fa fa-square-o slick-header-buttons';
    button['tooltip'] = 'Check to include column';
    button['command'] = 'include-column';
    column['include'] = false;
  } else if (command === 'include-column') {
    button['cssClass'] = 'fa fa-check-square-o slick-header-buttons';
    button['tooltip'] = 'Uncheck to exclude column';
    button['command'] = 'exclude-column';
    column['include'] = true;
  }
};
