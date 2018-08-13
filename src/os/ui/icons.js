goog.provide('os.ui.Icons');
goog.provide('os.ui.IconsSVG');
goog.require('goog.crypt.hash32');
goog.require('os.color');
goog.require('os.defines');

/**
 * Icon svg markup
 * @enum {string}
 */
os.ui.IconsSVG = {
  FEATURES: '<image xlink:href="' + os.ROOT + 'images/features-base.png" ' +
      'x="0" y="0" width="16px" height="16px"><title>Feature layer</title></image>',
  TILES: '<image xlink:href="' + os.ROOT + 'images/tiles-base.png" ' +
      'x="0" y="0" width="16px" height="16px"><title>Tile layer</title></image>',
  TIME: '<image class="time-icon" xlink:href="' + os.ROOT + 'images/time-base.png" ' +
      'x="0" y="0" width="16px" height="16px"><title>This layer supports animation over time</title></image>',
  LOCK: '<image xlink:href="' + os.ROOT + 'images/lock_tiny_white.png" ' +
      'x="0" y="0" width="16px" height="16px"><title>This layer is locked.</title></image>'
};


/**
 * Icon image markup
 * @enum {string}
 */
os.ui.Icons = {
  DAYNIGHT: '<i class="fa fa-sun-o"></i><i class="fa fa-moon-o"></i>',
  FEATURES: '<img src="' + os.ROOT + 'images/features-base.png" title="Feature layer"/>',
  STATE: '<i class="fa fa-bookmark" title="State file"/>',
  TERRAIN: '<i class="fa fa-area-chart" title="This layer provides terrain in 3D mode"></i>',
  TILES: '<img src="' + os.ROOT + 'images/tiles-base.png" title="Tile layer"/>',
  TIME: '<img class="time-icon" src="' + os.ROOT + 'images/time-base.png" ' +
      'title="This layer supports animation over time"/>',
  DEPRECATED: '<i class="fa fa-exclamation-circle" title="This layer is soon to be deleted"></i>',
  LOCK: '<i class="fa fa-lock" title="This layer is locked."></i>',
  COLOR_MODEL: '<i class="fa fa-tint" title="This layer has auto/manual coloring rules applied"></i>'
};


/**
 * @type {!Array.<number>}
 * @const
 * @private
 */
os.ui.white_ = [0xff, 0xff, 0xff];


/**
 * @type {number}
 * @const
 */
os.ui.ICON_WIDTH = 16;


/**
 * @param {string} id The layer id
 * @param {Array<string>} svgIcons SVG icons
 * @param {Array<string>} faIcons Font Awesome icons
 * @param {Array<number>|string} color The icon color
 * @return {string}
 */
os.ui.createIconSet = function(id, svgIcons, faIcons, color) {
  var html = '';
  id = os.ui.hashIconId(id);

  if (svgIcons && svgIcons.length > 0) {
    var arrColor = goog.isString(color) ? os.color.toRgbArray(color) : color;
    var values = os.color.changeColor(os.ui.white_, arrColor || os.ui.white_);
    var width = os.ui.ICON_WIDTH * svgIcons.length;
    var filter = 'filter_';
    var matrix = 'matrix_';
    html += '<svg width="' + width + 'px" height="16px" style="vertical-align:middle" ' +
        'xmlns="http://www.w3.org/2000/svg" filter="url(#' + filter + id + ')">';

    html += svgIcons.join('');
    var re = /x="(\d+)"/g;

    os.ui.xReplaceI_ = 0;
    html = html.replace(re, os.ui.xReplace_);
    html += '<filter id="' + filter + id + '">';
    html += '<feColorMatrix id="' + matrix + id + '" values="' + values.join(' ') + '"/>';
    html += '</filter></svg>';
  }

  if (faIcons && faIcons.length > 0) {
    var hexColor = os.color.toHexString(color);
    for (var i = 0, ii = faIcons.length; i < ii; i++) {
      var icon = faIcons[i].replace('class="', 'class="layer-icon-' + id + ' ');
      icon = icon.replace('>', ' style="color:' + hexColor + '">');
      html += icon;
    }
  }

  return html;
};


/**
 * Hashes an icon ID. This prevents us from putting invalid special characters in an ID selector.
 * @param {string} id
 * @return {string}
 */
os.ui.hashIconId = function(id) {
  return String(goog.crypt.hash32.encodeString(id));
};


/**
 * @type {number}
 * @private
 */
os.ui.xReplaceI_ = 0;


/**
 * @param {string} match
 * @param {string} p1
 * @param {number} offset
 * @param {string} whole
 * @return {string}
 * @private
 */
os.ui.xReplace_ = function(match, p1, offset, whole) {
  var x = os.ui.xReplaceI_ * os.ui.ICON_WIDTH;
  os.ui.xReplaceI_++;
  return match.replace(p1, x.toString());
};


/**
 * @param {string} id
 * @param {Array<number>|string} color
 */
os.ui.adjustIconSet = function(id, color) {
  if (goog.isString(color)) {
    color = os.color.toRgbArray(color);
  }

  var values = os.color.changeColor(os.ui.white_, color || os.ui.white_);
  id = os.ui.hashIconId(id);
  var matrix = angular.element('#matrix_' + id);
  matrix.attr('values', values.join(' '));

  var hexColor = os.color.toHexString(color || os.ui.white_);
  angular.element('i.fa.layer-icon-' + id).css('color', hexColor);
};
