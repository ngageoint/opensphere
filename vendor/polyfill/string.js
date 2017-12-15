if (!String.prototype.startsWith) {
  /**
   * Polyfil startswith for IE
   *
   * From MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
   * Copyright Jun 27, 2017 ripter
   *
   * @param {String} searchString
   * @param {number} position
   * @return {boolean}
   */
  String.prototype.startsWith = function(searchString, position) {
    return this.substr(position || 0, searchString.length) === searchString;
  };
}
