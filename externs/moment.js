/**
 * @fileoverview Externs for MomentJS.
 * @see http://ssdn-belford.stwan.bits/docs/momentjs/momentjs.com/docs/index.html
 * @externs
 */



/**
 * @constructor
 * @param {(Date|Object|Array|string|number)=} opt_date
 * @param {(Array.<string>|string)=} opt_format
 * @param {boolean=} opt_strict
 * @return {!moment}
 */
function moment(opt_date, opt_format, opt_strict) {}


/**
 * @param {(Date|Object|Array|string|number)=} opt_date
 * @param {(Array.<string>|string)=} opt_format
 * @param {boolean=} opt_strict
 * @return {!moment}
 */
moment.utc = function(opt_date, opt_format, opt_strict) {};


/**
 * @type {string}
 */
moment.prototype._f;


/**
 * @param {(moment|Date|Object|Array|string|number)=} opt_date
 * @param {boolean=} opt_sentence
 * @return {string}
 */
moment.prototype.from = function(opt_date, opt_sentence) {};


/**
 * @return {string}
 */
moment.prototype.fromNow = function() {};


/**
 * @param {(moment|Date|Object|Array|string|number)} date
 * @param {string} type
 * @return {boolean}
 */
moment.prototype.isSame = function(date, type) {};


/**
 * @param {(moment|Date|Object|Array|string|number)} date
 * @param {string} type
 * @return {boolean}
 */
moment.prototype.isBefore = function(date, type) {};


/**
 * @param {(moment|Date|Object|Array|string|number)} date
 * @param {string} type
 * @return {boolean}
 */
moment.prototype.isAfter = function(date, type) {};


/**
 * @param {*} obj
 * @return {boolean}
 */
moment.prototype.isMoment = function(obj) {};


/**
 * @return {boolean}
 */
moment.prototype.isValid = function() {};


/**
 * @return {Array.<number>}
 */
moment.prototype.toArray = function() {};


/**
 * @return {Date}
 */
moment.prototype.toDate = function() {};


/**
 * @return {string}
 */
moment.prototype.toISOString = function() {};


/**
 * @return {Object}
 * @override
 */
moment.prototype.toJSON = function() {};


/**
 * The floored number of seconds since the Unix Epoch.
 * @return {number}
 */
moment.prototype.unix = function() {};


/**
 * @return {moment}
 */
moment.prototype.utc = function() {};


/**
 * The number of milliseconds since the Unix Epoch.
 * @return {number}
 * @override
 */
moment.prototype.valueOf = function() {};


/**
 * Formats the date
 * @param {string=} opt_format The format
 */
moment.prototype.format = function(opt_format) {};


/**
 * Gets or sets the milliseconds
 * @param {number=} opt_millis
 * @return {number} The milliseconds
 */
moment.prototype.millisecond = function(opt_millis) {};


/**
 * Gets or sets the milliseconds
 * @param {number=} opt_millis
 * @return {number} The milliseconds
 */
moment.prototype.milliseconds = function(opt_millis) {};


/**
 * Gets or sets the seconds
 * @param {number=} opt_seconds
 * @return {number} The seconds
 */
moment.prototype.second = function(opt_seconds) {};


/**
 * Gets or sets the seconds
 * @param {number=} opt_seconds
 * @return {number} The seconds
 */
moment.prototype.seconds = function(opt_seconds) {};


/**
 * Gets or sets the minutes
 * @param {number=} opt_minutes
 * @return {number} The minutes
 */
moment.prototype.minute = function(opt_minutes) {};


/**
 * Gets or sets the minutes
 * @param {number=} opt_minutes
 * @return {number} The minutes
 */
moment.prototype.minutes = function(opt_minutes) {};


/**
 * Gets or sets the hours
 * @param {number=} opt_hours
 * @return {number} The hours
 */
moment.prototype.hour = function(opt_hours) {};


/**
 * Gets or sets the hours
 * @param {number=} opt_hours
 * @return {number} The hours
 */
moment.prototype.hours = function(opt_hours) {};


/**
 * Gets or sets the dates
 * @param {number=} opt_dates
 * @return {number} The dates
 */
moment.prototype.date = function(opt_dates) {};


/**
 * Gets or sets the dates
 * @param {number=} opt_dates
 * @return {number} The dates
 */
moment.prototype.dates = function(opt_dates) {};


/**
 * Gets or sets the day of week
 * @param {number=} opt_days
 * @return {number} The day of week
 */
moment.prototype.day = function(opt_days) {};


/**
 * Gets or sets the day of week
 * @param {number=} opt_days
 * @return {number} The day of week
 */
moment.prototype.days = function(opt_days) {};


/**
 * Gets or sets the weekday
 * @param {string=} opt_weekdays
 * @return {string} The weekday
 */
moment.prototype.weekday = function(opt_weekdays) {};


/**
 * Gets or sets the weekday
 * @param {string=} opt_weekdays
 * @return {string} The weekday
 */
