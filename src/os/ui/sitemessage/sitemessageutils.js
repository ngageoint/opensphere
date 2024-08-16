goog.declareModuleId('os.ui.SiteMessage.Utils');

import Settings from '../../config/settings.js';
import {ReminderFrequency} from './reminderschedule.js';
import SiteMessage from './sitemessage.js';

/**
 * Retrieve site message from settings
 *
 * @return {?SiteMessage}
 */
export const getSiteMessage = () => {
  const siteMessage = Settings.getInstance().get('siteMessage');
  return SiteMessage.parse(siteMessage);
};

/**
 * Get the next date to show the site message
 * @param {Date} currentDate
 * @return {?Date}
 */
export const getNextReminderDate = (currentDate) => {
  if (isNaN(currentDate)) {
    return null;
  }

  const siteMessage = getSiteMessage();
  if (siteMessage == null) {
    return null;
  }

  let reminderSchedules = siteMessage.getReminders();
  if (reminderSchedules == null || reminderSchedules.length == 0) {
    return null;
  }

  reminderSchedules = reminderSchedules
      .concat()
      .sort((a, b) => a.getStartDate() - b.getStartDate());

  const currentIndex = reminderSchedules
      .filter((rem) => rem.getStartDate() <= currentDate)
      .length - 1;

  if (currentIndex == -1) {
    let firstReminder = moment(reminderSchedules[0].getStartDate().toISOString());
    firstReminder = startOfDay(firstReminder);
    return firstReminder.toDate();
  }

  const currentSchedule = reminderSchedules[currentIndex];
  let nextReminder = moment(currentDate.toISOString());
  switch (currentSchedule.getFrequency()) {
    case ReminderFrequency.MONTHLY: {
      let dayOfMonth = currentSchedule.getDay();
      if (dayOfMonth == null || isNaN(dayOfMonth)) {
        nextReminder.add(1, 'month');
        break;
      }
      dayOfMonth = Math.max(dayOfMonth, 1);
      dayOfMonth = Math.min(dayOfMonth, nextReminder.daysInMonth());
      if (dayOfMonth <= currentDate.getDate()) {
        nextReminder.add(1, 'month');
        dayOfMonth = Math.min(dayOfMonth, nextReminder.daysInMonth());
      }
      nextReminder.set('date', dayOfMonth);
      break;
    }
    case ReminderFrequency.WEEKLY: {
      let dayOfWeek = currentSchedule.getDay();
      if (dayOfWeek == null || isNaN(dayOfWeek)) {
        nextReminder.add(1, 'week');
        break;
      }
      dayOfWeek = Math.max(dayOfWeek, 0);
      dayOfWeek = Math.min(dayOfWeek, 6);
      if (dayOfWeek <= currentDate.getDay()) {
        nextReminder.add(1, 'week');
      }
      nextReminder.set('day', dayOfWeek);
      break;
    }
    case ReminderFrequency.DAILY: {
      nextReminder.add(1, 'day');
      break;
    }
    default: {
      nextReminder.add(1, 'day');
      break;
    }
  }

  if (currentIndex < reminderSchedules.length - 1) {
    const nextStartDate = moment(reminderSchedules[currentIndex + 1]
        .getStartDate()
        .toISOString());
    nextReminder = nextStartDate.isBefore(nextReminder) ? nextStartDate : nextReminder;
  }
  nextReminder = startOfDay(nextReminder);
  return nextReminder.toDate();
};

/**
 * Sets time to 00:00.
 * Workaround for closure compiler not recognizing moment().startOf('day')
 * @param {moment} date
 * @return {moment}
 */
const startOfDay = (date) => {
  const datePart = date.format('YYYY-MM-DD');
  return moment(datePart + ' 00:00');
};
