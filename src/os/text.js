goog.module('os.Text');

/**
 * Simple object to handle logical grouping of displayed text in Opensphere
 */
class Text {
  /**
   * Constructor for a Text
   * @param {string=} id a key, CSS class, etc to help find the element
   * @param {string=} label the visible string
   * @param {string=} tooltip the string shown on hover
   * @param {string=} description a long explanation of the button or feature
   */
  constructor(id = '0', label = '', tooltip = '', description = '') {
    this.id = id;
    this.label = label;
    this.tooltip = tooltip;
    this.description = description;
  }
}

exports = Text;
