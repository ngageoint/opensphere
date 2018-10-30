goog.provide('os.annotation.AnnotationCtrl');
goog.provide('os.annotation.annotationDirective');

goog.require('goog.Disposable');
goog.require('goog.async.ConditionalDelay');
goog.require('os.ui.Module');
goog.require('os.ui.text.simpleMDEDirective');


/**
 * The SVG tail CSS position.
 * @enum {string}
 */
os.annotation.TailType = {
  FIXED: 'fixed',
  ABSOLUTE: 'absolute'
};


/**
 * An annotation to attach to the map.
 * @return {angular.Directive}
 */
os.annotation.annotationDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'feature': '=',
      'overlay': '='
    },
    templateUrl: os.ROOT + 'views/annotation/annotation.html',
    controller: os.annotation.AnnotationCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('annotation', [os.annotation.annotationDirective]);



/**
 * Controller for the annotation directive.
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @extends {goog.Disposable}
 * @constructor
 * @ngInject
 */
os.annotation.AnnotationCtrl = function($scope, $element) {
  os.annotation.AnnotationCtrl.base(this, 'constructor');

  /**
   * The Angular scope.
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

  /**
   * The OpenLayers feature.
   * @type {ol.Feature}
   * @protected
   */
  this.feature = $scope['feature'];

  /**
   * The OpenLayers overlay.
   * @type {ol.Overlay}
   * @protected
   */
  this.overlay = $scope['overlay'];

  /**
   * The SVG tail type.
   * @type {os.annotation.TailType}
   * @private
   */
  this.tailType_ = os.annotation.TailType.ABSOLUTE;

  /**
   * The annotation title.
   * @type {string}
   */
  this['title'] = '';

  /**
   * The annotation content.
   * @type {string}
   */
  this['content'] = '';

  $element.parent().draggable({
    'containment': '#map-container',
    'handle': '.js-annotation',
    'start': this.onDragStart_.bind(this),
    'drag': this.updateTail_.bind(this),
    'stop': this.onDragStop_.bind(this),
    'scroll': false
  });

  $element.resizable({
    'containment': '#map-container',
    'minWidth': 200,
    'maxWidth': 800,
    'minHeight': 100,
    'maxHeight': 800,
    'handles': 'se',
    'start': this.onDragStart_.bind(this),
    'resize': this.updateTail_.bind(this),
    'stop': this.onDragStop_.bind(this)
  });

  ol.events.listen(this.feature, ol.events.EventType.CHANGE, this.handleFeatureChange, this);

  this.initialize();

  $scope.$on('$destroy', this.dispose.bind(this));
};
goog.inherits(os.annotation.AnnotationCtrl, goog.Disposable);


/**
 * @inheritDoc
 */
os.annotation.AnnotationCtrl.prototype.disposeInternal = function() {
  os.annotation.AnnotationCtrl.base(this, 'disposeInternal');

  ol.events.unlisten(this.feature, ol.events.EventType.CHANGE, this.handleFeatureChange, this);

  this.scope = null;
  this.element = null;

  this.feature = null;
  this.overlay = null;
};


/**
 * Initialize the annotation.
 * @protected
 */
os.annotation.AnnotationCtrl.prototype.initialize = function() {
  if (this.element && this.feature && this.overlay) {
    var options = this.feature.get(plugin.file.kml.KMLField.BALLOON_OPTIONS);

    var height = options ? options['height'] : 100;
    var width = options ? options['width'] : 200;
    var offset = options ? options['offset'] : [0, -75];

    this.element.height(height);
    this.element.width(width);
    this.overlay.setOffset(offset);

    this.setTailType_(os.annotation.TailType.ABSOLUTE);
    this.handleFeatureChange();

    // use a conditional delay for the initial tail update in case the map isn't initialized
    var updateDelay = new goog.async.ConditionalDelay(this.updateTail_, this);
    var cleanup = function() {
      goog.dispose(updateDelay);
    };
    updateDelay.onSuccess = updateDelay.onFailure = cleanup;
    updateDelay.start(50, 10000);
  }
};


