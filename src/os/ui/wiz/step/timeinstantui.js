goog.provide('os.ui.wiz.step.TimeInstantUICtrl');
goog.provide('os.ui.wiz.step.timeInstantUIDirective');

goog.require('goog.array');
goog.require('os.time');
goog.require('os.ui.Module');


/**
 * The import wizard time instant ui directive
 * @return {angular.Directive}
 */
os.ui.wiz.step.timeInstantUIDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'config': '=',
      'model': '=',
      'valid': '=',
      'label': '@'
    },
    templateUrl: os.ROOT + 'views/wiz/timeinstantui.html',
    controller: os.ui.wiz.step.TimeInstantUICtrl,
    controllerAs: 'tiUI'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('timeinstantui', [os.ui.wiz.step.timeInstantUIDirective]);



/**
 * Controller for the import wizard time instant ui
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.ui.wiz.step.TimeInstantUICtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {os.ui.im.mapping.time.TimeMappingModel}
   * @private
   */
  this.model_ = $scope['model'];

  /**
   * @type {os.parse.BaseParserConfig}
   * @private
   */
  this.config_ = $scope['config'];

  /**
   * @type {Array.<string>}
   */
  this['dtFormats'] = os.time.DATETIME_FORMATS;

  /**
   * @type {Array.<string>}
   */
  this['dFormats'] = os.time.DATE_FORMATS;

  /**
   * @type {Array.<string>}
   */
  this['tFormats'] = os.time.TIME_FORMATS;

  /**
   * @type {string}
   */
  this['dateFormat'] = '';

  /**
   * @type {string}
   */
  this['timeFormat'] = '';

  /**
   * @type {Array.<string>}
   */
  this['types'] = [
    {'id': 'combined', 'label': 'Date/Time'},
    {'id': 'separate', 'label': 'Separate Date and Time'},
    {'id': 'dateonly', 'label': 'Date Only'}
  ];

  /**
   * @type {string}
   */
  this['sample'] = '';

  /**
   * @type {?string}
   */
  this['result'] = null;

  this.initialize_();
  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * @type {string}
 * @const
 */
os.ui.wiz.step.TimeInstantUICtrl.NO_DATE = 'Please choose a Date column.';


/**
 * @type {string}
 * @const
 */
os.ui.wiz.step.TimeInstantUICtrl.NO_DATETIME = 'Please choose Date and Time columns.';


/**
 * @type {string}
 * @const
 */
os.ui.wiz.step.TimeInstantUICtrl.NO_PREVIEW = 'No preview data available. Please check the import configuration.';


/**
 * @private
 */
os.ui.wiz.step.TimeInstantUICtrl.prototype.destroy_ = function() {
  this.scope_ = null;
};


/**
 * @private
 */
os.ui.wiz.step.TimeInstantUICtrl.prototype.initialize_ = function() {
  if (this.model_['dateType'] == 'combined') {
    this['dateFormat'] = goog.array.contains(this['dtFormats'], this.model_['dateFormat']) ?
        this.model_['dateFormat'] : 'Custom';
  } else {
    this['dateFormat'] = goog.array.contains(this['dFormats'], this.model_['dateFormat']) ?
        this.model_['dateFormat'] : 'Custom';

    if (this.model_['dateType'] == 'separate') {
      this['timeFormat'] = goog.array.contains(this['tFormats'], this.model_['timeFormat']) ?
          this.model_['timeFormat'] : 'Custom';
    }
  }

  this.updateSample_();
};


/**
 * Updates the sample field with the first row of the selected column(s).
 * @private
 */
os.ui.wiz.step.TimeInstantUICtrl.prototype.updateSample_ = function() {
  this.scope_['valid'] = false;
  this['sample'] = null;
  this['result'] = null;

  if (this.config_['preview'] && this.config_['preview'].length > 0) {
    if (this.model_['dateColumn']) {
      var dateVal = this.getPreviewField_(this.model_['dateColumn']);
      this['sample'] = dateVal;
    }

    if (this.model_['dateType'] == 'separate' && this.model_['timeColumn']) {
      // make sure sample isn't null
      this['sample'] = this['sample'] || '';

      var timeVal = this.getPreviewField_(this.model_['timeColumn']);
      this['sample'] += (this['sample'] ? ' ' : '') + timeVal;
    }

    if (this['sample'] == null) {
      // couldn't find either column
      this['sample'] = this.model_['dateType'] == 'separate' ? os.ui.wiz.step.TimeInstantUICtrl.NO_DATETIME :
          os.ui.wiz.step.TimeInstantUICtrl.NO_DATE;
    } else {
      this.updateResult_();
    }
  } else {
    this['sample'] = os.ui.wiz.step.TimeInstantUICtrl.NO_PREVIEW;
  }
};


/**
 * Search preview data for the first non-empty field value.
 * @param {string} field
 * @return {string}
 * @private
 */
os.ui.wiz.step.TimeInstantUICtrl.prototype.getPreviewField_ = function(field) {
  var result = '';

  for (var i = 0, n = this.config_['preview'].length; i < n && !result; i++) {
    var item = this.config_['preview'][i];
    result = goog.string.trim(String(os.im.mapping.getItemField(item, field) || ''));
  }

  return result;
};


