goog.provide('os.ui.Icons');
goog.provide('os.ui.IconsSVG');
goog.provide('os.ui.icons');

goog.require('goog.crypt.hash32');
goog.require('os');
goog.require('os.color');
goog.require('os.ui');


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
  STATE: '<i class="fa fa-bookmark ml-1" title="State file"></i>',
  TERRAIN: '<i class="fa fa-area-chart" title="This layer provides terrain in 3D mode"></i>',
  TILES: '<img src="' + os.ROOT + 'images/tiles-base.png" title="Tile layer"/>',
  TIME: '<img class="time-icon" src="' + os.ROOT + 'images/time-base.png" ' +
      'title="This layer supports animation over time"/>',
  DEPRECATED: '<i class="fa fa-exclamation-circle text-danger" title="This layer is soon to be deleted"></i>',
  LOCK: '<i class="fa fa-lock" title="This layer is locked."></i>',
  COLOR_MODEL: '<i class="fa fa-tint ml-1" title="This layer has auto/manual coloring rules applied"></i>',
  FILTER: '<i class="fa fa-filter position-relative" title="This filter is active"></i>',
  FEATUREACTION: '<i class="fa fa-magic" title="This layer has an active feature action"></i>'
};


/**
 * @type {!Array.<number>}
 * @const
 * @private
 */
os.ui.icons.white_ = [0xff, 0xff, 0xff];


/**
 * @type {number}
 * @const
 */
os.ui.icons.ICON_WIDTH = 16;


/**
 * @param {string} id The layer id
 * @param {Array<string>} svgIcons SVG icons
 * @param {Array<string>} faIcons Font Awesome icons
 * @param {Array<number>|string} color The icon color
 * @return {string}
 */
os.ui.icons.createIconSet = function(id, svgIcons, faIcons, color) {
  var html = '';
  id = os.ui.icons.hashIconId(id);

  if (svgIcons && svgIcons.length > 0) {
    var arrColor = typeof color === 'string' ? os.color.toRgbArray(color) : color;
    var values = os.color.changeColor(os.ui.icons.white_, arrColor || os.ui.icons.white_);
    var width = os.ui.icons.ICON_WIDTH * svgIcons.length;
    var filter = 'filter_';
    var matrix = 'matrix_';
    html += '<svg width="' + width + 'px" height="16px" class="align-middle" ' +
        'xmlns="http://www.w3.org/2000/svg" filter="url(#' + filter + id + ')">';

    html += svgIcons.join('');
    var re = /x="(\d+)"/g;

    os.ui.icons.xReplaceI_ = 0;
    html = html.replace(re, os.ui.icons.xReplace_);
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
 * @param {string} id The layer id
 * @param {Array<string>} svgIcons SVG icons
 * @param {Array<string>} faIcons Font Awesome icons
 * @param {Array<number>|string} color The icon color
 * @return {string}
 *
 * @deprecated Please use `os.ui.icons.createIconSet` instead.
 */
os.ui.createIconSet = os.ui.icons.createIconSet;


/**
 * Hashes an icon ID. This prevents us from putting invalid special characters in an ID selector.
 *
 * @param {string} id
 * @return {string}
 */
os.ui.icons.hashIconId = function(id) {
  return String(goog.crypt.hash32.encodeString(id));
};


/**
 * Hashes an icon ID. This prevents us from putting invalid special characters in an ID selector.
 * @param {string} id
 * @return {string}
 *
 * @deprecated Please use `os.ui.icons.hashIconId` instead.
 */
os.ui.hashIconId = os.ui.icons.hashIconId;


/**
 * @type {number}
 * @private
 */
os.ui.icons.xReplaceI_ = 0;


/**
 * @param {string} match
 * @param {string} p1
 * @param {number} offset
 * @param {string} whole
 * @return {string}
 * @private
 */
os.ui.icons.xReplace_ = function(match, p1, offset, whole) {
  var x = os.ui.icons.xReplaceI_ * os.ui.icons.ICON_WIDTH;
  os.ui.icons.xReplaceI_++;
  return match.replace(p1, x.toString());
};


/**
 * @param {string} id
 * @param {Array<number>|string} color
 */
os.ui.icons.adjustIconSet = function(id, color) {
  if (typeof color === 'string') {
    color = os.color.toRgbArray(color);
  }

  var values = os.color.changeColor(os.ui.icons.white_, color || os.ui.icons.white_);
  id = os.ui.icons.hashIconId(id);
  var matrix = angular.element('#matrix_' + id);
  matrix.attr('values', values.join(' '));

  var hexColor = os.color.toHexString(color || os.ui.icons.white_);
  angular.element('i.fa.layer-icon-' + id).css('color', hexColor);
};


/**
 * @param {string} id
 * @param {Array<number>|string} color
 *
 * @deprecated Please use `os.ui.icons.adjustIconSet` instead.
 */
os.ui.adjustIconSet = os.ui.icons.adjustIconSet;
