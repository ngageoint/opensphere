goog.module('os.search.SubSearchUtils');

const SearchFacetDepartment = goog.requireType('os.search.SearchFacetDepartment');


/**
 * Sub Search Utilities
 */
class SubSearchUtils {
  /**
   * Remove a list and sub-lists from a list of lists
   * @param {Array<!Array<string>>} lists
   * @param {!Array<string>} list
   * @return {number}
   */
  static removeList(lists, list) {
    const indexes = [];
    for (let i = 0, iLen = lists.length; i < iLen; i++) {
      for (let j = 0, jLen = list.length; j < jLen; j++) {
        if (lists[i][j] !== list[j]) {
          break;
        }
        if (j + 1 === jLen) {
          indexes.unshift(i);
        }
      }
    }
    indexes.forEach((idx) => lists.splice(idx, 1));
    return indexes.length;
  }

  /**
   * Check if lists are the same
   * @param {!Array<!Array<string>>} a
   * @param {!Array<!Array<string>>} b
   * @return {boolean}
   */
  static sameList(a, b) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0, iLen = a.length; i < iLen; i++) {
      if (!SubSearchUtils.sameList_(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if list b is a subset of a
   * @param {!Array<!Array<string>>} a
   * @param {!Array<!Array<string>>} b
   * @return {boolean}
   */
  static subsetOfList(a, b) {
    if (a.length < b.length) {
      return false;
    }
    for (let i = 0, bLen = b.length; i < bLen; i++) {
      let continueOuter = false;
      const bList = b[i];
      for (let j = 0, aLen = a.length; j < aLen; j++) {
        let continueInner = false;
        const aList = a[j];
        if (bList.length !== aList.length) {
          continue;
        }
        for (let k = 0, aListLen = aList.length; k < aListLen; k++) {
          if (bList[k] !== aList[k]) {
            continueInner = true;
            break;
          }
        }
        if (!continueInner) {
          continueOuter = true; // found it
          break;
        }
      }
      if (!continueOuter) {
        return false; // item not found
      }
    }
    return true; // found all of them
  }

  /**
   * Check if lists are the same
   * @param {!Array<string>} a
   * @param {!Array<string>} b
   * @return {boolean}
   * @private
   */
  static sameList_(a, b) {
    const a_ = a.slice().sort();
    const b_ = b.slice().sort();
    if (a_.length !== b_.length) {
      return false;
    }
    for (let i = 0, iLen = a_.length; i < iLen; i++) {
      if (a_[i].length !== b_[i].length) {
        return false;
      }
      for (let j = 0, jLen = a_[i].length; j < jLen; j++) {
        if (a_[i][j] !== b_[i][j]) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * See if a department is disabled by default
   * @param {!Array<!Array<string>>} defaultDisabledSubSearchIndexes
   * @param {!Array<string>} department
   * @return {boolean}
   */
  static isDefaultDisabled(defaultDisabledSubSearchIndexes, department) {
    for (let i = 0, iLen = defaultDisabledSubSearchIndexes.length; i < iLen; i++) {
      const index = defaultDisabledSubSearchIndexes[i];
      if (department.length < index.length) {
        break;
      }
      for (let j = 0, jLen = index.length; j < jLen; j++) {
        if (index[j] !== department[j]) {
          break;
        }
        if (j + 1 === jLen) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * @param {SearchFacetDepartment} searchFacetDepartment
   * @param {Array<!Array<string>>} registeredSubSearches
   * @return {boolean}
   */
  static isSubSearch(searchFacetDepartment, registeredSubSearches) {
    const subSearchIndexes = registeredSubSearches;
    for (let i = 0, iLen = subSearchIndexes.length; i < iLen; i++) {
      for (let j = 0, jLen = searchFacetDepartment.path.length; j < jLen; j++) {
        if (searchFacetDepartment.path[j] !== subSearchIndexes[i][j]) {
          break;
        }
        if (j + 1 === jLen) {
          return true;
        }
      }
    }
    return false;
  }
}

exports = SubSearchUtils;