/**
 * Update the title from the feature.
 * @protected
 */
os.annotation.AnnotationCtrl.prototype.handleFeatureChange = function() {
  this['title'] = '';
  this['content'] = '';

  if (this.feature && this.scope) {
    this['title'] = this.feature.get(os.ui.FeatureEditCtrl.Field.NAME);
    this['content'] = this.feature.get(os.ui.FeatureEditCtrl.Field.MD_DESCRIPTION) ||
        this.feature.get(os.ui.FeatureEditCtrl.Field.DESCRIPTION);
    os.ui.apply(this.scope);
  }
};


/**
 * Handle drag start event.
 * @param {Object} event The drag event.
 * @param {Object} ui The draggable UI object.
 * @private
 */
os.annotation.AnnotationCtrl.prototype.onDragStart_ = function(event, ui) {
  this.setTailType_(os.annotation.TailType.FIXED);
  this.updateTail_();
};


/**
 * Handle drag stop event.
 * @param {Object} event The drag event.
 * @param {Object} ui The draggable UI object.
 * @private
 */
os.annotation.AnnotationCtrl.prototype.onDragStop_ = function(event, ui) {
  this.setTailType_(os.annotation.TailType.ABSOLUTE);
  this.updateTail_();
};


/**
 * Set the SVG tail type.
 * @param {os.annotation.TailType} type The type.
 * @private
 */
