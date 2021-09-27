goog.declareModuleId('os.ui.im.BasicInfoUI');

import '../util/validationmessage.js';
import {ROOT} from '../../os.js';
import Module from '../module.js';
import {findByField} from '../slick/column.js';
const {getItemField} = goog.require('os.im.mapping');

const ColumnDefinition = goog.requireType('os.data.ColumnDefinition');


/**
 * Directive for requesting title, description, and tags for an import configuration.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'config': '=',
    'columns': '=?',
    'help': '=?'
  },
  templateUrl: ROOT + 'views/im/basicinfo.html',
  controller: Controller,
  controllerAs: 'info'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'basicinfo';

/**
 * Add the directive to the os.ui module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for requesting title, description, and tags for an import configuration. Allows picking a column for
 * the title and description when available. Tags were intentionally left without a column picker because they're
 * probably more useful when user-defined, so it felt like unnecessary UI clutter.
 *
 * If columns are provided, the config will be checked for 'features' and 'preview' arrays, and if found will try to
 * display sample text for selected columns.
 *
 * Help popovers will be provided for the following fields on $scope.help:
 *   - titleColumn: Explains the column picker for the title field.
 *   - title: Explains the custom title field.
 *   - descColumn: Explains the column picker for the description field.
 *   - description: Explains the custom description field.
 *   - tags: Explains the custom tags field.
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @ngInject
   */
  constructor($scope) {
    /**
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;

    /**
     * @type {string}
     */
    this['titleSample'] = '';

    /**
     * @type {string}
     */
    this['descSample'] = '';

    /**
     * @type {string}
     */
    this['tagsSample'] = '';

    $scope.$watch('columns', this.onColumnsChange.bind(this));
  }

  /**
   * Handle changes to columns on the scope.
   *
   * @param {Array<ColumnDefinition>=} opt_new The new columns
   * @param {Array<ColumnDefinition>=} opt_old The old columns
   * @protected
   */
  onColumnsChange(opt_new, opt_old) {
    if (this.scope && this.scope['config']) {
      if (!opt_new) {
        this.scope['config']['titleColumn'] = null;
        this.scope['config']['descColumn'] = null;
        this.scope['config']['tagsColumn'] = null;
      } else {
        this.updateColumn('titleColumn', opt_new, Controller.TITLE_REGEXP);
        this.updateColumn('descColumn', opt_new, Controller.DESC_REGEXP);
        this.updateColumn('tagsColumn', opt_new);
      }

      this.updateSampleText();
    }
  }

  /**
   * Update a column in the configuration from a set of columns.
   *
   * @param {string} columnField The config column field
   * @param {Array<ColumnDefinition>} columns The columns
   * @param {RegExp=} opt_regexp Auto detection regular expression.
   * @protected
   */
  updateColumn(columnField, columns, opt_regexp) {
    if (this.scope && this.scope['config']) {
      // check if the current column still exists in the new columns
      if (this.scope['config'][columnField]) {
        var findFn = goog.partial(findByField, 'field', this.scope['config'][columnField]['field']);
        if (!columns.some(findFn)) {
          this.scope['config'][columnField] = null;
        }
      }

      // try to find a suitable column if we don't have one
      if (!this.scope['config'][columnField] && opt_regexp) {
        for (var i = 0; i < columns.length; i++) {
          // if the regex matches and we don't have a column yet or the detected column name is shorter than the current
          // column, set the column. this is intended to prioritize columns like 'NAME' over 'FILENAME'.
          var column = columns[i];
          if (opt_regexp.test(column['name']) && (!this.scope['config'][columnField] ||
              column['name'].length < this.scope['config'][columnField]['name'].length)) {
            this.scope['config'][columnField] = column;
          }
        }
      }
    }
  }

  /**
   * Updates sample text used to display column values.
   *
   * @export
   */
  updateSampleText() {
    if (this.scope && this.scope['config']) {
      this['titleSample'] = this.getSample(this.scope['config']['titleColumn']);
      this['descSample'] = this.getSample(this.scope['config']['descColumn']);
      this['tagsSample'] = this.getSample(this.scope['config']['tagsColumn']);
    }
  }

  /**
   * Gets sample text from the data.
   *
   * @param {ColumnDefinition=} opt_column
   * @return {string}
   * @protected
   */
  getSample(opt_column) {
    var field = opt_column && opt_column['field'] || undefined;
    if (field && this.scope['config']) {
      var sample = '<no data>';

      var items = this.scope['config']['features'] || this.scope['config']['preview'];
      if (items && items.length > 0) {
        // try up to the maximum items to get the sample text
        var maxTries = Math.min(items.length, Controller.MAX_SAMPLE_ATTEMPTS);
        for (var i = 0; i < maxTries; i++) {
          var test = /** @type {string|undefined} */ (getItemField(items[i], opt_column['field']));
          if (test) {
            sample = test;
            break;
          }
        }
      }

      return sample;
    }

    return '';
  }
}

/**
 * Maximum number of items to try to get sample text.
 * @type {number}
 * @const
 */
Controller.MAX_SAMPLE_ATTEMPTS = 100;

/**
 * Regular expression used to detect a title column.
 * @type {RegExp}
 * @const
 */
Controller.TITLE_REGEXP = /(name|title)$/i;

/**
 * Regular expression used to detect a description column.
 * @type {RegExp}
 * @const
 */
Controller.DESC_REGEXP = /^desc(r(i(p(t(i(o(n)?)?)?)?)?)?)$/i;