moment.prototype.weekdays = function(opt_weekdays) {};


/**
 * Gets or sets the ISO weekday
 * @param {number=} opt_weekdays
 * @return {number} The ISO weekday
 */
moment.prototype.isoWeekday = function(opt_weekdays) {};


/**
 * Gets or sets the ISO weekday
 * @param {string=} opt_weekdays
 * @return {string} The ISO weekday
 */
moment.prototype.isoWeekdays = function(opt_weekdays) {};


/**
 * Gets the day of the year
 * @param {number=} opt_day
 * @return {number} The day of year
 */
moment.prototype.dayOfYear = function(opt_day) {};


/**
 * Gets or sets the week
 * @param {number=} opt_weeks
 * @return {number} The week
 */
moment.prototype.week = function(opt_weeks) {};


/**
 * Gets or sets the week
 * @param {number=} opt_weeks
 * @return {number} The week
 */
moment.prototype.weeks = function(opt_weeks) {};


/**
 * Gets or sets the ISO week
 * @param {number=} opt_weeks
 * @return {number} The weeks
 */
moment.prototype.isoWeek = function(opt_weeks) {};


/**
 * Gets or sets the ISO week
 * @param {number=} opt_weeks
 * @return {number} The weeks
 */
moment.prototype.isoWeeks = function(opt_weeks) {};


/**
 * Gets or sets the month
 * @param {number=} opt_months
 * @return {number} The month
 */
moment.prototype.month = function(opt_months) {};


/**
 * Gets or sets the month
 * @param {number=} opt_months
 * @return {number} The month
 */
moment.prototype.months = function(opt_months) {};


/**
 * Gets or sets the quarter
 * @param {number=} opt_quarter
 * @return {number} The quarter
 */
moment.prototype.quarter = function(opt_quarter) {};


/**
 * Gets or sets the year
 * @param {number=} opt_years
 * @return {number} The year
 */
moment.prototype.year = function(opt_years) {};


/**
 * Gets or sets the year
 * @param {number=} opt_years
 * @return {number} The year
 */
moment.prototype.years = function(opt_years) {};


/**
 * Gets or sets the week year
 * @param {number=} opt_weekyear
 * @return {number} The week year
 */
moment.prototype.weekYear = function(opt_weekyear) {};


/**
 * Gets or sets the ISO week year
 * @param {number=} opt_weekyear
 * @return {number} The weekyear
 */
moment.prototype.isoWeekYear = function(opt_weekyear) {};


/**
 * Gets the number of weeks in the year
 * @return {number} The number of weeks in the year
 */
moment.prototype.weeksInYear = function() {};


/**
 * @return {number} The number of ISO weeks in the year
 */
moment.prototype.isoWeeksInYear = function() {};


/**
 * Gets values
 * @param {string} part
 * @return {number} The value
 */
moment.prototype.get = function(part) {};


/**
 * Sets values
 * @param {string} part
 * @param {number} value
 */
moment.prototype.set = function(part, value) {};


/**
 * Clone
 * @return {!moment}
 */
moment.prototype.clone = function() {};


/**
 * Add a time interval
 * @param {number} value
 * @param {string} period
 */
moment.prototype.add = function(value, period) {};


/**
 * subtract a time interval
 * @param {number} value
 * @param {string} period
 */
moment.prototype.subtract = function(value, period) {};



/**
 * @constructor
 * @param {(number|string|Object)=} opt_value
 * @param {string=} opt_units
 * @return {!moment.duration}
 */
moment.duration = function(opt_value, opt_units) {};


/**
 * @param {boolean=} opt_suffix
 * @return {string}
 */
moment.duration.prototype.humanize = function(opt_suffix) {};


/**
 * @return {number}
 */
moment.duration.prototype.asMilliseconds = function() {};

/**
 * @return {number}
 */
moment.duration.prototype.asSeconds = function() {};

/**
 * @return {number}
 */
moment.duration.prototype.asMinutes = function() {};

/**
 * @return {number}
 */
moment.duration.prototype.asHours = function() {};

/**
 * @return {number}
 */
moment.duration.prototype.asDays = function() {};


/**
 * @return {number}
 */
moment.duration.prototype.weeks = function() {};


/**
 * @return {number}
 */
moment.duration.prototype.days = function() {};


/**
 * @return {number}
 */
moment.duration.prototype.hours = function() {};


/**
 * @return {number}
 */
moment.duration.prototype.minutes = function() {};


/**
 * @return {number}
 */
moment.duration.prototype.seconds = function() {};


/**
 * @return {string}
 */
moment.duration.prototype.toISOString = function() {};

/**
 * Get the difference between times.
 * @param {!moment|string|number|Date|Array} value
 * @param {string=} opt_units
 * @param {boolean=} opt_round
 * @return {number}
 */
moment.prototype.diff = function(value, opt_units, opt_round) {};
