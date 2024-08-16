import ReminderSchedule from './reminderschedule.js';

/**
 * Represents the siteMessage config value
 *
 */
export default class SiteMessage {
  /**
   * Constructor.
   * @param {string} id - unique id for a given site message
   * @param {string} title - the title of the message
   * @param {string} text - the body of the message
   * @param {Array<ReminderSchedule>} reminders - (optional) the reminder schedule for the message
   */
  constructor(id, title, text, reminders = null) {
    /**
     * @type {!string}
     * @private
     */
    this.id_ = id;

    /**
     * @type {!string}
     * @private
     */
    this.title_ = title;

    /**
     * @type {!string}
     * @private
     */
    this.text_ = text;

    /**
     * @type {?Array<ReminderSchedule>}
     * @private
     */
    this.reminders_ = reminders;
  }

  /**
   * Parse a site message from data
   * @param {*} data - the data to parse
   * @return {?SiteMessage}
   * @export
   */
  static parse(data) {
    if (data && typeof data == 'object' && data['id'] && data['title'] && data['text']) {
      let reminders = null;
      if (data['reminders'] && Array.isArray(data['reminders'])) {
        const parsedReminders = data['reminders']
            .map(ReminderSchedule.parse)
            .filter((reminder) => reminder != null);
        reminders = parsedReminders.length > 0 ? parsedReminders : null;
      }
      return new SiteMessage(data['id'], data['title'], data['text'], reminders);
    }
    return null;
  }

  /**
   * Return the id
   * @return {!string}
   * @export
   */
  getId() {
    return this.id_;
  }

  /**
   * Return the title
   * @return {!string}
   * @export
   */
  getTitle() {
    return this.title_;
  }

  /**
   * Return the text
   * @return {!string}
   * @export
   */
  getText() {
    return this.text_;
  }

  /**
   * Return the reminder schedule
   * @return {Array<ReminderSchedule>}
   * @export
   */
  getReminders() {
    return this.reminders_;
  }
}
