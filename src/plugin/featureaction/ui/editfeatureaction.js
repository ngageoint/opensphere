/*
 * Copyright (C) 2014 BIT Systems, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

goog.provide('plugin.im.action.feature.ui.EditFeatureActionCtrl');
goog.provide('plugin.im.action.feature.ui.editFeatureActionDirective');

goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('os.im.action');
goog.require('os.im.action.FilterActionEntry');
goog.require('os.instanceOf');
goog.require('os.ol.canvas');
goog.require('os.ui.Module');
goog.require('os.ui.filter.ui.EditFiltersCtrl');
goog.require('os.ui.filter.ui.editFiltersDirective');
goog.require('os.ui.im.action.EditFilterActionCtrl');
goog.require('os.ui.im.action.EventType');
goog.require('os.ui.im.action.editFilterActionDirective');
goog.require('os.ui.window');



/**
 * The edit feature action directive.
 * @return {angular.Directive}
 */
plugin.im.action.feature.ui.editFeatureActionDirective = function() {
  var dir = os.ui.filter.ui.editFiltersDirective();
  dir.templateUrl = os.ROOT + 'views/plugin/featureaction/editfeatureaction.html';
  dir.controller = plugin.im.action.feature.ui.EditFeatureActionCtrl;
  dir.controllerAs = 'ctrl';
  return dir;
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('editfeatureaction', [plugin.im.action.feature.ui.editFeatureActionDirective]);



/**
 * Controller for the edit feature action window.
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @extends {os.ui.im.action.EditFilterActionCtrl}
 * @constructor
 * @template T
 * @ngInject
 */
plugin.im.action.feature.ui.EditFeatureActionCtrl = function($scope, $element) {
  plugin.im.action.feature.ui.EditFeatureActionCtrl.base(this, 'constructor', $scope, $element);

  /**
   * @type {?HTMLCanvasElement}
   * @protected
  */
  this.styleCanvas = null;
  this.labelCanvas = null;

  os.dispatcher.listen(os.ui.im.action.EventType.UPDATE, this.showActionPreview, false, this);
};
goog.inherits(plugin.im.action.feature.ui.EditFeatureActionCtrl, os.ui.im.action.EditFilterActionCtrl);


/**
 * @inheritDoc
 */
plugin.im.action.feature.ui.EditFeatureActionCtrl.prototype.onDestroy = function() {
  plugin.im.action.feature.ui.EditFeatureActionCtrl.base(this, 'onDestroy');
  os.dispatcher.unlisten(os.ui.im.action.EventType.UPDATE, this.showActionPreview, false, this);
};


/**
 * Show a preview of the actions selected
 */
plugin.im.action.feature.ui.EditFeatureActionCtrl.prototype.showActionPreview = function() {
  // get rid of the existing canvas elements to be replaced with new ones
  this.element.find('.labelCanvas').remove();
  this.element.find('.styleCanvas').remove();
  this.labelCanvas = null;
  this.styleCanvas = null;

  for (var i = 0; i < this['actions'].length; i++) {
    var curAction = this['actions'][i]['action'];
    if (curAction['id'] == 'featureStyleAction') {
      this.buildStylePreview(curAction);
    } else if (curAction['id'] == 'featureLabelAction') {
      this.buildLabelPreview(curAction);
    }
  }
};
goog.exportProperty(
    plugin.im.action.feature.ui.EditFeatureActionCtrl.prototype,
    'showActionPreview',
    plugin.im.action.feature.ui.EditFeatureActionCtrl.prototype.showActionPreview);


/**
 * Create the preview for a style action
 * @param {plugin.im.action.feature.StyleAction} styleAction
 */
plugin.im.action.feature.ui.EditFeatureActionCtrl.prototype.buildStylePreview = function(styleAction) {
  var feature = new ol.Feature();
  var geometry = null;

  this.styleCanvas = /** @type {HTMLCanvasElement} */ (document.createElement('canvas'));
  this.styleCanvas.setAttribute('class', 'styleCanvas');
  this.styleCanvas.height = 27;
  this.styleCanvas.width = 150;
  this.styleCanvas.style.setProperty('vertical-align', 'middle');

  // only add this to the applicable action
  var query = '.filter-action-row:has(option[selected=\'selected\'][value=\'string:featureStyleAction\'])';
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
    if (goog.isDefAndNotNull(config)) {
      var geomShape = /** @type {string|undefined} */ (config['shape']) || os.style.DEFAULT_SHAPE;
      var shape = os.style.SHAPES[geomShape];
      if (shape && shape['config'] && shape['config']['image']) {
        os.style.mergeConfig(shape['config'], config);
      }

      if (os.style.ELLIPSE_REGEXP.test(config['shape'])) {
        // set to a fixed stroke width
        config['stroke']['width'] = 3;
        var includeCenter = os.style.CENTER_LOOKUP[config['shape']];
        geometry = os.ol.canvas.createEllipseGeometry([50, 16],
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
        geometry = new ol.geom.Point([50, 16]);

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
      if (goog.isDefAndNotNull(style)) {
        var imageStyle = style.getImage();
        var imageState = imageStyle.getImageState();

        if (imageState < ol.ImageState.LOADED) {
          // icon isn't loaded yet, so load it now


          if (imageState == ol.ImageState.IDLE) {
            imageStyle.load();
          }

          // listen for the image to change state
          imageStyle.listenImageChange(plugin.im.action.feature.ui.onImageChange_, imageStyle);

          // image isn't loaded, so don't try to render it yet
          return;
        }
        styleRender.drawFeature(feature, style);
      }
    }
  }
};


/**
 * Create the preview for a label action
 * @param {plugin.im.action.feature.LabelAction} labelAction
 */
plugin.im.action.feature.ui.EditFeatureActionCtrl.prototype.buildLabelPreview = function(labelAction) {
  var feature = new ol.Feature();

  this.labelCanvas = /** @type {HTMLCanvasElement} */ (document.createElement('canvas'));
  this.labelCanvas.setAttribute('class', 'labelCanvas');
  this.labelCanvas.height = 24;
  this.labelCanvas.width = 150;
  this.labelCanvas.style.setProperty('vertical-align', 'middle');

  // only add this to the applicable action
  var query = '.filter-action-row:has(option[selected=\'selected\'][value=\'string:featureLabelAction\'])';
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

    if (goog.isDefAndNotNull(lConfig)) {
      var labelColor = os.style.toRgbaString(lConfig['color'] || os.style.DEFAULT_LAYER_COLOR);
      // var labelSize = parseInt(lConfig['size'], 10) || os.style.label.DEFAULT_SIZE;
      var labels = /** @type {Array<!os.style.label.LabelConfig>} */ (os.object.unsafeClone(lConfig['labels']));
      labels = os.style.label.filterValid(labels);
      // update label fields on the feature if there is at least one valid label config defined
      if (goog.isDefAndNotNull(labels) && labels.length > 0) {
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
        feature.setGeometry(new ol.geom.Point([20, 10]));

        // grab the label style
        os.style.setFeatureStyle(feature);
        var styleArr = /** @type {Array<!ol.style.Style>} */ (feature.getStyle());
        if (goog.isDefAndNotNull(styleArr) && styleArr.length > 1) {
          // only showing the first one since we are just previewing the style
          labelRender.drawFeature(feature, styleArr[1]);
        }
      }
    }
  }
};


/**
 * Handler for when we receive notice that an image loaded
 * @this ol.style.Image
 * @private
 */
plugin.im.action.feature.ui.onImageChange_ = function() {
  this.unlistenImageChange(plugin.im.action.feature.ui.onImageChange_, this);

  if (this.getImageState() < ol.ImageState.ERROR) {
    // if the image loaded, trigger a showPreview
    os.dispatcher.dispatchEvent(os.ui.im.action.EventType.UPDATE);
  }
};


/**
 * Create/edit a feature action entry. If no entry is provided, a new one will be created.
 * @param {string} type The entry type.
 * @param {Array} columns The filter columns.
 * @param {function(os.im.action.FilterActionEntry<T>)} callback The callback to fire when the entry is ready.
 * @param {os.im.action.FilterActionEntry<T>=} opt_entry The entry to edit.
 * @param {string=} opt_label Base window label.
 * @template T
 */
plugin.im.action.feature.ui.launchEditFeatureAction = function(type, columns, callback, opt_entry, opt_label) {
  var iam = os.im.action.ImportActionManager.getInstance();
  var label = opt_label || iam.entryTitle;
  var entry = opt_entry;
  if (!entry) {
    // create a new entry and default it to enabled
    entry = iam.createActionEntry();
    entry.setEnabled(true);
    entry.setType(type);

    label = 'Create ' + label;
  } else {
    // editing an existing entry
    label = 'Edit ' + label;
  }

  var options = {
    'id': 'editfeatureaction',
    'icon': 'fa ' + os.im.action.ICON,
    'label': label,
    'x': 'center',
    'y': 'center',
    'show-close': true,
    'no-scroll': false,
    'min-width': 400,
    'min-height': 500,
    'max-width': 1000,
    'max-height': 1000,
    'modal': true,
    'width': 850,
    'height': 600
  };

  var scopeOptions = {
    'entry': entry,
    'type': type,
    'columns': columns,
    'callback': callback
  };

  os.ui.window.create(options, 'editfeatureaction', undefined, undefined, undefined, scopeOptions);
};
