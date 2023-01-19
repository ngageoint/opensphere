goog.declareModuleId('os.annotation.FeatureAnnotationUI');

import EventType from 'ol/src/events/EventType.js';
import {listen, unlistenByKey} from 'ol/src/events.js';

import '../ui/text/tuieditorui.js';
import PropertyChangeEvent from '../events/propertychangeevent.js';
import FeatureEditField from '../ui/featureeditfield.js';
import Module from '../ui/module.js';
import * as TuiEditor from '../ui/text/tuieditor.js';
import {apply} from '../ui/ui.js';
import AbstractAnnotationCtrl from './abstractannotationctrl.js';
import * as annotation from './annotation.js';
import TailStyle from './tailstyle.js';
import TailType from './tailtype.js';

/**
 * The annotation template. This must be inline to avoid timing issues between template load and positioning the
 * element on the view.
 * @type {string}
 * @const
 */
const template =
  '<div class="c-annotation u-hover-container" ' +
    'ng-class="{\'c-annotation__editing\': ctrl.editingDescription || ctrl.editingName}">' +
    '<svg class="c-annotation__svg">' +
      '<path ng-style="{ \'fill\': ctrl.options.showDescription ? ctrl.options.bodyBG : ctrl.options.headerBG, ' +
          '\'stroke\': ctrl.options.showDescription ? ctrl.options.bodyBG : ctrl.options.headerBG, ' +
          '\'stroke-width\': ctrl.options.showTail == \'line\' ? \'3px\' : \'0px\' }" />' +
    '</svg>' +
    '<div class="u-card-popup position-absolute text-right animate-fade u-hover-show" ' +
        ' ng-show="ctrl.options.editable">' +
      '<button class="btn btn-sm btn-outline-primary border-0 bg-transparent" ' +
          'title="Hide text box" ' +
          'ng-click="ctrl.hideAnnotation()">' +
        '<i class="c-glyph fa fa-fw fa-eye-slash"></i>' +
      '</button>' +
      '<button class="btn btn-sm btn-outline-primary border-0 bg-transparent" ' +
          'title="Edit text box" ' +
          'ng-click="ctrl.launchEditWindow()">' +
        '<i class="c-glyph fa fa-fw fa-pencil"></i>' +
      '</button>' +
    '</div>' +
    '<div class="js-annotation c-window card h-100" ' +
      'ng-class="{ \'bg-transparent u-border-show-on-hover u-text-stroke\': !ctrl.options.showBackground }">' +
      '<div class="flex-shrink-0 text-truncate px-1 py-0 js-annotation__header" title="{{ctrl.name}}" ' +
          'ng-show="ctrl.options.showName" ' +
          'ng-class="{ \'h-100 border-0\': !ctrl.options.showDescription, ' +
            '\'card-header\': ctrl.options.showBackground }" ' +
          'ng-style="{ background: ctrl.options.showBackground ? ctrl.options.headerBG : transparent }" ' +
          'ng-dblclick="ctrl.editName()">' +
        '<div ng-show="!ctrl.editingName">{{ctrl.name}}</div>' +
        '<div class="form-row p-1" ng-if="ctrl.editingName">' +
          '<div class="col">' +
            '<input id="placeName" class="form-control" type="text" ng-model="ctrl.name" ng-click="ctrl.setFocus()"/>' +
          '</div>' +
          '<div class="col-auto">' +
            '<button class="btn btn-success mr-1" title="Save the name" ' +
                'ng-click="ctrl.saveAnnotation()" ' +
                'ng-disabled="!ctrl.name">' +
              '<i class="fa fa-check"></i> OK' +
            '</button>' +
            '<button class="btn btn-secondary" title="Cancel editing the text box" ng-click="ctrl.cancelEdit()">' +
              '<i class="fa fa-ban"></i> Cancel' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="card-body p-1 u-overflow-y-auto d-flex flex-fill flex-column" ' +
          'ng-show="ctrl.options.showDescription" ' +
          'ng-style="{ background: ctrl.options.showBackground ? ctrl.options.bodyBG : transparent }" ' +
          'ng-dblclick="ctrl.editDescription()">' +
        '<tuieditor text="ctrl.description" edit="ctrl.editingDescription" is-required="false"' +
        'maxlength="4000" ng-click="ctrl.setFocusDesc()">' +
        '</tuieditor>' +
        '<div class="text-right mt-1" ng-if="ctrl.editingDescription">' +
          '<button class="btn btn-success mr-1" title="Save the text box" ng-click="ctrl.saveAnnotation()">' +
            '<i class="fa fa-check"></i> OK' +
          '</button>' +
          '<button class="btn btn-secondary" title="Cancel editing the text box" ng-click="ctrl.cancelEdit()">' +
            '<i class="fa fa-ban"></i> Cancel' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>';

/**
 * An feature-based annotation to attach to the map.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'feature': '=',
    'overlay': '='
  },
  template,
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'featureannotation';


/**
 * Add the directive to the module
 */
Module.directive('featureannotation', [directive]);



/**
 * Controller for the featureannotation directive.
 * @unrestricted
 */
