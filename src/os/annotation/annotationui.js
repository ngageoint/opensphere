goog.provide('os.annotation.AnnotationCtrl');
goog.provide('os.annotation.annotationDirective');

goog.require('goog.Disposable');
goog.require('goog.async.ConditionalDelay');
goog.require('os.annotation');
goog.require('os.annotation.TailStyle');
goog.require('os.events.PropertyChangeEvent');
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
    template: os.annotation.UI_TEMPLATE_,
    controller: os.annotation.AnnotationCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('annotation', [os.annotation.annotationDirective]);


/**
 * The annotation template. This must be inline to avoid timing issues between template load and positioning the
 * element on the map.
 * @type {string}
 * @private
 * @const
 */
os.annotation.UI_TEMPLATE_ =
  '<div class="c-annotation u-hover-container">' +
    '<svg class="c-annotation__svg"><path/></svg>' +
    '<div class="c-annotation__controls position-absolute text-right w-100" ng-if="ctrl.options.editable">' +
        '<button class="btn btn-sm btn-outline-secondary border-0 bg-transparent animate-fade u-hover-show"' +
          'title="Edit annotation"' +
          'ng-click="ctrl.editAnnotation()">' +
          '<i class="fa fa-pencil"></i>' +
        '</button>' +
      '</div>' +
      '<div class="js-annotation card h-100">' +
        '<div class="card-header flex-shrink-0 text-truncate px-1 py-0" title="{{ctrl.name}}"' +
          'ng-show="ctrl.options.showName"' +
          'ng-class="!ctrl.options.showDescription && \'h-100 border-0\'">' +
          '{{ctrl.name}}' +
        '</div>' +
        '<div class="card-body p-1 u-overflow-y-auto" ng-show="ctrl.options.showDescription">' +
        ' <simplemde text="ctrl.description" edit="false" is-required="false" maxlength="4000"></simplemde>' +
        '</div>' +
      '</div>' +
    '</div>';



/**
 * Controller for the annotation directive.
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @param {!angular.$timeout} $timeout The Angular $timeout service.
 * @extends {goog.Disposable}
 * @constructor
 * @ngInject
 */
os.annotation.AnnotationCtrl = function($scope, $element, $timeout) {
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
   * @type {os.webgl.WebGLOverlay}
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
   * If handling a visibility change event.
   * @type {boolean}
   * @private
   */
  this.inVisibleChange_ = false;

  /**
   * If the user moved/resized the overlay.
   * @type {boolean}
   * @private
   */
  this.userChanged_ = false;

  /**
   * The annotation name.
   * @type {string}
   */
  this['name'] = '';

  /**
   * The annotation description.
   * @type {string}
   */
  this['description'] = '';

  /**
   * The annotation options.
   * @type {!osx.annotation.Options}
   */
  this['options'] = /** @type {!osx.annotation.Options} */ (this.feature.get(os.annotation.OPTIONS_FIELD));

  ol.events.listen(this.feature, ol.events.EventType.CHANGE, this.onFeatureChange_, this);
  ol.events.listen(this.overlay, 'change:visible', this.onOverlayVisibleChange_, this);

  this.initialize();
  $timeout(this.initDragResize.bind(this));

  $scope.$on('$destroy', this.dispose.bind(this));
};
goog.inherits(os.annotation.AnnotationCtrl, goog.Disposable);


/**
 * @inheritDoc
 */
