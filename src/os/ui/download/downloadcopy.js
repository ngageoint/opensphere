goog.provide('os.ui.download.DownloadCopyCtrl');
goog.provide('os.ui.download.downloadCopyDirective');
goog.require('goog.array');
goog.require('os.ui.Module');


/**
 * The downloadCopy directive.  Creates a pick list of format options along with download and copy buttons to match.
 * If only one option is provided, the pick list is not necessary and only the buttons are shown.
 * @return {angular.Directive}
 */
os.ui.download.downloadCopyDirective = function() {
  return {
    restrict: 'E',
    scope: {
      /**
       * An array of pick list option configs - names and corresponding urls.
       * E.g.: [{'name':'CSV', 'url', 'http://dl.csv'}]
       * type {?Array.<{name:!string, url:!string}>}
       */
      'options': '=',
      /**
       * Optional. Expression to evaluate when the buttons should be disabled.
       * type {boolean=}
       */
      'xdisabled': '=?'
    },
    templateUrl: os.ROOT + 'views/download/downloadcopy.html',
    controller: os.ui.download.DownloadCopyCtrl,
    controllerAs: 'downloadCopy'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('downloadCopy', [os.ui.download.downloadCopyDirective]);



/**
 * Controller function for the downloadCopy directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.download.DownloadCopyCtrl = function($scope, $element) {
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

  this['selectedOption'] = null;
  $scope['showCopy'] = false;

  /**
   * Remember the last selected name.
   * @type {?string}
   * @private
   */
  this.lastSelectedName_ = null;

  $scope.$watch('options', this.onOptionsChange_.bind(this));
  $scope.$watch('downloadCopy.selectedOption', this.onSelectedChange_.bind(this));

  this.scope_['downloadIconClass'] = 'fa fa-download';
  this.scope_['downloadTitle'] = '';
  this.scope_['downloadTooltip'] = 'Download';
};


/**
 * Handle selection change
 * @private
 */
os.ui.download.DownloadCopyCtrl.prototype.onSelectedChange_ = function() {
  this.lastSelectedName_ = goog.isDefAndNotNull(this['selectedOption']) ? this['selectedOption']['name'] : null;
};


/**
 * Handle options changed
 * @private
 */
os.ui.download.DownloadCopyCtrl.prototype.onOptionsChange_ = function() {
  this.initSelected_();
};


/**
 * @private
 */
os.ui.download.DownloadCopyCtrl.prototype.initSelected_ = function() {
  if (this.scope_['options'] && this.scope_['options'].length > 0) {
    // keep the option selected with the same name as before
    if (this.lastSelectedName_) {
      var optionByName = goog.array.find(this.scope_['options'], function(option) {
        return option['name'] === this.lastSelectedName_;
      }, this);
      this['selectedOption'] = optionByName;
    } else {
      this['selectedOption'] = this.scope_['options'][0];
    }

    this.setupDownloadButton_(this['selectedOption']);
  } else {
    this.toggleCopy(true);
  }
};


/**
 * Download the file
 */
os.ui.download.DownloadCopyCtrl.prototype.download = function() {
  window.open(this['selectedOption']['url'], '_self');
};
goog.exportProperty(
    os.ui.download.DownloadCopyCtrl.prototype,
    'download',
    os.ui.download.DownloadCopyCtrl.prototype.download);


/**
 * Display the copy URL input
 * @param {boolean=} opt_forceclose
 */
os.ui.download.DownloadCopyCtrl.prototype.toggleCopy = function(opt_forceclose) {
  var el = this.element_.find('#copyInput');
  if (!goog.isDef(opt_forceclose)) {
    el.toggleClass('open');
    this.scope_['showCopy'] = el.hasClass('open');
    if (this.scope_['showCopy']) {
      el.select();
    }
  } else {
    el.removeClass('open');
    this.scope_['showCopy'] = false;
  }
};
goog.exportProperty(
    os.ui.download.DownloadCopyCtrl.prototype,
    'toggleCopy',
    os.ui.download.DownloadCopyCtrl.prototype.toggleCopy);


/**
 * Set Download Button options
 * @param {(Object|Array)} options
 * @private
 */
os.ui.download.DownloadCopyCtrl.prototype.setupDownloadButton_ = function(options) {
  if (options['buttonoverride']) {
    this.scope_['downloadIconClass'] = options['iconclass'] || this.scope_['downloadIconClass'];
    this.scope_['downloadTitle'] = options['title'] || this.scope_['downloadTitle'];
    this.scope_['downloadTooltip'] = options['tooltip'] || this.scope_['downloadTooltip'];
  }
};
