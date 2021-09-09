goog.module('os.time.xf');

const ITime = goog.requireType('os.time.ITime');


/**
 * Definition for a function that takes an object and returns the time value for that object.
 * @typedef {function(Object):?ITime}
 */
let GetTimeFn;

exports = {
  GetTimeFn
};
