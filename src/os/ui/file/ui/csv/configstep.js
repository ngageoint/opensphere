goog.provide('os.ui.file.ui.csv.ConfigStep');
goog.provide('os.ui.file.ui.csv.ConfigStepCtrl');
goog.provide('os.ui.file.ui.csv.configStepDirective');

goog.require('goog.array');
goog.require('goog.object');
goog.require('os.im.mapping.MappingManager');
goog.require('os.parse.csv');
goog.require('os.parse.csv.CsvParserConfig');
goog.require('os.ui.Module');
goog.require('os.ui.slick.SlickGridEvent');
goog.require('os.ui.spinnerDirective');
goog.require('os.ui.wiz.step.AbstractWizardStep');
goog.require('os.ui.wiz.step.WizardStepEvent');
goog.require('os.ui.wiz.wizardPreviewDirective');



/**
 * CSV import data step
 *
 * @extends {os.ui.wiz.step.AbstractWizardStep.<os.parse.csv.CsvParserConfig>}
 * @param {angular.$compile=} opt_compile Angular compile function
 * @constructor
 */
os.ui.file.ui.csv.ConfigStep = function(opt_compile) {
  os.ui.file.ui.csv.ConfigStep.base(this, 'constructor', opt_compile);
  this.template = '<csvconfigstep></csvconfigstep>';
  this.title = 'Configuration';
};
goog.inherits(os.ui.file.ui.csv.ConfigStep, os.ui.wiz.step.AbstractWizardStep);


/**
 * @inheritDoc
 */
os.ui.file.ui.csv.ConfigStep.prototype.finalize = function(config) {
  try {
    config.updatePreview();

    var features = config['preview'].slice(0, 24);
    if ((!config['mappings'] || config['mappings'].length <= 0) && features && features.length > 0) {
      // no mappings have been set yet, so try to auto detect them
      var mm = os.im.mapping.MappingManager.getInstance();
      var mappings = mm.autoDetect(features);
      if (mappings && mappings.length > 0) {
        config['mappings'] = mappings;
      }
    }
  } catch (e) {
  }
};


/**
 * The CSV import data step directive
 *
 * @return {angular.Directive}
 */
os.ui.file.ui.csv.configStepDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/file/csv/configstep.html',
    controller: os.ui.file.ui.csv.ConfigStepCtrl,
    controllerAs: 'configStep'
  };
};


/**
 * Add the directive to the os-ui module
 */
os.ui.Module.directive('csvconfigstep', [os.ui.file.ui.csv.configStepDirective]);



/**
 * Controller for the CSV import data step
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.$timeout} $timeout
 * @constructor
 * @ngInject
 */
os.ui.file.ui.csv.ConfigStepCtrl = function($scope, $timeout) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {?angular.$timeout}
   * @private
   */
  this.timeout_ = $timeout;

  /**
   * @type {os.parse.csv.CsvParserConfig}
   * @private
   */
  this.config_ = /** @type {os.parse.csv.CsvParserConfig} */ ($scope['config']);

  /**
   * @type {Object.<string, string>}
   */
  this['delimiters'] = os.parse.csv.DELIMITERS;

  /**
   * @type {Object.<string, string>}
   */
  this['commentChars'] = os.parse.csv.COMMENT_CHARS;

  /**
   * @type {Array.<Object.<string, *>>}
   */
  this['linePreviewRows'] = [];

  var maxWidth = 0;
  for (var i = 0, n = this.config_['linePreview'].length; i < n; i++) {
    maxWidth = Math.max(os.ui.measureText(this.config_['linePreview'][i]).width, maxWidth);
    this['linePreviewRows'].push({
      'id': i + 1,
      'line': this.config_['linePreview'][i]
    });
  }

  /**
   * Line preview columns.
   * @type {Array.<Object.<string, *>>}
   */
  this['linePreviewColumns'] = [
    {
      'id': 'id',
      'name': 'ID',
      'field': 'id',
      'minWidth': 25,
      'width': 25,
      'resizable': false,
      'selectable': false,
      'sortable': false
    },
    {
      'id': 'line',
      'name': 'Line',
      'field': 'line',
      'selectable': false,
      'sortable': false,
      'width': maxWidth
    }
  ];

  /**
   * Line preview grid options.
   * @type {Object.<string, *>}
   */
  this['linePreviewOptions'] = {
    'fullWidthRows': true,
    'multiSelect': false,
    'useRowRenderEvents': true,
    'headerRowHeight': 0,
    'rowHeight': 21
  };

  $scope.$on('headerRow.spinstop', this.scheduleUpdate_.bind(this));
  $scope.$on('dataRow.spinstop', this.scheduleUpdate_.bind(this));
  $scope.$on('$destroy', this.destroy_.bind(this));
  this.updatePreview();
};


/**
 * @private
 */
os.ui.file.ui.csv.ConfigStepCtrl.prototype.destroy_ = function() {
  this.scope_ = null;
  this.config_ = null;
  this.timeout_ = null;
};


/**
 * Updates the preview after the next $apply to allow the configuration to update.
 *
 * @private
 */
os.ui.file.ui.csv.ConfigStepCtrl.prototype.scheduleUpdate_ = function() {
  this.timeout_(this.updatePreview.bind(this));
};


/**
 * Creates a preview using a subset of the source content.
 *
 * @export
 */
os.ui.file.ui.csv.ConfigStepCtrl.prototype.updatePreview = function() {
  // don't apply mappings during CSV configuration
  this.config_.updatePreview();

  this.timeout_(this.invalidateGrids.bind(this));
};


/**
 * Refresh the child slickgrids
 */
os.ui.file.ui.csv.ConfigStepCtrl.prototype.invalidateGrids = function() {
  if (this.scope_) {
    this.scope_.$broadcast(os.ui.slick.SlickGridEvent.INVALIDATE_ROWS);
    this.scope_.$broadcast(os.ui.slick.SlickGridEvent.INVALIDATE_COLUMNS);
  }
};
