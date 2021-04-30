goog.provide('os.ui.layer.VectorStyleControlsCtrl');
goog.provide('os.ui.layer.vectorStyleControlsDirective');

goog.require('goog.Disposable');
goog.require('os.ui.Module');
goog.require('os.ui.icon.iconPickerDirective');
goog.require('os.ui.layer.EllipseColumnsUI');
goog.require('os.ui.layer.VectorStyleControlsEventType');
goog.require('os.ui.sliderDirective');


/**
 * Directive to style vector layers, features, etc.
 *
 * @return {angular.Directive}
 */
os.ui.layer.vectorStyleControlsDirective = function() {
  return {
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
      'hasEllipseCols': '=?',
      'allowEllipseConfig': '=?',
      'ellipseMappings': '=?',
      'layerNodes': '=?',
      'centerShape': '=?',
      'centerShapes': '=?',
      'lineDash': '=?',
      'showColorReset': '=?'
    },
    templateUrl: os.ROOT + 'views/layer/vectorstylecontrols.html',
    controller: os.ui.layer.VectorStyleControlsCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('vectorstylecontrols', [os.ui.layer.vectorStyleControlsDirective]);



/**
 * Controller function for the vectorstylecontrols directive.
 *
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element
 * @extends {goog.Disposable}
 * @constructor
 * @ngInject
 */
os.ui.layer.VectorStyleControlsCtrl = function($scope, $element) {
  os.ui.layer.VectorStyleControlsCtrl.base(this, 'constructor');

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
   * @type {!Array<!os.style.styleLineDashOption>}
   */
  this.scope['lineDashOptions'] = os.style.LINE_STYLE_OPTIONS;

  /**
   * The line dash style option for the stored pattern
   * @type {os.style.styleLineDashOption}
   */
  var name = os.style.dashPatternToOptions(this.scope['lineDash']);

  /**
   * The selected line dash option
   * @type {os.style.styleLineDashOption}
   */
  this.scope['lineDashOption'] = name ? name : this.scope['lineDashOptions'][1];

  /**
   * The chosen mappings
   * @type {Object}
   */
  this['ellipseMapping'] = undefined;

  this['allowEllipseConfig'] = this.scope['allowEllipseConfig'] || false;

  /**
   * Help text for Ellipse configuration
   * @type {string}
   */
  this['configEllipse'] = `This layer does not have columns that support Ellipse styling (Radius, or Semi Minor, Semi 
    Major, and Orientation). To configure which columns should be mapped be used instead, use the settings cog to
    add mappings to this layer so that the ellipses can be shown on the map.`;

  $scope.$on('$destroy', this.dispose.bind(this));
};
goog.inherits(os.ui.layer.VectorStyleControlsCtrl, goog.Disposable);


/**
 * Initialize the controller after it has been linked.
 *
 * @export
 */
os.ui.layer.VectorStyleControlsCtrl.prototype.$postLink = function() {
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
};


/**
 * @inheritDoc
 */
os.ui.layer.VectorStyleControlsCtrl.prototype.disposeInternal = function() {
  this.scope = null;
  this.element = null;
};


/**
 * Fire a scope event when the shape is changed by the user.
 *
 * @export
 */
os.ui.layer.VectorStyleControlsCtrl.prototype.onShapeChange = function() {
  if (this.scope) {
    this.scope.$emit(os.ui.layer.VectorStyleControlsEventType.SHAPE_CHANGE, this.scope['shape']);
  }
};


/**
 * Check for ellipse with center
 *
 * @return {boolean}
 * @export
 */
os.ui.layer.VectorStyleControlsCtrl.prototype.hasCenter = function() {
  if (this.scope && this.scope['shape']) {
    return os.style.CENTER_LOOKUP[this.scope['shape']];
  }
  return false;
};


/**
 * Fire a scope event when the ellipse center shape is changed by the user.
 *
 * @param {string} shape
 * @export
 */
os.ui.layer.VectorStyleControlsCtrl.prototype.onCenterShapeChange = function(shape) {
  if (this.scope) {
    this.scope.$emit(os.ui.layer.VectorStyleControlsEventType.CENTER_SHAPE_CHANGE, shape);
    this.scope['centerShape'] = shape;
  }
};


/**
 * Fire a scope event when the line dash is changed by the user.
 *
 * @export
 */
os.ui.layer.VectorStyleControlsCtrl.prototype.onLineDashChange = function() {
  if (this.scope && this.scope['lineDashOption']) {
    this.scope['lineDash'] = /** @type {os.style.styleLineDashOption} */ (this.scope['lineDashOption']).pattern;
    this.scope.$emit(os.ui.layer.VectorStyleControlsEventType.LINE_DASH_CHANGE, this.scope['lineDash']);
  }
};


/**
 * Search result formatter. The select is actually storing the ID of each
 * descriptor. This function allows us to display the actual layer title.
 * @param {Object} item
 * @param {angular.JQLite} ele
 * @return {string|angular.JQLite}
 * @private
 */
os.ui.layer.VectorStyleControlsCtrl.prototype.select2Formatter_ = function(item, ele) {
  if (item) {
    var val = '<svg height="2" width="80"><g class="c-vectorstylecontrol__borderdash"><path ';
    val = val + 'stroke-dasharray ="' + item['id'] + '" d= "M5 1 l215 0" /></g></svg>';
    return val;
  } else {
    return '';
  }
};


/**
 * Callback for mapping an ellipse column
 * @param {*} data
 * @private
 */
os.ui.layer.VectorStyleControlsCtrl.prototype.onEllipseMapping_ = function(data) {
  if (data && data['type'] >= 0) {
    this.scope['hasEllipseCols'] = true;
    this['ellipseMapping'] = data;
    this.scope.$emit(os.ui.layer.VectorStyleControlsEventType.ELLIPSE_COLUMN_CHANGE, data);
  }
};


/**
 * Launches the window to configure ellipse columns
 *
 * @export
 */
os.ui.layer.VectorStyleControlsCtrl.prototype.launchConfigureWindow = function() {
  const confirm = this.onEllipseMapping_.bind(this);
  const scopeOptions = {
    'columns': this.scope['columns'] || null,
    'prevConfig': this['ellipseMapping'] || this.scope['ellipseMappings']
  };

  const options = /** @type {osx.window.ConfirmOptions} */ ({
    confirm: confirm,
    prompt: '<ellipsecolumns prev-config="prevConfig" columns="columns"></ellipsecolumns>',
    windowOptions: {
      'label': 'Map Ellipse Columns',
      'x': 'center',
      'y': 'center',
      'width': '300',
      'height': 'auto',
      'modal': 'true',
      'show-close': 'true'
    }
  });

  os.ui.window.ConfirmUI.launchConfirm(options, scopeOptions);
};

