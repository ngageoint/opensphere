/**
 * How often the popup appears
 * @enum {string}
 */
export const ReminderFrequency = {
  MONTHLY: 'MONTHLY',
  WEEKLY: 'WEEKLY',
  DAILY: 'DAILY'
};

/**
 * Represents a siteMessage.reminder config object
 *
 */
export default class ReminderSchedule {
  /**
   * Constructor.
   * @param {!Date} startDate - when this reminder schedule goes into effect
   * @param {?ReminderFrequency} frequency - the interval for this reminder
   * @param {?number} day - (optional) The specific day to show the reminder
   */
  constructor(startDate, frequency = null, day = null) {
    /**
     * @type {!Date}
     * @private
     */
    this.startDate_ = startDate;

    /**
     * @type {?ReminderFrequency}
     * @private
     */
    this.frequency_ = frequency;

    /**
     * @type {?number}
     * @private
     */
    this.day_ = null;
    const parsedDay = parseInt(day, 10);
    if (!isNaN(parsedDay)) {
      this.day_ = parsedDay;
    }
  }

  /**
   * Parse a site message from data
   * @param {*} data - the data to parse
   * @return {?ReminderSchedule}
   * @export
   */
  static parse(data) {
    if (!data || typeof data != 'object' || !data['startDate']) {
      return null;
    }

    const startDate = new Date(data['startDate']);
    if (isNaN(startDate)) {
      return null;
    }

    let frequency;
    if (data['frequency'] && typeof data['frequency'] == 'string') {
      frequency = data['frequency'].toUpperCase();
      // Property names optimized out -- ReminderFrequency['val'] doesn't work
      if (!Object.values(ReminderFrequency).includes(data['frequency'].trim().toUpperCase())) {
        return null;
      }
    }

    let day;
    if (data['day']) {
      day = parseInt(data['day'], 10);
      if (isNaN(day)) {
        return null;
      }
    }

    return new ReminderSchedule(startDate, frequency, day);
  }

  /**
   * Return the startDate
   * @return {!Date}
   * @export
   */
  getStartDate() {
    return this.startDate_;
  }

  /**
   * Return the frequency
   * @return {?ReminderFrequency}
   * @export
   */
  getFrequency() {
    return this.frequency_;
  }

  /**
   * Return the specific day to show the reminder
   * @return {?number}
   * @export
   */
  getDay() {
    return this.day_;
  }
}

