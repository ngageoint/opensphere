goog.module('os.ui.wiz.WizardPreviewUI');

goog.require('os.ui.slick.SlickGridUI');
goog.require('os.ui.slick.SlickHeaderButtonUI');

const {ROOT} = goog.require('os');
const mapping = goog.require('os.im.mapping');
const ui = goog.require('os.ui');
const Module = goog.require('os.ui.Module');

const ColumnDefinition = goog.requireType('os.data.ColumnDefinition');


/**
 * The import wizard preview directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'config': '=',
    'resizeWith': '@'
  },
  templateUrl: ROOT + 'views/wiz/wizardpreview.html',
  controller: Controller,
  controllerAs: 'wizPreview'
});


/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'wizardpreview';


/**
 * Add the directive to the ui module
 */
Module.directive('wizardpreview', [directive]);


/**
 * Controller for the wizard preview directive
 * @unrestricted
 */
class Controller {
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
     * @type {?angular.$timeout}
     * @private
     */
    this.timeout_ = $timeout;

    /**
     * Grid options.
     * @type {Object.<string, *>}
     */
    this['options'] = {
      'dataItemColumnValueExtractor': this.getValue_,
      'enableColumnReorder': false,
      'fullWidthRows': false,
      'multiSelect': false,
      'rowHeight': 21,
      'useRowRenderEvents': true
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
      ui.resize(this.container_, this.resizeFn_);
      this.resizePreview_(500);
    }

    $scope.$on('resizePreview', this.onResize_.bind(this));
    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * Clean up references/listeners.
   *
   * @private
   */
  destroy_() {
    if (this.container_) {
      if (this.resizeFn_) {
        ui.removeResize(this.container_, this.resizeFn_);
        this.resizeFn_ = null;
      }

      this.container_ = null;
    }

    this.timeout_ = null;
    this.element_ = null;
    this.scope_ = null;
  }

  /**
   * Handle resize events received on the scope.
   *
   * @param {angular.Scope.Event} event
   * @param {number=} opt_delay Timeout delay for the resize.
   * @private
   */
  onResize_(event, opt_delay) {
    this.resizePreview_(opt_delay);
  }

  /**
   * Resizes the preview pane to use available space.
   *
   * @param {number=} opt_delay Timeout delay for the resize.
   * @private
   */
  resizePreview_(opt_delay) {
    this.timeout_(function() {
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
    }.bind(this), opt_delay);
  }

  /**
   * Gets a value from an object
   *
   * @param {Object} item
   * @param {(ColumnDefinition|string)} col
   * @return {*} The value
   * @private
   */
  getValue_(item, col) {
    var field = typeof col === 'string' ? col : col['field'];
    return mapping.getItemField(item, field);
  }

  /**
   * Updates whether to include the column or not
   * There must be a minimum of two columns
   *
   * @param {ColumnDefinition} column
   * @param {Object} button
   * @param {string} command
   * @param {Array.<os.data.ColumnDefinition>} columns
   */
  onCommand(column, button, command, columns) {
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
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
