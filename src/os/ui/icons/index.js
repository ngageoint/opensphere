goog.declareModuleId('os.ui.icons');

import {changeColor, toHexString, toRgbArray} from '../../color.js';

const {encodeString} = goog.require('goog.crypt.hash32');


/**
 * @type {!Array<number>}
 */
const white = [0xff, 0xff, 0xff];

/**
 * @type {number}
 */
export const ICON_WIDTH = 16;

/**
 * @param {string} id The layer id
 * @param {Array<string>} svgIcons SVG icons
 * @param {Array<string>} faIcons Font Awesome icons
 * @param {Array<number>|string} color The icon color
 * @return {string}
 */
export const createIconSet = function(id, svgIcons, faIcons, color) {
  var html = '';
  id = hashIconId(id);

  if (svgIcons && svgIcons.length > 0) {
    var arrColor = typeof color === 'string' ? toRgbArray(color) : color;
    var values = changeColor(white, arrColor || white);
    var width = ICON_WIDTH * svgIcons.length;
    var filter = 'filter_';
    var matrix = 'matrix_';
    html += '<svg width="' + width + 'px" height="16px" class="align-middle" ' +
        'xmlns="http://www.w3.org/2000/svg" filter="url(#' + filter + id + ')">';

    html += svgIcons.join('');
    var re = /x="(\d+)"/g;

    xReplaceI = 0;
    html = html.replace(re, xReplace);
    html += '<filter id="' + filter + id + '">';
    html += '<feColorMatrix id="' + matrix + id + '" values="' + values.join(' ') + '"/>';
    html += '</filter></svg>';
  }

  if (faIcons && faIcons.length > 0) {
    var hexColor = toHexString(color);
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
 *
 * @param {string} id
 * @return {string}
 */
export const hashIconId = function(id) {
  return String(encodeString(id));
};

/**
 * @type {number}
 */
let xReplaceI = 0;

/**
 * @param {string} match
 * @param {string} p1
 * @param {number} offset
 * @param {string} whole
 * @return {string}
 */
const xReplace = function(match, p1, offset, whole) {
  var x = xReplaceI * ICON_WIDTH;
  xReplaceI++;
  return match.replace(p1, x.toString());
};

/**
 * @param {string} id
 * @param {Array<number>|string} color
 */
export const adjustIconSet = function(id, color) {
  if (typeof color === 'string') {
    color = toRgbArray(color);
  }

  var values = changeColor(white, color || white);
  id = hashIconId(id);
  var matrix = angular.element('#matrix_' + id);
  matrix.attr('values', values.join(' '));

  var hexColor = toHexString(color || white);
  angular.element('i.fa.layer-icon-' + id).css('color', hexColor);
};
