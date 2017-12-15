goog.provide('os.ui.DescriptionInfoCtrl');
goog.provide('os.ui.SlickDescriptionAsyncRenderer');
goog.provide('os.ui.descriptionInfoDirective');
goog.provide('os.ui.formatter.DescriptionFormatter');
goog.require('goog.object');
goog.require('goog.string');
goog.require('ol.geom.Point');
goog.require('os.Fields');
goog.require('os.data.RecordField');
goog.require('os.defines');
goog.require('os.style');
goog.require('os.ui');
goog.require('os.ui.Module');
goog.require('os.ui.location.SimpleLocationDirective');
goog.require('os.ui.slick.formatter');
goog.require('os.ui.slick.slickGridDirective');
goog.require('os.ui.util.autoHeightDirective');
goog.require('os.ui.window');


/**
 * The descriptioninfo directive
 * @return {angular.Directive}
 */
os.ui.descriptionInfoDirective = function() {
  return {
    restrict: 'E',
    scope: {
      'description': '='
    },
    templateUrl: os.ROOT + 'views/descriptioninfo.html',
    controller: os.ui.DescriptionInfoCtrl,
    controllerAs: 'info'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('descriptioninfo', [os.ui.descriptionInfoDirective]);



/**
 * Controller function for the descriptioninfo directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.DescriptionInfoCtrl = function($scope, $element) {
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

  var sanitized = os.ui.sanitize(this.scope_.description || '');
  if (!goog.string.isEmptySafe(sanitized)) {
    // force anchor tags to launch a new tab
    sanitized = sanitized.replace(/<a /g, '<a target="_blank" ');

    var iframe = this.element_.find('iframe')[0];
    if (iframe) {
      var frameDoc = iframe.contentWindow.document;
      frameDoc.open();
      frameDoc.write(sanitized);
      frameDoc.close();
    }
  }

  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Clean up.
 * @private
 */
os.ui.DescriptionInfoCtrl.prototype.destroy_ = function() {
  this.scope_ = null;
  this.element_ = null;
};


/**
 * Launches a feature info window for the provided feature.
 * @param {!string} id The id to use for the window.
 * @param {!string} description The description string to display.
 * @param {string=} opt_titleDetail Title of the containing layer
 */
os.ui.launchDescriptionInfo = function(id, description, opt_titleDetail) {
  var winLabel = 'Description';

  if (opt_titleDetail) {
    winLabel += ' for ' + opt_titleDetail;
  }

  var windowId = goog.string.buildString('descriptionInfo', id);

  if (os.ui.window.exists(windowId)) {
    os.ui.window.bringToFront(windowId);
  } else {
    // create a new window
    var scopeOptions = {
      'description': description
    };

    // allowing this to be resizeable causes the mousewheel to not work on the external view
    var windowOptions = {
      'id': windowId,
      'label': winLabel,
      'icon': 'fa fa-newspaper-o lt-blue-icon',
      'x': 'center',
      'y': 'center',
      'width': '800',
      'min-width': '800',
      'max-width': '800',
      'height': '600',
      'min-height': '600',
      'max-height': '600',
      'show-close': 'true'
    };

    var template = '<descriptioninfo description="description"></descriptioninfo>';
    os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
};
goog.exportSymbol('os.ui.launchDescriptionInfo', os.ui.launchDescriptionInfo);


/**
 * Formats the source column
 * @param {number} row The row number
 * @param {number} cell The cell number in the row
 * @param {*} value The value
 * @param {Object} columnDef The column definition
 * @param {os.ui.slick.SlickTreeNode} node The node
 * @return {string} The HTML for the cell
 */
os.ui.formatter.DescriptionFormatter = function(row, cell, value, columnDef, node) {
  if (!value || typeof value !== 'string') {
    return '';
  }
  columnDef['asyncPostRender'] = os.ui.SlickDescriptionAsyncRenderer;
  return '<div class="location-properties-link">Show</div>';
};


/**
 *
 * @param {!Object} elem
 * @param {number} row
 * @param {Object} dataContext
 * @param {Object} colDef
 */
os.ui.SlickDescriptionAsyncRenderer = function(elem, row, dataContext, colDef) {
  if (dataContext) {
    // this is used for a DOM element id, so replace all non-word characters with underscores
    var id = String(dataContext.getId()).replace(/[\W]/g, '_');

    // match the description case
    var desc = /** @type {!string} */ (dataContext.get(os.Fields.DESCRIPTION));
    if (!desc) {
      desc = /** @type {!string} */ (dataContext.get(os.Fields.DESCRIPTION.toLowerCase()));
    }
    if (goog.isDefAndNotNull(desc) && typeof id === 'string') {
      var $elem = $(elem);
      var doc = elem.ownerDocument;
      var myWin = doc.defaultView || doc.parentWindow;
      $elem.click(function() {
        if (os.inIframe(myWin)) {
          os.ui.launchDescriptionInfo(id, desc);
        } else {
          myWin['os']['ui']['launchDescriptionInfo'](id, desc);
        }
      });
    }
  }
};
