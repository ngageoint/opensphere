goog.module('plugin.im.action.feature.ui.EditFeatureActionUI');
goog.module.declareLegacyNamespace();

goog.require('os.ui.filter.advancedFilterBuilderDirective');
goog.require('os.ui.filter.basicFilterBuilderDirective');
goog.require('os.ui.util.validationMessageDirective');

const {ROOT} = goog.require('os');
const Feature = goog.require('ol.Feature');
const Point = goog.require('ol.geom.Point');
const dispatcher = goog.require('os.Dispatcher');
const canvas = goog.require('os.ol.canvas');
const Module = goog.require('os.ui.Module');
const editFiltersDirective = goog.require('os.ui.filter.ui.editFiltersDirective');
const EditFilterActionCtrl = goog.require('os.ui.im.action.EditFilterActionCtrl');
const EventType = goog.require('os.ui.im.action.EventType');

const LabelAction = goog.requireType('plugin.im.action.feature.LabelAction');
const SoundAction = goog.requireType('plugin.im.action.feature.SoundAction');
const StyleAction = goog.requireType('plugin.im.action.feature.StyleAction');


/**
 * The edit feature action directive.
 *
 * @return {angular.Directive}
 */
const directive = () => {
  var dir = editFiltersDirective();
  dir.templateUrl = ROOT + 'views/plugin/featureaction/editfeatureaction.html';
  dir.controller = Controller;
  dir.controllerAs = 'ctrl';
  return dir;
};

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'editfeatureaction';

/**
 * Add the directive to the module.
 */
Module.directive('editfeatureaction', [directive]);

/**
 * Controller for the edit feature action window.
 *
 * @template T
 * @unrestricted
 */
