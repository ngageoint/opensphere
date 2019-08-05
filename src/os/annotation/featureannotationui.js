goog.provide('os.annotation.FeatureAnnotationCtrl');
goog.provide('os.annotation.featureAnnotationDirective');

goog.require('goog.async.ConditionalDelay');
goog.require('os.annotation');
goog.require('os.annotation.AbstractAnnotationCtrl');
goog.require('os.annotation.TailStyle');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.ui.Module');
goog.require('os.ui.text.tuiEditorDirective');


/**
 * An feature-based annotation to attach to the map.
 *
 * @return {angular.Directive}
 */
os.annotation.featureAnnotationDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'feature': '=',
      'overlay': '='
    },
    template: os.annotation.UI_TEMPLATE,
    controller: os.annotation.FeatureAnnotationCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('featureannotation', [os.annotation.featureAnnotationDirective]);



/**
 * Controller for the featureannotation directive.
 *
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @param {!angular.$timeout} $timeout The Angular $timeout service.
 * @extends {os.annotation.AbstractAnnotationCtrl}
 * @constructor
 * @ngInject
 */
os.annotation.FeatureAnnotationCtrl = function($scope, $element, $timeout) {
  /**
   * The OpenLayers feature.
   * @type {ol.Feature}
   * @protected
   */
  this.feature = $scope['feature'];

  /**
   * The OpenLayers overlay.
   * @type {os.webgl.WebGLOverlay}
   * @protected
   */
  this.overlay = $scope['overlay'];

  /**
   * If handling a visibility change event.
   * @type {boolean}
   * @private
   */
  this.inVisibleChange_ = false;

  /**
   * If the user moved/resized the UI.
   * @type {boolean}
   * @private
   */
  this.userChanged_ = false;

  os.annotation.FeatureAnnotationCtrl.base(this, 'constructor', $scope, $element, $timeout);

  ol.events.listen(this.feature, ol.events.EventType.CHANGE, this.onFeatureChange_, this);
  ol.events.listen(this.overlay, 'change:visible', this.onOverlayVisibleChange_, this);
};
goog.inherits(os.annotation.FeatureAnnotationCtrl, os.annotation.AbstractAnnotationCtrl);


/**
 * @inheritDoc
 */
os.annotation.FeatureAnnotationCtrl.prototype.disposeInternal = function() {
  os.annotation.FeatureAnnotationCtrl.base(this, 'disposeInternal');

  ol.events.unlisten(this.feature, ol.events.EventType.CHANGE, this.onFeatureChange_, this);
  ol.events.unlisten(this.overlay, 'change:visible', this.onOverlayVisibleChange_, this);

  this.feature = null;
  this.overlay = null;
};


/**
 * @inheritDoc
 */
os.annotation.FeatureAnnotationCtrl.prototype.initialize = function() {
  if (this.element && this.feature && this.overlay) {
    this.element.width(this['options'].size[0]);
    this.element.height(this['options'].size[1]);

    this.setTailType(os.annotation.TailType.ABSOLUTE);
    this.onFeatureChange_();

    // use a conditional delay for the initial tail update in case the map isn't initialized
    var updateDelay = new goog.async.ConditionalDelay(this.updateTail, this);
    var cleanup = function() {
      goog.dispose(updateDelay);
    };
    updateDelay.onSuccess = updateDelay.onFailure = cleanup;
    updateDelay.start(50, 10000);
  }
};


/**
 * @inheritDoc
 */
os.annotation.FeatureAnnotationCtrl.prototype.getOptions = function() {
  return /** @type {!osx.annotation.Options} */ (this.feature.get(os.annotation.OPTIONS_FIELD));
};


/**
 * @inheritDoc
 * @export
 */
os.annotation.FeatureAnnotationCtrl.prototype.launchEditWindow = function() {
  if (this.feature) {
    this.feature.dispatchEvent(new os.events.PropertyChangeEvent(os.annotation.EventType.EDIT));
  }
};


/**
 * @inheritDoc
 * @export
 */
os.annotation.FeatureAnnotationCtrl.prototype.hideAnnotation = function() {
  if (this.feature) {
    this['options'].show = false;
    this.feature.dispatchEvent(new os.events.PropertyChangeEvent(os.annotation.EventType.HIDE));
  }
};


/**
 * @inheritDoc
 * @export
 */
