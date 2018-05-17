goog.provide('os.ui.location.ddmFilter');
goog.provide('os.ui.location.ddmLatFilter');
goog.provide('os.ui.location.ddmLonFilter');
goog.provide('os.ui.location.degFilter');
goog.provide('os.ui.location.degLatFilter');
goog.provide('os.ui.location.degLonFilter');
goog.provide('os.ui.location.dmsFilter');
goog.provide('os.ui.location.dmsLatFilter');
goog.provide('os.ui.location.dmsLonFilter');
goog.provide('os.ui.location.mgrsFilter');
goog.require('os.geo');
goog.require('os.ui.Module');



/**
 * Take decimal degress
 * @constructor
 * @return {angular.Filter}
 * @ngInject
 */
os.ui.location.degFilter = function() {
  return /** @type {angular.Filter} */ (os.ui.location.degFilter.Filter);
};



/**
 * @constructor
 * @param {!number} latdeg
 * @param {!number} londeg
 * @return {string}
 */
os.ui.location.degFilter.Filter = function(latdeg, londeg) {
  if (latdeg && londeg) {
    return latdeg.toFixed(5) + '°  ' + londeg.toFixed(5) + '°';
  }
  return '';
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.filter('deg', [os.ui.location.degFilter]);



/**
 * Take decimal degress format
 * @constructor
 * @return {angular.Filter}
 * @ngInject
 */
os.ui.location.degLatFilter = function() {
  return /** @type {angular.Filter} */ (os.ui.location.degLatFilter.Filter);
};



/**
 * @constructor
 * @param {!number} latdeg
 * @return {string}
 */
os.ui.location.degLatFilter.Filter = function(latdeg) {
  return latdeg + '°';
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.filter('deglat', [os.ui.location.degLatFilter]);



/**
 * Take decimal degress format
 * @constructor
 * @return {angular.Filter}
 * @ngInject
 */
os.ui.location.degLonFilter = function() {
  return /** @type {angular.Filter} */ (os.ui.location.degLonFilter.Filter);
};



/**
 * @constructor
 * @param {!number} londeg
 * @return {string}
 */
os.ui.location.degLonFilter.Filter = function(londeg) {
  return londeg + '°';
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.filter('deglon', [os.ui.location.degLonFilter]);



/**
 * Take decimal degress format and return ddm Degrees Decimal Minutes
 * @constructor
 * @return {angular.Filter}
 * @ngInject
 */
os.ui.location.ddmFilter = function() {
  return /** @type {angular.Filter} */ (os.ui.location.ddmFilter.Filter);
};



/**
 * @constructor
 * @param {!number} latdeg
 * @param {!number} londeg
 * @return {string}
 */
os.ui.location.ddmFilter.Filter = function(latdeg, londeg) {
  return os.geo.toDegreesDecimalMinutes(latdeg, false, false) + ' ' +
   os.geo.toDegreesDecimalMinutes(londeg, true, false);
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.filter('ddm', [os.ui.location.ddmFilter]);



/**
 * Take decimal degress format and return ddm Degrees Decimal Minutes
 * @constructor
 * @return {angular.Filter}
 * @ngInject
 */
os.ui.location.ddmLatFilter = function() {
  return /** @type {angular.Filter} */ (os.ui.location.ddmLatFilter.Filter);
};



/**
 * @constructor
 * @param {!number} latdeg
 * @return {string}
 */
os.ui.location.ddmLatFilter.Filter = function(latdeg) {
  return os.geo.toDegreesDecimalMinutes(latdeg, false, false);
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.filter('ddmlat', [os.ui.location.ddmLatFilter]);



/**
 * Take decimal degress format return ddm Degrees Decimal Minutes
 * @constructor
 * @return {angular.Filter}
 * @ngInject
 */
os.ui.location.ddmLonFilter = function() {
  return /** @type {angular.Filter} */ (os.ui.location.ddmLonFilter.Filter);
};



/**
 * @constructor
 * @param {!number} londeg
 * @return {string}
 */
os.ui.location.ddmLonFilter.Filter = function(londeg) {
  return os.geo.toDegreesDecimalMinutes(londeg, true, false);
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.filter('ddmlon', [os.ui.location.ddmLonFilter]);



/**
 * Take decimal degress format and return dms Sexagesimal
 * @constructor
 * @return {angular.Filter}
 * @ngInject
 */
os.ui.location.dmsFilter = function() {
  return /** @type {angular.Filter} */ (os.ui.location.dmsFilter.Filter);
};



/**
 * @constructor
 * @param {!number} latdeg
 * @param {!number} londeg
 * @return {string}
 */
os.ui.location.dmsFilter.Filter = function(latdeg, londeg) {
  return os.geo.toSexagesimal(latdeg, false, false) + ' ' + os.geo.toSexagesimal(londeg, true, false);
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.filter('dms', [os.ui.location.dmsFilter]);



/**
 * Take decimal degress format and return dms Sexagesimal
 * @constructor
 * @return {angular.Filter}
 * @ngInject
 */
os.ui.location.dmsLatFilter = function() {
  return /** @type {angular.Filter} */ (os.ui.location.dmsLatFilter.Filter);
};



/**
 * @constructor
 * @param {!number} latdeg
 * @return {string}
 */
os.ui.location.dmsLatFilter.Filter = function(latdeg) {
  return os.geo.toSexagesimal(latdeg, false, false);
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.filter('dmslat', [os.ui.location.dmsLatFilter]);



/**
 * Take decimal degress format and return Sexagesimal
 * @constructor
 * @return {angular.Filter}
 * @ngInject
 */
os.ui.location.dmsLonFilter = function() {
  return /** @type {angular.Filter} */ (os.ui.location.dmsLonFilter.Filter);
};



/**
 * @constructor
 * @param {!number} londeg
 * @return {string}
 */
os.ui.location.dmsLonFilter.Filter = function(londeg) {
  return os.geo.toSexagesimal(londeg, true, false);
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.filter('dmslon', [os.ui.location.dmsLonFilter]);



/**
 * Take decimal degress format and return mgrs
 * @constructor
 * @return {angular.Filter}
 * @ngInject
 */
os.ui.location.mgrsFilter = function() {
  return /** @type {angular.Filter} */ (os.ui.location.mgrsFilter.Filter);
};



/**
 * @constructor
 * @param {!number} latdeg
 * @param {!number} londeg
 * @return {string}
 */
os.ui.location.mgrsFilter.Filter = function(latdeg, londeg) {
  if (londeg && latdeg) {
    return osasm.toMGRS([londeg, latdeg]);
  }
  return '';
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.filter('mgrs', [os.ui.location.mgrsFilter]);