/**
 * Updates the result field if all columns have been selected and formats chosen.
 * @private
 */
os.ui.wiz.step.TimeInstantUICtrl.prototype.updateResult_ = function() {
  var format = null;
  if (this.model_['dateType'] == 'separate' && this.model_['dateColumn'] && this.model_['timeColumn'] &&
      this.model_['dateFormat'] && this.model_['timeFormat']) {
    // don't try parsing until all columns and formats have a value
    format = this.model_['dateFormat'] + ' ' + this.model_['timeFormat'];
  } else if (this.model_['dateType'] != 'separate' && this.model_['dateColumn'] && this.model_['dateFormat']) {
    // don't try parsing until the date column and format have a value
    format = this.model_['dateFormat'];
  }

  if (format) {
    var result = os.time.parse(this['sample'], format, true, true);
    if (result) {
      this['result'] = result.toISOString();
      this.scope_['valid'] = true;
    }
  }
};


/**
 * Handles user UI changes.
 */
os.ui.wiz.step.TimeInstantUICtrl.prototype.change = function() {
  this.updateSample_();
};
goog.exportProperty(os.ui.wiz.step.TimeInstantUICtrl.prototype, 'change',
    os.ui.wiz.step.TimeInstantUICtrl.prototype.change);


/**
 * Attempts to auto detect the format for the date field, falling back to Custom if none was detected.
 * @private
 */
os.ui.wiz.step.TimeInstantUICtrl.prototype.autoDetectDate_ = function() {
  if (this.config_['preview'] && this.config_['preview'].length > 0) {
    if (this.model_['dateColumn']) {
      var f = null;
      var date = String(os.im.mapping.getItemField(this.config_['preview'][0], this.model_['dateColumn']) || '');
      if (date) {
        var formats = this.model_['dateType'] == 'combined' ? this['dtFormats'] : this['dFormats'];
        f = os.time.detectFormat(date, formats, true);
      }

      if (f) {
        this['dateFormat'] = f;
        this.model_['dateFormat'] = f;
      } else {
        this['dateFormat'] = 'Custom';
      }
    }
  }

  this.updateSample_();
};


/**
 * Attempts to auto detect the format for the time field, falling back to Custom if none was detected.
 * @private
 */
os.ui.wiz.step.TimeInstantUICtrl.prototype.autoDetectTime_ = function() {
  if (this.config_['preview'] && this.config_['preview'].length > 0) {
    if (this.model_['timeColumn']) {
      var f = null;
      var time = String(os.im.mapping.getItemField(this.config_['preview'][0], this.model_['timeColumn']) || '');
      if (time) {
        f = os.time.detectFormat(time, this['tFormats'], true);
      }

      if (f) {
        this['timeFormat'] = f;
        this.model_['timeFormat'] = f;
      } else {
        this['timeFormat'] = 'Custom';
      }
    }
  }

  this.updateSample_();
};


/**
 * Handles user UI changes to the date type.
 */
os.ui.wiz.step.TimeInstantUICtrl.prototype.onDateType = function() {
  this.autoDetectDate_();
  if (this.model_['dateType'] == 'separate') {
    this.autoDetectTime_();
  }
  this.updateSample_();
};
goog.exportProperty(os.ui.wiz.step.TimeInstantUICtrl.prototype, 'onDateType',
    os.ui.wiz.step.TimeInstantUICtrl.prototype.onDateType);


/**
 * Handles user UI changes to the date column.
 */
os.ui.wiz.step.TimeInstantUICtrl.prototype.onDateColumn = function() {
  this.autoDetectDate_();
  this.updateSample_();
};
goog.exportProperty(os.ui.wiz.step.TimeInstantUICtrl.prototype, 'onDateColumn',
    os.ui.wiz.step.TimeInstantUICtrl.prototype.onDateColumn);


/**
 * Handles user UI changes to the time column.
 */
os.ui.wiz.step.TimeInstantUICtrl.prototype.onTimeColumn = function() {
  this.autoDetectTime_();
  this.updateSample_();
};
goog.exportProperty(os.ui.wiz.step.TimeInstantUICtrl.prototype, 'onTimeColumn',
    os.ui.wiz.step.TimeInstantUICtrl.prototype.onTimeColumn);


/**
 * Handles user UI changes to the date format picker.
 */
os.ui.wiz.step.TimeInstantUICtrl.prototype.onDateFormat = function() {
  if (this['dateFormat'] && this['dateFormat'] != 'Custom') {
    this.model_['dateFormat'] = this['dateFormat'];
    this.updateSample_();
  }
};
goog.exportProperty(os.ui.wiz.step.TimeInstantUICtrl.prototype, 'onDateFormat',
    os.ui.wiz.step.TimeInstantUICtrl.prototype.onDateFormat);


/**
 * Handles user UI changes to the time format picker.
 */
os.ui.wiz.step.TimeInstantUICtrl.prototype.onTimeFormat = function() {
  if (this['timeFormat'] && this['timeFormat'] != 'Custom') {
    this.model_['timeFormat'] = this['timeFormat'];
    this.updateSample_();
  }
};
goog.exportProperty(os.ui.wiz.step.TimeInstantUICtrl.prototype, 'onTimeFormat',
    os.ui.wiz.step.TimeInstantUICtrl.prototype.onTimeFormat);