os.annotation.FeatureAnnotationCtrl.prototype.saveAnnotation = function() {
  os.annotation.FeatureAnnotationCtrl.base(this, 'saveAnnotation');

  this.feature.set(os.ui.FeatureEditCtrl.Field.NAME, this['name']);
  this.feature.set(os.ui.FeatureEditCtrl.Field.DESCRIPTION,
      os.ui.text.TuiEditor.render(this['description']));
  this.feature.set(os.ui.FeatureEditCtrl.Field.MD_DESCRIPTION, this['description']);

  this.feature.dispatchEvent(new os.events.PropertyChangeEvent(os.annotation.EventType.UPDATE_PLACEMARK));
};


/**
 * Update the title from the feature.
 *
 * @private
 */
os.annotation.FeatureAnnotationCtrl.prototype.onFeatureChange_ = function() {
  this['name'] = '';
  this['description'] = '';

  if (this.feature && this.scope) {
    this['name'] = os.annotation.getNameText(this.feature);
    this['description'] = os.annotation.getDescriptionText(this.feature);
    this['options'] = /** @type {!osx.annotation.Options} */ (this.feature.get(os.annotation.OPTIONS_FIELD));

    var geometry = /** @type {ol.geom.SimpleGeometry} */ (this.feature.getGeometry());
    if (geometry) {
      var coords = geometry.getFirstCoordinate();
      this['options'].position = coords || [0, 0];
      this.feature.set(os.annotation.OPTIONS_FIELD, this['options']);
    }

    if (this['options'].show) {
      this.updateTail();
    }

    os.ui.apply(this.scope);
  }
};


/**
 * Handle changes to overlay visibility.
 *
 * @private
 */
os.annotation.FeatureAnnotationCtrl.prototype.onOverlayVisibleChange_ = function() {
  if (!this.inVisibleChange_ && this.overlay) {
    this.inVisibleChange_ = true;

    // try updating the tail
    if (this.updateTail()) {
      ol.events.unlisten(this.overlay, 'change:visible', this.onOverlayVisibleChange_, this);
    }

    this.inVisibleChange_ = false;
  }
};


/**
 * @inheritDoc
 */
os.annotation.FeatureAnnotationCtrl.prototype.setTailType = function(type) {
  os.annotation.FeatureAnnotationCtrl.base(this, 'setTailType', type);

  if (this.element) {
    var svg = this.element.find('svg');
    svg.css('position', type);

    // for fixed positioning, resize the SVG to fill the map bounds. Absolute positioning will resize the SVG on each
    // tail update.
    if (type === os.annotation.TailType.FIXED) {
      var mapRect = os.annotation.getMapRect(this.overlay);
      if (mapRect) {
        svg.attr('height', mapRect.height);
        svg.attr('width', mapRect.width);
        svg.css('left', mapRect.x + 'px');
        svg.css('right', 'auto');
        svg.css('top', mapRect.y + 'px');
        svg.css('bottom', 'auto');
      }
    }
  }
};


/**
 * @inheritDoc
 */
os.annotation.FeatureAnnotationCtrl.prototype.getTargetPixel = function(coordinate) {
  if (this.overlay) {
    var map = this.overlay.getMap();
    if (map) {
      return map.getPixelFromCoordinate(coordinate);
    }
  }

  return undefined;
};


/**
 * @inheritDoc
 */
os.annotation.FeatureAnnotationCtrl.prototype.updateTail = function() {
  return this.tailType === os.annotation.TailType.ABSOLUTE ?
    this.updateTailAbsolute() :
    this.updateTailFixed();
};


/**
 * @inheritDoc
 *
 * @suppress {accessControls} To allow rendering the overlay.
 */