os.annotation.AnnotationCtrl.prototype.setTailType_ = function(type) {
  this.tailType_ = type;

  if (this.element) {
    var svg = this.element.find('svg');
    svg.css('position', type);

    if (type === os.annotation.TailType.FIXED) {
      var mapRect = this.getMapRect_();
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
 * Get the OpenLayers map bounding rectangle.
 * @return {ClientRect|undefined} The map bounding rectangle, or undefined if the map/overlay are not defined.
 * @private
 */
os.annotation.AnnotationCtrl.prototype.getMapRect_ = function() {
  if (this.overlay) {
    var map = this.overlay.getMap();
    if (map) {
      var mapEl = map.getTargetElement();
      if (mapEl) {
        return mapEl.getBoundingClientRect();
      }
    }
  }

  return undefined;
};


/**
 * Get the map pixel for the provided coordinate.
 * @param {Array<number>} coordinate The map coordinate.
 * @return {Array<number>|undefined} The map pixel for the provided coordinate.
 * @private
 */
os.annotation.AnnotationCtrl.prototype.getTargetPixel_ = function(coordinate) {
  if (this.overlay) {
    var map = this.overlay.getMap();
    if (map) {
      return map.getPixelFromCoordinate(coordinate);
    }
  }

  return undefined;
};


/**
 * Update the SVG tail for the annotation.
 * @return {boolean}
 * @private
 */
os.annotation.AnnotationCtrl.prototype.updateTail_ = function() {
  return this.tailType_ === os.annotation.TailType.ABSOLUTE ? this.updateTailAbsolute_() : this.updateTailFixed_();
};


/**
 * Update the SVG tail for the annotation.
 * @return {boolean} If the update was successful.
 * @private
 */
os.annotation.AnnotationCtrl.prototype.updateTailAbsolute_ = function() {
  if (this.element && this.overlay) {
    var position = this.overlay.getPosition();
    if (!position) {
      return false;
    }

    var svg = this.element.find('svg');
    var mapRect = this.getMapRect_();
    var targetPixel = this.getTargetPixel_(position);
    if (!mapRect || !targetPixel) {
      return false;
    }

    targetPixel[0] += mapRect.x;
    targetPixel[1] += mapRect.y;

    var cardRect = this.element.find('.js-annotation')[0].getBoundingClientRect();
    var cardHeight = cardRect.height;
    var cardWidth = cardRect.width;

    var svgWidth = Math.max(targetPixel[0], cardRect.x + cardRect.width) -
        Math.min(targetPixel[0], cardRect.x);
    var svgHeight = Math.max(targetPixel[1], cardRect.y + cardRect.height) -
        Math.min(targetPixel[1], cardRect.y);

    var cardOffsetX = 0;
    var cardOffsetY = 0;

    var pathTargetX = 0;
    if (targetPixel[0] < cardRect.x) {
      // target x is left of the annotation
      pathTargetX = 0;
      cardOffsetX = svgWidth - cardWidth;
      svg.css('left', 'auto');
      svg.css('right', '0');
    } else if (targetPixel[0] <= cardRect.x + cardWidth) {
      // target x is within the annotation
      pathTargetX = targetPixel[0] - cardRect.x;
      svg.css('left', '0');
      svg.css('right', 'auto');
    } else {
      // target x is right of the annotation
      pathTargetX = svgWidth;
      svg.css('left', '0');
      svg.css('right', 'auto');
    }

    var pathTargetY = 0;
    if (targetPixel[1] < cardRect.y) {
      // target y is above of the annotation
      pathTargetY = 0;
      cardOffsetY = svgHeight - cardHeight;
      svg.attr('height', cardRect.y - targetPixel[1] + cardHeight);
      svg.css('top', 'auto');
      svg.css('bottom', '0');
    } else if (targetPixel[1] <= cardRect.y + cardHeight) {
      // target y is within the annotation
      pathTargetY = targetPixel[1] - cardRect.y;
      svg.attr('height', cardHeight);
      svg.css('top', '0');
      svg.css('bottom', 'auto');
    } else {
      // target y is below of the annotation
      pathTargetY = targetPixel[1] - cardRect.y;
      svg.attr('height', svgHeight);
      svg.css('top', '0');
      svg.css('bottom', 'auto');
    }

    var linePath = 'M' + (cardOffsetX + cardWidth * .33) + ' ' + (cardOffsetY + cardHeight / 2) +
        ' L' + pathTargetX + ' ' + pathTargetY +
        ' L' + (cardOffsetX + cardWidth * .66) + ' ' + (cardOffsetY + cardHeight / 2);

    svg.attr('width', svgWidth);
    svg.attr('height', svgHeight);
    svg.find('path').attr('d', linePath);

    // after dragging/resizing the overlay, the internal offset will be incorrect. update it to prevent OpenLayers from
    // moving the overlay to the incorrect position.
    var offset = [
      (cardRect.x + cardRect.width / 2) - targetPixel[0],
      (cardRect.y + cardRect.height / 2) - targetPixel[1]
    ];
    this.overlay.setOffset(offset);
    this.feature.set(plugin.file.kml.KMLField.BALLOON_OPTIONS, {
      'height': cardHeight,
      'width': cardWidth,
      'offset': offset
    });
  }

  return true;
};


/**
 * Update the SVG tail for the annotation.
 * @return {boolean} If the update was successful.
 * @private
 */
os.annotation.AnnotationCtrl.prototype.updateTailFixed_ = function() {
  if (this.element && this.overlay) {
    var position = this.overlay.getPosition();
    if (!position) {
      return false;
    }

    var mapRect = this.getMapRect_();
    var targetPixel = this.getTargetPixel_(position);
    if (!mapRect || !targetPixel) {
      return false;
    }

    var cardRect = this.element.find('.js-annotation')[0].getBoundingClientRect();
    cardRect.x -= mapRect.x;
    cardRect.y -= mapRect.y;

    var linePath = 'M' + (cardRect.x + cardRect.width * .33) + ' ' + (cardRect.y + cardRect.height / 2) +
        ' L' + targetPixel[0] + ' ' + targetPixel[1] +
        ' L' + (cardRect.x + cardRect.width * .66) + ' ' + (cardRect.y + cardRect.height / 2);

    this.element.find('path').attr('d', linePath);
  }

  return true;
};