class Controller extends EditFilterActionCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);

    /**
     * @type {?HTMLCanvasElement}
     * @protected
     */
    this.styleCanvas = null;
    this.labelCanvas = null;

    dispatcher.getInstance().listen(EventType.UPDATE, this.showActionPreview, false, this);
  }

  /**
   * @inheritDoc
   */
  onDestroy() {
    super.onDestroy();
    dispatcher.getInstance().unlisten(EventType.UPDATE, this.showActionPreview, false, this);
  }

  /**
   * Show a preview of the actions selected
   *
   * @export
   */
  showActionPreview() {
    // get rid of the existing canvas elements to be replaced with new ones
    this.element.find('.labelCanvas').remove();
    this.element.find('.styleCanvas').remove();
    this.element.find('.soundPreview').remove();
    this.labelCanvas = null;
    this.styleCanvas = null;

    for (var i = 0; i < this['actions'].length; i++) {
      var curAction = this['actions'][i]['action'];
      if (curAction['id'] == 'featureStyleAction') {
        this.buildStylePreview(curAction);
      } else if (curAction['id'] == 'featureLabelAction') {
        this.buildLabelPreview(curAction);
      } else if (curAction['id'] == 'featureSoundAction') {
        this.buildSoundPreview(curAction);
      }
    }
  }

  /**
   * Create the preview for a selected sound
   *
   * @param {SoundAction} soundAction
   */
  buildSoundPreview(soundAction) {
    var config = /** @type {!Object} */ (os.object.unsafeClone(
        soundAction.soundConfig));

    // only add this to the applicable action
    var query = '.js-filter-action__controls:has(option[selected=\'selected\'][value=\'string:featureSoundAction\'])';
    var curContainer = this.element.find(query);
    curContainer.append('<span class="soundPreview"><i class="fa fa-fw fa-music"></i> ' + config['sound'] + '</span>');
  }

  /**
   * Create the preview for a style action
   *
   * @param {StyleAction} styleAction
   */
  buildStylePreview(styleAction) {
    var feature = new Feature();
    var geometry = null;

    this.styleCanvas = /** @type {HTMLCanvasElement} */ (document.createElement('canvas'));
    this.styleCanvas.setAttribute('class', 'styleCanvas');
    this.styleCanvas.height = 27;
    this.styleCanvas.width = 150;

    // only add this to the applicable action
    var query = '.js-filter-action__controls:has(option[selected=\'selected\'][value=\'string:featureStyleAction\'])';
    var curContainer = this.element.find(query);
    curContainer.append(this.styleCanvas);

    if (this.styleCanvas) {
      var styleContext = /** @type {CanvasRenderingContext2D} */ (this.styleCanvas.getContext('2d'));

      // clear any previous contents
      styleContext.clearRect(0, 0, this.styleCanvas.clientWidth, this.styleCanvas.clientHeight);

      var styleRender = ol.render.toContext(styleContext, {
        // fix legend scaling on all displays - fixes Retina cropping issue
        pixelRatio: 1
      });

      var config = /** @type {!Object} */ (os.object.unsafeClone(styleAction.styleConfig));
      if (config != null) {
        var geomShape = /** @type {string|undefined} */ (config['shape']) || os.style.DEFAULT_SHAPE;
        var shape = os.style.SHAPES[geomShape];
        if (shape && shape['config'] && shape['config']['image']) {
          os.style.mergeConfig(shape['config'], config);
        }

        if (os.style.ELLIPSE_REGEXP.test(config['shape'])) {
          // set to a fixed stroke width
          config['stroke']['width'] = 3;
          var includeCenter = os.style.CENTER_LOOKUP[config['shape']];
          geometry = canvas.createEllipseGeometry([50, 16],
              30, includeCenter);

          // include the center point if it was selected
          if (includeCenter) {
            var centerConfig = config['centerShape'] ? os.style.SHAPES[config['centerShape']] :
              os.style.SHAPES[os.style.DEFAULT_CENTER_SHAPE];
            // have to clone this since we are modifying things in it - otherwise, it interferes
            // with the actual action
            var c = /** @type {!Object} */ (os.object.unsafeClone(centerConfig));
            if (c['config'] && os.style.isIconConfig(c['config'])) {
              // set the icon size to a fixed size to fit in the ellipse
              os.style.setConfigSize(c['config'], 1);
            } else {
              os.style.setConfigSize(c['config'], 2);
            }
            os.style.mergeConfig(c['config'], config);
          }
        } else {
          // set the size to a fixed size to fit in the line
          os.style.setConfigSize(config, 10);
          geometry = new Point([50, 16]);

          if (os.style.isIconConfig(config)) {
            config['image']['anchor'] = [0.5, 0.5];
            // set the size to a fixed size to fit in the line
            os.style.setConfigSize(config, 2);
            os.style.setConfigColor(config, config['image']['fill']['color']);
          }
        }

        feature.setGeometry(geometry);

        // create our actual style to be used for the render call
        var style = os.style.StyleManager.getInstance().getOrCreateStyle(config);
        if (style != null) {
          var imageStyle = style.getImage();
          var imageState = imageStyle.getImageState();

          if (imageState < ol.ImageState.LOADED) {
            // icon isn't loaded yet, so load it now

            if (imageState == ol.ImageState.IDLE) {
              imageStyle.load();
            }

            // listen for the image to change state
            imageStyle.listenImageChange(onImageChange, imageStyle);

            // image isn't loaded, so don't try to render it yet
            return;
          }
          styleRender.drawFeature(feature, style);
        }
      }
    }
  }

  /**
   * Create the preview for a label action
   *
   * @param {LabelAction} labelAction
   */
  buildLabelPreview(labelAction) {
    var feature = new Feature();

    this.labelCanvas = /** @type {HTMLCanvasElement} */ (document.createElement('canvas'));
    this.labelCanvas.setAttribute('class', 'labelCanvas');
    this.labelCanvas.height = 24;
    this.labelCanvas.width = 150;

    // only add this to the applicable action
    var query = '.js-filter-action__controls:has(option[selected=\'selected\'][value=\'string:featureLabelAction\'])';
    var curContainer = this.element.find(query);
    curContainer.append(this.labelCanvas);

    if (this.labelCanvas) {
      var labelContext = /** @type {CanvasRenderingContext2D} */ (this.labelCanvas.getContext('2d'));

      // clear any previous contents
      labelContext.clearRect(0, 0, this.labelCanvas.clientWidth, this.labelCanvas.clientHeight);

      var labelRender = ol.render.toContext(labelContext, {
        // fix legend scaling on all displays - fixes Retina cropping issue
        pixelRatio: 1
      });
      var lConfig = /** @type {!Object} */ (os.object.unsafeClone(labelAction.labelConfig));

      if (lConfig != null) {
        var labelColor = os.style.toRgbaString(lConfig['color'] || os.style.DEFAULT_LAYER_COLOR);
        // var labelSize = parseInt(lConfig['size'], 10) || os.style.label.DEFAULT_SIZE;
        var labels = /** @type {Array<!os.style.label.LabelConfig>} */ (os.object.unsafeClone(lConfig['labels']));
        labels = os.style.label.filterValid(labels);
        // update label fields on the feature if there is at least one valid label config defined
        if (labels != null && labels.length > 0) {
          // get the existing feature config or create a new one
          var featureConfig = /** @type {Object|undefined} */ (feature.get(os.style.StyleType.FEATURE)) || {};
          // apply label config but change the label to be something generic
          labels[0]['column'] = 'COLUMN';
          featureConfig[os.style.StyleField.LABELS] = labels;
          featureConfig[os.style.StyleField.LABEL_COLOR] = labelColor;

          // set the size to a fixed size to fit in the action line
          featureConfig[os.style.StyleField.LABEL_SIZE] = 14;

          // save the feature config to the feature
          feature.set(os.style.StyleType.FEATURE, featureConfig, true);
          // show the label on the feature
          feature.set(os.style.StyleField.SHOW_LABELS, true);

          feature.set(labels[0]['column'], 'VALUE');
          feature.setGeometry(new Point([20, 10]));

          // grab the label style
          os.style.setFeatureStyle(feature);
          var styleArr = /** @type {Array<!ol.style.Style>} */ (feature.getStyle());
          if (styleArr != null && styleArr.length > 1) {
            // only showing the first one since we are just previewing the style
            labelRender.drawFeature(feature, styleArr[1]);
          }
        }
      }
    }
  }
}

/**
 * Handler for when we receive notice that an image loaded
 *
 * @this ol.style.Image
 */
const onImageChange = function() {
  this.unlistenImageChange(onImageChange, this);

  if (this.getImageState() < ol.ImageState.ERROR) {
    // if the image loaded, trigger a showPreview
    dispatcher.getInstance().dispatchEvent(EventType.UPDATE);
  }
};

exports = {
  Controller,
  directive,
  directiveTag
};