export class Controller extends AbstractAnnotationCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @param {!angular.$timeout} $timeout The Angular $timeout service.
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
    super($scope, $element, $timeout);

    /**
     * The OpenLayers feature.
     * @type {ol.Feature}
     * @protected
     */
    this.feature = $scope['feature'];

    /**
     * The OpenLayers overlay.
     * @type {WebGLOverlay}
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

    this.changeEventsKey_ = listen(this.feature, EventType.CHANGE, this.onFeatureChange_, this);
    this.visibleEventsKey_ = listen(this.overlay, 'change:visible', this.onOverlayVisibleChange_, this);
  }

  /**
   * @inheritDoc
   */
  $onDestroy() {
    super.$onDestroy();

    unlistenByKey(this.changeEventsKey_);
    unlistenByKey(this.visibleEventsKey_);

    this.feature = null;
    this.overlay = null;
  }

  /**
   * @inheritDoc
   */
  $onInit() {
    super.$onInit();
    this.onFeatureChange_();
  }

  /**
   * @inheritDoc
   */
  getOptions() {
    return /** @type {!osx.annotation.Options} */ (this.feature.get(annotation.OPTIONS_FIELD));
  }

  /**
   * @inheritDoc
   * @export
   */
  launchEditWindow() {
    if (this.feature) {
      this.feature.dispatchEvent(new PropertyChangeEvent(annotation.EventType.EDIT));
    }
  }

  /**
   * @inheritDoc
   * @export
   */
  hideAnnotation() {
    if (this.feature) {
      this['options'].show = false;
      this.feature.dispatchEvent(new PropertyChangeEvent(annotation.EventType.HIDE));
    }
  }

  /**
   * @inheritDoc
   * @export
   */
  saveAnnotation() {
    super.saveAnnotation();

    this.feature.set(FeatureEditField.NAME, this['name']);
    this.feature.set(FeatureEditField.DESCRIPTION,
        TuiEditor.render(this['description']));
    this.feature.set(FeatureEditField.MD_DESCRIPTION, this['description']);

    this.feature.dispatchEvent(new PropertyChangeEvent(annotation.EventType.UPDATE_PLACEMARK));
  }

  /**
   * Update the title from the feature.
   *
   * @private
   */
  onFeatureChange_() {
    this['name'] = '';
    this['description'] = '';

    if (this.feature && this.scope) {
      this['name'] = annotation.getNameText(this.feature);
      this['description'] = annotation.getDescriptionText(this.feature);
      this['options'] = /** @type {!osx.annotation.Options} */ (this.feature.get(annotation.OPTIONS_FIELD));

      if (!this['options'].position) {
        // initialize it to the first coordinate
        var geometry = /** @type {ol.geom.SimpleGeometry} */ (this.feature.getGeometry());
        if (geometry) {
          var coords = geometry.getFirstCoordinate();
          this['options'].position = coords || [0, 0];
          this.feature.set(annotation.OPTIONS_FIELD, this['options']);
        }
      }

      if (this['options'].show) {
        this.updateTail();
      }

      apply(this.scope);
    }
  }

  /**
   * Handle changes to overlay visibility.
   *
   * @private
   */
  onOverlayVisibleChange_() {
    if (!this.inVisibleChange_ && this.overlay) {
      this.inVisibleChange_ = true;

      // try updating the tail
      if (this.updateTail()) {
        unlistenByKey(this.visibleEventsKey_);
      }

      this.inVisibleChange_ = false;
    }
  }

  /**
   * @inheritDoc
   */
  setTailType(type) {
    super.setTailType(type);

    if (this.element) {
      var svg = this.element.find('svg');
      svg.css('position', type);

      // for fixed positioning, resize the SVG to fill the map bounds. Absolute positioning will resize the SVG on each
      // tail update.
      if (type === TailType.FIXED) {
        var mapRect = annotation.getMapRect(this.overlay);
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
  }

  /**
   * @inheritDoc
   */
  getTargetPixel(coordinate) {
    if (this.overlay) {
      var map = this.overlay.getMap();
      if (map) {
        return map.getPixelFromCoordinate(coordinate);
      }
    }

    return undefined;
  }

  /**
   * @inheritDoc
   *
   * @suppress {accessControls} To allow rendering the overlay.
   */
  updateTailAbsolute() {
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
      var mapRect = annotation.getMapRect(this.overlay);
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
      var tailStyle = !this['options'].showBackground ? TailStyle.NOTAIL : this['options'].showTail;
      var linePath = AbstractAnnotationCtrl.createTailPath(cardCenter, pathTarget, anchorWidth, tailStyle);

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
            this.feature.dispatchEvent(new PropertyChangeEvent(annotation.EventType.CHANGE));
          }
        }

        this.userChanged_ = false;
      }
    }

    return true;
  }

  /**
   * @inheritDoc
   */
  updateTailFixed() {
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

      var mapRect = annotation.getMapRect(this.overlay);
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
      var tailStyle = !this['options'].showBackground ? TailStyle.NOTAIL : this['options'].showTail;
      var linePath = AbstractAnnotationCtrl.createTailPath(cardCenter, targetPixel, anchorWidth, tailStyle);

      this.element.find('path').attr('d', linePath);

      annotation.setPosition(this.overlay, this.feature);

      this['options'].position = this.overlay.getPosition();
    }

    return true;
  }
}