os.annotation.AnnotationCtrl.prototype.disposeInternal = function() {
  os.annotation.AnnotationCtrl.base(this, 'disposeInternal');

  ol.events.unlisten(this.feature, ol.events.EventType.CHANGE, this.onFeatureChange_, this);
  ol.events.unlisten(this.overlay, 'change:visible', this.onOverlayVisibleChange_, this);

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
    this.element.width(this['options'].size[0]);
    this.element.height(this['options'].size[1]);

    this.setTailType_(os.annotation.TailType.ABSOLUTE);
    this.onFeatureChange_();

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
 * Initialize the drag/resize handlers.
 * @protected
 */
os.annotation.AnnotationCtrl.prototype.initDragResize = function() {
  if (this.element && this.element.parent().length) {
    // OpenLayers absolutely positions the parent container, so attach the draggable handler to that and use the
    // annotation container as the drag target.
    this.element.parent().draggable({
      'containment': '#map-container',
      'handle': '.js-annotation',
      'start': this.onDragStart_.bind(this),
      'drag': this.updateTail_.bind(this),
      'stop': this.onDragStop_.bind(this),
      'scroll': false
    });

    this.element.resizable({
      'containment': '#map-container',
      'minWidth': 50,
      'maxWidth': 800,
      'minHeight': 25,
      'maxHeight': 800,
      'handles': 'se',
      'start': this.onDragStart_.bind(this),
      'resize': this.updateTail_.bind(this),
      'stop': this.onDragStop_.bind(this)
    });
  }
};


/**
 * Edit the annotation.
 * @export
 */
os.annotation.AnnotationCtrl.prototype.editAnnotation = function() {
  if (this.feature) {
    this.feature.dispatchEvent(new os.events.PropertyChangeEvent(os.annotation.EventType.EDIT));
  }
};


/**
 * Update the title from the feature.
 * @private
 */
os.annotation.AnnotationCtrl.prototype.onFeatureChange_ = function() {
  this['name'] = '';
  this['description'] = '';

  if (this.feature && this.scope) {
    this['name'] = os.annotation.getNameText(this.feature);
    this['description'] = os.annotation.getDescriptionText(this.feature);

    if (this['options'].show) {
      this.updateTail_();
    }

    os.ui.apply(this.scope);
  }
};


/**
 * Handle changes to overlay visibility.
 * @private
 */
os.annotation.AnnotationCtrl.prototype.onOverlayVisibleChange_ = function() {
  if (!this.inVisibleChange_ && this.overlay) {
    this.inVisibleChange_ = true;

    // try updating the tail
    if (this.updateTail_()) {
      ol.events.unlisten(this.overlay, 'change:visible', this.onOverlayVisibleChange_, this);
    }

    this.inVisibleChange_ = false;
  }
};


/**
 * Handle drag start event.
 * @param {Object} event The drag event.
 * @param {Object} ui The draggable UI object.
 * @private
 */
os.annotation.AnnotationCtrl.prototype.onDragStart_ = function(event, ui) {
  // use fixed positioning during drag/resize for smoother SVG updates
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
  // use absolute positioning when drag/resize stops for smoother repositioning on map interaction
  this.setTailType_(os.annotation.TailType.ABSOLUTE);
  this.userChanged_ = true;
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

    // for fixed positioning, resize the SVG to fill the map bounds. Absolute positioning will resize the SVG on each
    // tail update.
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
  return this.tailType_ === os.annotation.TailType.ABSOLUTE ?
      this.updateTailAbsolute_() :
      this.updateTailFixed_();
};


/**
 * Update the SVG tail for the annotation using an absolute position.
 * @return {boolean} If the update was successful.
 * @private
 *
 * @suppress {accessControls} To allow rendering the overlay.
 */
os.annotation.AnnotationCtrl.prototype.updateTailAbsolute_ = function() {
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
    var mapRect = this.getMapRect_();
    var targetPixel = this.getTargetPixel_(position);
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
    if (this['options'].showTail === os.annotation.TailStyle.NOTAIL) {
      anchorWidth = 0;
    }
    if (this['options'].showTail === os.annotation.TailStyle.LINETAIL) {
      anchorWidth = 1;
    }
    var linePath = os.annotation.AnnotationCtrl.createTailPath_(cardCenter, pathTarget, anchorWidth);

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
 * Update the SVG tail for the annotation using fixed position.
 * @return {boolean} If the update was successful.
 * @private
 */
os.annotation.AnnotationCtrl.prototype.updateTailFixed_ = function() {
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

    var mapRect = this.getMapRect_();
    var targetPixel = this.getTargetPixel_(position);
    if (!mapRect || !targetPixel) {
      return false;
    }

    var cardRect = this.element.find('.js-annotation')[0].getBoundingClientRect();
    cardRect.x -= mapRect.x;
    cardRect.y -= mapRect.y;

    var cardCenter = [cardRect.x + cardRect.width / 2, cardRect.y + cardRect.height / 2];
    // Changes the annotation tail style
    var anchorWidth = Math.min(cardRect.height, cardRect.width) * .33;
    if (this['options'].showTail === os.annotation.TailStyle.NOTAIL) {
      anchorWidth = 0;
    }
    if (this['options'].showTail === os.annotation.TailStyle.LINETAIL) {
      anchorWidth = 1;
    }
    var linePath = os.annotation.AnnotationCtrl.createTailPath_(cardCenter, targetPixel, anchorWidth);

    this.element.find('path').attr('d', linePath);
  }

  return true;
};


/**
 * Generate the SVG tail path for an annotation.
 * @param {!Array<number>} center The annotation center coordinate, in pixels.
 * @param {!Array<number>} target The annotation target coordinate, in pixels.
 * @param {number} radius The anchor line radius, in pixels.
 * @return {string} The SVG tail path.
 * @private
 */
os.annotation.AnnotationCtrl.createTailPath_ = function(center, target, radius) {
  var anchor1 = os.annotation.AnnotationCtrl.rotateAnchor_(center, target, radius);
  var anchor2 = os.annotation.AnnotationCtrl.rotateAnchor_(center, target, -radius);

  return 'M' + anchor1[0] + ' ' + anchor1[1] +
      ' L' + target[0] + ' ' + target[1] +
      ' L' + anchor2[0] + ' ' + anchor2[1];
};


/**
 * Rotate a tail anchor position around the annotation center. This is used to create an anchor line that is
 * perpendicular to the line from center to target.
 * @param {!Array<number>} center The annotation center coordinate, in pixels.
 * @param {!Array<number>} target The annotation target coordinate, in pixels.
 * @param {number} x The x offset from center.
 * @return {!Array<number>} The rotated pixel coordinate.
 * @private
 */
os.annotation.AnnotationCtrl.rotateAnchor_ = function(center, target, x) {
  var angle = Math.atan2(center[1] - target[1], center[0] - target[0]) + Math.PI / 2;
  var anchor = [
    x * Math.cos(angle) + center[0],
    x * Math.sin(angle) + center[1]
  ];

  return anchor;
};