os.annotation.FeatureAnnotationCtrl.prototype.updateTailAbsolute = function() {
  //
  // Absolute positioning attaches the tail to the parent overlay. By setting the overlay's offset apporpriately to
  // position the tail on the target, the overlay can be repositioned smoothly without re-drawing the tail on each
  // map interaction (required with fixed positioning).
  //

  if (this.element && this.overlay) {
    // make sure the overlay is rendered before trying to draw the tail, or it will be drawn incorrectly.
    this.overlay.render();

    var position = this.overlay.getPosition();
    if (!position || !this.overlay.isVisible()) {
      return false;
    }

    var svg = this.element.find('svg');
    var mapRect = os.annotation.getMapRect(this.overlay);
    var targetPixel = this.getTargetPixel(position);
    if (!mapRect || !targetPixel) {
      return false;
    }

    targetPixel[0] += mapRect.x;
    targetPixel[1] += mapRect.y;

    var cardRect = this.element.find('.js-annotation')[0].getBoundingClientRect();
    if (!cardRect.width || !cardRect.height) {
      return false;
    }

    var svgWidth = Math.max(targetPixel[0], cardRect.x + cardRect.width) -
        Math.min(targetPixel[0], cardRect.x);
    var svgHeight = Math.max(targetPixel[1], cardRect.y + cardRect.height) -
        Math.min(targetPixel[1], cardRect.y);

    var cardOffsetX = 0;
    var cardOffsetY = 0;

    var pathTarget = [0, 0];
    if (targetPixel[0] < cardRect.x) {
      // target x is left of the annotation
      cardOffsetX = svgWidth - cardRect.width;
      svg.css('left', 'auto');
      svg.css('right', '0');
    } else if (targetPixel[0] <= cardRect.x + cardRect.width) {
      // target x is within the annotation
      pathTarget[0] = targetPixel[0] - cardRect.x;
      svg.css('left', '0');
      svg.css('right', 'auto');
    } else {
      // target x is right of the annotation
      pathTarget[0] = svgWidth;
      svg.css('left', '0');
      svg.css('right', 'auto');
    }

    if (targetPixel[1] < cardRect.y) {
      // target y is above of the annotation
      cardOffsetY = svgHeight - cardRect.height;
      svg.attr('height', cardRect.y - targetPixel[1] + cardRect.height);
      svg.css('top', 'auto');
      svg.css('bottom', '0');
    } else if (targetPixel[1] <= cardRect.y + cardRect.height) {
      // target y is within the annotation
      pathTarget[1] = targetPixel[1] - cardRect.y;
      svg.attr('height', cardRect.height);
      svg.css('top', '0');
      svg.css('bottom', 'auto');
    } else {
      // target y is below of the annotation
      pathTarget[1] = targetPixel[1] - cardRect.y;
      svg.attr('height', svgHeight);
      svg.css('top', '0');
      svg.css('bottom', 'auto');
    }

    var cardCenter = [cardOffsetX + cardRect.width / 2, cardOffsetY + cardRect.height / 2];
    // Changes the annotation tail style
    var anchorWidth = Math.min(cardRect.height, cardRect.width) * .33;
    // Hide the tail when the background is not displayed
    var tailStyle = !this['options'].showBackground ? os.annotation.TailStyle.NOTAIL : this['options'].showTail;
    var linePath = os.annotation.AbstractAnnotationCtrl.createTailPath(cardCenter, pathTarget, anchorWidth, tailStyle);

    svg.attr('width', svgWidth);
    svg.attr('height', svgHeight);
    svg.find('path').attr('d', linePath);

    if (this.userChanged_) {
      // after dragging/resizing the overlay, the internal offset will be incorrect. update it to prevent OpenLayers
      // from moving the overlay to the incorrect position.
      var offset = [
        (cardRect.x + cardRect.width / 2) - targetPixel[0],
        (cardRect.y + cardRect.height / 2) - targetPixel[1]
      ];
      this.overlay.setOffset(offset);

      if (this['options']) {
        this['options'].size = [cardRect.width, cardRect.height];
        this['options'].offset = offset;

        // notify that that annotation changed so it can be saved
        if (this.feature) {
          this.feature.dispatchEvent(new os.events.PropertyChangeEvent(os.annotation.EventType.CHANGE));
        }
      }

      this.userChanged_ = false;
    }
  }

  return true;
};


/**
 * @inheritDoc
 */
os.annotation.FeatureAnnotationCtrl.prototype.updateTailFixed = function() {
  //
  // When dragging/resizing the overlay, the tail is updated on each movement. This update is very slow using absolute
  // positioning because the SVG needs to be resized in addition to the tail's path change. To update the tail smoothly,
  // the SVG is resized to fill the entire map so changes only need to update the tail's path.
  //

  if (this.element && this.overlay) {
    var position = this.overlay.getPosition();
    if (!position) {
      return false;
    }

    var mapRect = os.annotation.getMapRect(this.overlay);
    var targetPixel = this.getTargetPixel(position);
    if (!mapRect || !targetPixel) {
      return false;
    }

    var cardRect = this.element.find('.js-annotation')[0].getBoundingClientRect();
    cardRect.x -= mapRect.x;
    cardRect.y -= mapRect.y;

    var cardCenter = [cardRect.x + cardRect.width / 2, cardRect.y + cardRect.height / 2];
    // Changes the annotation tail style
    var anchorWidth = Math.min(cardRect.height, cardRect.width) * .33;
    // Hide the tail when the background is not displayed
    var tailStyle = !this['options'].showBackground ? os.annotation.TailStyle.NOTAIL : this['options'].showTail;
    var linePath = os.annotation.AbstractAnnotationCtrl.createTailPath(cardCenter, targetPixel, anchorWidth, tailStyle);

    this.element.find('path').attr('d', linePath);

    os.annotation.setPosition(this.overlay, this.feature);

    this['options'].position = this.overlay.getPosition();
  }

  return true;
};
