goog.module('os.ui.wiz.step.TimeInstantUI');
goog.module.declareLegacyNamespace();

const {ROOT} = goog.require('os');
const osTime = goog.require('os.time');
const Module = goog.require('os.ui.Module');

const BaseParserConfig = goog.requireType('os.parse.BaseParserConfig');
const TimeMappingModel = goog.requireType('os.ui.im.mapping.time.TimeMappingModel');


/**
 * The import wizard time instant ui directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'config': '=',
    'model': '=',
    'valid': '=',
    'label': '@'
  },
  templateUrl: ROOT + 'views/wiz/timeinstantui.html',
  controller: Controller,
  controllerAs: 'tiUI'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'timeinstantui';


/**
 * Add the directive to the os.ui module
 */
Module.directive('timeinstantui', [directive]);


/**
 * Controller for the import wizard time instant ui
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @ngInject
   */
  constructor($scope) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    /**
     * @type {TimeMappingModel}
     * @private
     */
    this.model_ = $scope['model'];

    /**
     * @type {BaseParserConfig}
     * @private
     */
    this.config_ = $scope['config'];

    /**
     * @type {Array<string>}
     */
    this['dtFormats'] = osTime.DATETIME_FORMATS;

    /**
     * @type {Array<string>}
     */
    this['dFormats'] = osTime.DATE_FORMATS;

    /**
     * @type {Array<string>}
     */
    this['tFormats'] = osTime.TIME_FORMATS;

    /**
     * @type {string}
     */
    this['dateFormat'] = '';

    /**
     * @type {string}
     */
    this['timeFormat'] = '';

    /**
     * @type {Array<string>}
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
  }

  /**
   * @private
   */
  destroy_() {
    this.scope_ = null;
  }

  /**
   * @private
   */
  initialize_() {
    if (this.model_['dateType'] == 'combined') {
      this['dateFormat'] = this['dtFormats'].includes(this.model_['dateFormat']) ? this.model_['dateFormat'] : 'Custom';
    } else {
      this['dateFormat'] = this['dFormats'].includes(this.model_['dateFormat']) ? this.model_['dateFormat'] : 'Custom';

      if (this.model_['dateType'] == 'separate') {
        this['timeFormat'] = this['tFormats'].includes(
            this.model_['timeFormat']) ? this.model_['timeFormat'] : 'Custom';
      }
    }

    this.updateSample_();
  }

  /**
   * Updates the sample field with the first row of the selected column(s).
   *
   * @private
   */
  updateSample_() {
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
        this['sample'] = this.model_['dateType'] == 'separate' ? Controller.NO_DATETIME :
          Controller.NO_DATE;
      } else {
        this.updateResult_();
      }
    } else {
      this['sample'] = Controller.NO_PREVIEW;
    }
  }

  /**
   * Search preview data for the first non-empty field value.
   *
   * @param {string} field
   * @return {string}
   * @private
   */
  getPreviewField_(field) {
    var result = '';

    for (var i = 0, n = this.config_['preview'].length; i < n && !result; i++) {
      var item = this.config_['preview'][i];
      result = goog.string.trim(String(os.im.mapping.getItemField(item, field) || ''));
    }

    return result;
  }

  /**
   * Updates the result field if all columns have been selected and formats chosen.
   *
   * @private
   */
  updateResult_() {
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
      var result = osTime.parse(this['sample'], format, true, true);
      if (result) {
        this['result'] = result.toISOString();
        this.scope_['valid'] = true;
      }
    }
  }

  /**
   * Handles user UI changes.
   *
   * @export
   */
  change() {
    this.updateSample_();
  }

  /**
   * Attempts to auto detect the format for the date field, falling back to Custom if none was detected.
   *
   * @private
   */
  autoDetectDate_() {
    if (this.config_['preview'] && this.config_['preview'].length > 0) {
      if (this.model_['dateColumn']) {
        var f = null;
        var date = String(os.im.mapping.getItemField(this.config_['preview'][0], this.model_['dateColumn']) || '');
        if (date) {
          var formats = this.model_['dateType'] == 'combined' ? this['dtFormats'] : this['dFormats'];
          f = osTime.detectFormat(date, formats, true);
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
  }

  /**
   * Attempts to auto detect the format for the time field, falling back to Custom if none was detected.
   *
   * @private
   */
  autoDetectTime_() {
    if (this.config_['preview'] && this.config_['preview'].length > 0) {
      if (this.model_['timeColumn']) {
        var f = null;
        var time = String(os.im.mapping.getItemField(this.config_['preview'][0], this.model_['timeColumn']) || '');
        if (time) {
          f = osTime.detectFormat(time, this['tFormats'], true);
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
  }

  /**
   * Handles user UI changes to the date type.
   *
   * @export
   */
  onDateType() {
    this.autoDetectDate_();
    if (this.model_['dateType'] == 'separate') {
      this.autoDetectTime_();
    }
    this.updateSample_();
  }

  /**
   * Handles user UI changes to the date column.
   *
   * @export
   */
  onDateColumn() {
    this.autoDetectDate_();
    this.updateSample_();
  }

  /**
   * Handles user UI changes to the time column.
   *
   * @export
   */
  onTimeColumn() {
    this.autoDetectTime_();
    this.updateSample_();
  }

  /**
   * Handles user UI changes to the date format picker.
   *
   * @export
   */
  onDateFormat() {
    if (this['dateFormat'] && this['dateFormat'] != 'Custom') {
      this.model_['dateFormat'] = this['dateFormat'];
      this.updateSample_();
    }
  }

  /**
   * Handles user UI changes to the time format picker.
   *
   * @export
   */
  onTimeFormat() {
    if (this['timeFormat'] && this['timeFormat'] != 'Custom') {
      this.model_['timeFormat'] = this['timeFormat'];
      this.updateSample_();
    }
  }
}


/**
 * @type {string}
 * @const
 */
Controller.NO_DATE = 'Please choose a Date column.';


/**
 * @type {string}
 * @const
 */
Controller.NO_DATETIME = 'Please choose Date and Time columns.';


/**
 * @type {string}
 * @const
 */
Controller.NO_PREVIEW = 'No preview data available. Please check the import configuration.';


exports = {
  Controller,
  directive,
  directiveTag
};
