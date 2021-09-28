goog.declareModuleId('os.time.xf');

const {default: ITime} = goog.requireType('os.time.ITime');


/**
 * Definition for a function that takes an object and returns the time value for that object.
 * @typedef {function(Object):?ITime}
 */
export let GetTimeFn;
