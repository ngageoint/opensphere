goog.provide('os.ui.im.BasicInfoCtrl');
goog.provide('os.ui.im.basicInfoDirective');

goog.require('os.ui.Module');
goog.require('os.ui.slick.column');


/**
 * Directive for requesting title, description, and tags for an import configuration.
 * @return {angular.Directive}
 */
os.ui.im.basicInfoDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'config': '=',
      'columns': '=?',
      'help': '=?'
    },
    templateUrl: os.ROOT + 'views/im/basicinfo.html',
    controller: os.ui.im.BasicInfoCtrl,
    controllerAs: 'info'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('basicinfo', [os.ui.im.basicInfoDirective]);



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
 *
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.ui.im.BasicInfoCtrl = function($scope) {
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
};


/**
 * Maximum number of items to try to get sample text.
 * @type {number}
 * @const
 */
os.ui.im.BasicInfoCtrl.MAX_SAMPLE_ATTEMPTS = 100;


/**
 * Regular expression used to detect a title column.
 * @type {RegExp}
 * @const
 */
os.ui.im.BasicInfoCtrl.TITLE_REGEXP = /(name|title)$/i;


/**
 * Regular expression used to detect a description column.
 * @type {RegExp}
 * @const
 */
os.ui.im.BasicInfoCtrl.DESC_REGEXP = /^desc(r(i(p(t(i(o(n)?)?)?)?)?)?)$/i;


/**
 * Handle changes to columns on the scope.
 * @param {Array<os.data.ColumnDefinition>=} opt_new The new columns
 * @param {Array<os.data.ColumnDefinition>=} opt_old The old columns
 * @protected
 */
os.ui.im.BasicInfoCtrl.prototype.onColumnsChange = function(opt_new, opt_old) {
  if (this.scope && this.scope['config']) {
    if (!opt_new) {
      this.scope['config']['titleColumn'] = null;
      this.scope['config']['descColumn'] = null;
      this.scope['config']['tagsColumn'] = null;
    } else {
      this.updateColumn('titleColumn', opt_new, os.ui.im.BasicInfoCtrl.TITLE_REGEXP);
      this.updateColumn('descColumn', opt_new, os.ui.im.BasicInfoCtrl.DESC_REGEXP);
      this.updateColumn('tagsColumn', opt_new);
    }

    this.updateSampleText();
  }
};


/**
 * Update a column in the configuration from a set of columns.
 * @param {string} columnField The config column field
 * @param {Array<os.data.ColumnDefinition>} columns The columns
 * @param {RegExp=} opt_regexp Auto detection regular expression.
 * @protected
 */
os.ui.im.BasicInfoCtrl.prototype.updateColumn = function(columnField, columns, opt_regexp) {
  if (this.scope && this.scope['config']) {
    // check if the current column still exists in the new columns
    if (this.scope['config'][columnField]) {
      var findFn = goog.partial(os.ui.slick.column.findByField, 'field', this.scope['config'][columnField]['field']);
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
};


/**
 * Updates sample text used to display column values.
 */
os.ui.im.BasicInfoCtrl.prototype.updateSampleText = function() {
  if (this.scope && this.scope['config']) {
    this['titleSample'] = this.getSample(this.scope['config']['titleColumn']);
    this['descSample'] = this.getSample(this.scope['config']['descColumn']);
    this['tagsSample'] = this.getSample(this.scope['config']['tagsColumn']);
  }
};
goog.exportProperty(
    os.ui.im.BasicInfoCtrl.prototype,
    'updateSampleText',
    os.ui.im.BasicInfoCtrl.prototype.updateSampleText);


/**
 * Gets sample text from the data.
 * @param {os.data.ColumnDefinition=} opt_column
 * @return {string}
 * @protected
 */
os.ui.im.BasicInfoCtrl.prototype.getSample = function(opt_column) {
  var field = opt_column && opt_column['field'] || undefined;
  if (field && this.scope['config']) {
    var sample = '<no data>';

    var items = this.scope['config']['features'] || this.scope['config']['preview'];
    if (items && items.length > 0) {
      // try up to the maximum items to get the sample text
      var maxTries = Math.min(items.length, os.ui.im.BasicInfoCtrl.MAX_SAMPLE_ATTEMPTS);
      for (var i = 0; i < maxTries; i++) {
        var test = /** @type {string|undefined} */ (os.im.mapping.getItemField(items[i], opt_column['field']));
        if (test) {
          sample = test;
          break;
        }
      }
    }

    return sample;
  }

  return '';
};
