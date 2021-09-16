goog.module('os.ui.layer.VectorStyleControlsUI');

goog.require('os.ui.SliderUI');
goog.require('os.ui.icon.IconPickerUI');

const Disposable = goog.require('goog.Disposable');
const {ROOT} = goog.require('os');
const DataManager = goog.require('os.data.DataManager');
const IMappingDescriptor = goog.require('os.data.IMappingDescriptor');
const osImplements = goog.require('os.implements');
const {CENTER_LOOKUP, LINE_STYLE_OPTIONS, ShapeType, dashPatternToOptions} = goog.require('os.style');
const Module = goog.require('os.ui.Module');
const EllipseColumnsUI = goog.require('os.ui.layer.EllipseColumnsUI');
const VectorStyleControlsEventType = goog.require('os.ui.layer.VectorStyleControlsEventType');

const {styleLineDashOption} = goog.requireType('os.style');


/**
 * Directive to style vector layers, features, etc.
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'color': '=',
    'fillColor': '=?',
    'opacity': '=',
    'fillOpacity': '=?',
    'icon': '=?',
    'centerIcon': '=?',
    'iconSet': '=?',
    'iconSrc': '=?',
    'showIcon': '=?',
    'showCenterIcon': '=?',
    'size': '=',
    'shape': '=',
    'shapes': '=',
    'columns': '=?',
    'allowEllipseConfig': '=?',
    'layer': '=?',
    'centerShape': '=?',
    'centerShapes': '=?',
    'lineDash': '=?',
    'showColorReset': '=?'
  },
  templateUrl: ROOT + 'views/layer/vectorstylecontrols.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'vectorstylecontrols';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the vectorstylecontrols directive.
 * @unrestricted
 */
class Controller extends Disposable {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    super();

    /**
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;

    /**
     * The root DOM element.
     * @type {?angular.JQLite}
     * @protected
     */
    this.element = $element;

    if (this.scope['showIcon'] == null) {
      this.scope['showIcon'] = true;
    }

    if (this.scope['showCenterIcon'] == null) {
      this.scope['showCenterIcon'] = true;
    }

    /**
     * Options for line dash styles
     * @type {!Array<!styleLineDashOption>}
     */
    this.scope['lineDashOptions'] = LINE_STYLE_OPTIONS;

    /**
     * The line dash style option for the stored pattern
     * @type {styleLineDashOption}
     */
    var name = dashPatternToOptions(this.scope['lineDash']);

    /**
     * The selected line dash option
     * @type {styleLineDashOption}
     */
    this.scope['lineDashOption'] = name ? name : this.scope['lineDashOptions'][1];

    /**
     * The chosen mappings
     * @type {Object}
     */
    this['ellipseMapping'] = undefined;

    /**
     * Help text for Ellipse configuration
     * @type {string}
     */
    this['configEllipse'] = `The required ellipse columns are not configured on this layer. To display ellipses, click
    the settings cog and select the required columns.`;

    $scope.$on('$destroy', this.dispose.bind(this));
  }

  /**
   * Initialize the controller after it has been linked.
   *
   * @export
   */
  $postLink() {
    if (this.element) {
      this.select2_ = this.element.find('.js-line-dash');
      this.select2_.select2({
        'minimumResultsForSearch': -1,
        'placeholder': 'Line Dash Select',
        'formatSelection': this.select2Formatter_,
        'formatResult': this.select2Formatter_
      }).on('select2-open', function(e) { // toggle the padding for the select2
        $('body').addClass('c-select2__no-padding');
      }).on('select2-close', function(e) {
        $('body').removeClass('c-select2__no-padding');
      });
    }
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    this.scope = null;
    this.element = null;
  }

  /**
   * Determine if ellipse configuration is allowed for the layer.
   * Depends on 'allowEllipseConfig' being true on scope.
   *
   * @return {boolean}
   * @export
   */
  allowEllipseConfig() {
    if (this.scope['allowEllipseConfig']) {
      const layer = this.scope['layer'];
      const desc = layer ? DataManager.getInstance().getDescriptor(layer.getId()) : undefined;
      if (osImplements(desc, IMappingDescriptor.ID)) {
        return (
          /** @type {IMappingDescriptor} */
          (desc).supportsMapping()
        );
      }
    }

    return false;
  }

  /**
   * Fire a scope event when the shape is changed by the user.
   *
   * @export
   */
  onShapeChange() {
    if (this.scope) {
      this.scope.$emit(VectorStyleControlsEventType.SHAPE_CHANGE, this.scope['shape']);
    }
  }

  /**
   * Check for ellipse with center
   *
   * @return {boolean}
   * @export
   */
  hasCenter() {
    if (this.scope && this.scope['shape']) {
      return CENTER_LOOKUP[this.scope['shape']];
    }
    return false;
  }

  /**
   * Checks if the layer has Ellipse Columns
   *
   * @return {boolean}
   * @export
   */
  hasEllipseCols() {
    const layer = this.scope['layer'] || undefined;
    const source = layer ? layer.getSource() : undefined;

    return source ? source.supportsShape(ShapeType.ELLIPSE) : false;
  }

  /**
   * Fire a scope event when the ellipse center shape is changed by the user.
   *
   * @param {string} shape
   * @export
   */
  onCenterShapeChange(shape) {
    if (this.scope) {
      this.scope.$emit(VectorStyleControlsEventType.CENTER_SHAPE_CHANGE, shape);
      this.scope['centerShape'] = shape;
    }
  }

  /**
   * Fire a scope event when the line dash is changed by the user.
   *
   * @export
   */
  onLineDashChange() {
    if (this.scope && this.scope['lineDashOption']) {
      this.scope['lineDash'] = /** @type {styleLineDashOption} */ (this.scope['lineDashOption']).pattern;
      this.scope.$emit(VectorStyleControlsEventType.LINE_DASH_CHANGE, this.scope['lineDash']);
    }
  }

  /**
   * Search result formatter. The select is actually storing the ID of each
   * descriptor. This function allows us to display the actual layer title.
   * @param {Object} item
   * @param {angular.JQLite} ele
   * @return {string|angular.JQLite}
   * @private
   */
  select2Formatter_(item, ele) {
    if (item) {
      var val = '<svg height="2" width="80"><g class="c-vectorstylecontrol__borderdash"><path ';
      val = val + 'stroke-dasharray ="' + item['id'] + '" d= "M5 1 l215 0" /></g></svg>';
      return val;
    } else {
      return '';
    }
  }

  /**
   * Launches the window to configure ellipse columns
   *
   * @export
   */
  launchConfigureWindow() {
    const layer = this.scope['layer'] || undefined;
    if (layer) {
      EllipseColumnsUI.launchConfigureWindow(layer);
    }
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
