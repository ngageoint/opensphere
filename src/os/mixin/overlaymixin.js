goog.declareModuleId('os.mixin.overlay');

import Overlay from 'ol/src/Overlay.js';
import OverlayPositioning from 'ol/src/OverlayPositioning.js';

Overlay.prototype.rendered = {
  bottom_: '',
  left_: '',
  right_: '',
  top_: '',
  visible: true
};

Overlay.prototype.updateRenderedPosition = function(pixel, mapSize) {
  var style = this.element.style;
  var offset = this.getOffset();

  var positioning = this.getPositioning();

  this.setVisible(true);

  var offsetX = offset[0];
  var offsetY = offset[1];
  if (positioning == OverlayPositioning.BOTTOM_RIGHT ||
      positioning == OverlayPositioning.CENTER_RIGHT ||
      positioning == OverlayPositioning.TOP_RIGHT) {
    if (this.rendered.left_ !== '') {
      this.rendered.left_ = style.left = '';
    }
    var right = Math.round(mapSize[0] - pixel[0] - offsetX) + 'px';
    if (this.rendered.right_ != right) {
      this.rendered.right_ = style.right = right;
    }
  } else {
    if (this.rendered.right_ !== '') {
      this.rendered.right_ = style.right = '';
    }
    if (positioning == OverlayPositioning.BOTTOM_CENTER ||
        positioning == OverlayPositioning.CENTER_CENTER ||
        positioning == OverlayPositioning.TOP_CENTER) {
      offsetX -= this.element.offsetWidth / 2;
    }
    var left = Math.round(pixel[0] + offsetX) + 'px';
    if (this.rendered.left_ != left) {
      this.rendered.left_ = style.left = left;
    }
  }
  if (positioning == OverlayPositioning.BOTTOM_LEFT ||
      positioning == OverlayPositioning.BOTTOM_CENTER ||
      positioning == OverlayPositioning.BOTTOM_RIGHT) {
    if (this.rendered.top_ !== '') {
      this.rendered.top_ = style.top = '';
    }
    var bottom = Math.round(mapSize[1] - pixel[1] - offsetY) + 'px';
    if (this.rendered.bottom_ != bottom) {
      this.rendered.bottom_ = style.bottom = bottom;
    }
  } else {
    if (this.rendered.bottom_ !== '') {
      this.rendered.bottom_ = style.bottom = '';
    }
    if (positioning == OverlayPositioning.CENTER_LEFT ||
        positioning == OverlayPositioning.CENTER_CENTER ||
        positioning == OverlayPositioning.CENTER_RIGHT) {
      offsetY -= this.element.offsetHeight / 2;
    }
    var top = Math.round(pixel[1] + offsetY) + 'px';
    if (this.rendered.top_ != top) {
      this.rendered.top_ = style.top = top;
    }
  }
};
