goog.module('os.ui.feature.FeatureInfoCellUI');
goog.module.declareLegacyNamespace();

goog.require('os.ui.location.SimpleLocationDirective');
goog.require('os.ui.propertyInfoDirective');

const {ROOT} = goog.require('os');
const Fields = goog.require('os.Fields');
const fields = goog.require('os.fields');
const ui = goog.require('os.ui');
const Module = goog.require('os.ui.Module');
const ColumnActionManager = goog.require('os.ui.columnactions.ColumnActionManager');
const SimpleColumnActionModel = goog.require('os.ui.columnactions.SimpleColumnActionModel');
const launchColumnActionPrompt = goog.require('os.ui.columnactions.launchColumnActionPrompt');
const FeatureInfoEvent = goog.require('os.ui.feature.FeatureInfoEvent');
const {urlNewTabFormatter} = goog.require('os.ui.formatter');
const {copy: copyText} = goog.require('os.ui.text');


/**
 * The featureinfo directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  scope: {
    'property': '='
  },
  replace: true,
  templateUrl: ROOT + 'views/feature/featureinfocell.html',
  controller: Controller,
  controllerAs: 'cell'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'featureinfocell';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the featureinfo directive
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$sce} $sce
   * @ngInject
   */
  constructor($scope, $element, $sce) {
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
     * @type {?angular.$sce}
     * @private
     */
    this.sce_ = $sce;

    /**
     * Value to show in the copy window
     * @type {string}
     * @private
     */
    this.copyValue_ = '';
    this.init_();
    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * Clean up.
   *
   * @private
   */
  destroy_() {
    this.scope_ = null;
    this.element_ = null;
    this.sce_ = null;
  }

  /**
   * Setup the cell by the type
   *
   * @private
   */
  init_() {
    var property = this.scope_['property'];
    var value = property['value'];

    this.element_.parent().dblclick(this.onDblClick_.bind(this));
    this.copyValue_ = value;
    this.scope_['type'] = '';

    if (value) {
      this.scope_['ca'] = new SimpleColumnActionModel(property['field']);
      this.scope_['actions'] =
          ColumnActionManager.getInstance().getActions(null, this.scope_['ca'], value);

      if (property['field'] == Fields.PROPERTIES && typeof value === 'object') {
        // add the View Properties link
        try {
          this.copyValue_ = JSON.stringify(value);
        } catch (e) {
          // not serializable, womp womp
          this.copyValue_ = '';
        }

        this.scope_['type'] = 'prop';
      } else if (this.scope_['actions'].length > 0) {
        // we have column actions, use those
        this.scope_['type'] = 'ca';
        if (this.scope_['actions'].length == 1) {
          this.scope_['action'] = this.scope_['actions'][0].getAction(value);
          this.scope_['description'] = this.scope_['actions'][0].getDescription();
        }
      } else if (fields.DESC_REGEXP.test(property['field'])) {
        // we have a description, tell it to use that formatter
        this.scope_['type'] = 'desc';
      } else {
        // default case, just show it
        // We want Angular to trust the HTML we generate. We do NOT trust the value, and it is sanitized
        // elsewhere.
        property['value'] = this.sce_.trustAsHtml('<span>' + urlNewTabFormatter(value) + '</span>');
      }
    }
  }

  /**
   * Show the description tab
   *
   * @export
   */
  showDescription() {
    this.scope_.$emit(FeatureInfoEvent.SHOW_DESCRIPTION);
  }

  /**
   * View properties
   *
   * @export
   */
  viewProperties() {
    var feature = /** @type {!ol.Feature} */ (this.scope_['property']['feature']);
    var properties = /** @type {!Object} */ (feature.get(Fields.PROPERTIES));
    var id = /** @type {!string} */ (feature.get(Fields.ID));
    if (properties instanceof Object && typeof id === 'string') {
      ui.launchPropertyInfo(id, properties);
    }
  }

  /**
   * Pick column action
   *
   * @export
   */
  pickColumnAction() {
    launchColumnActionPrompt(this.scope_['actions'],
        this.scope_['property']['value'],
        this.scope_['ca']);
  }

  /**
   * @private
   */
  onDblClick_() {
    copyText(this.copyValue_);
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
