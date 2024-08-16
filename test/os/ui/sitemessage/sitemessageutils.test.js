goog.require('os.config.Settings');
goog.require('os.ui.SiteMessage.Utils');

describe('os.ui.SiteMessage.Utils', function() {
  const siteMessageUtils = goog.module.get('os.ui.SiteMessage.Utils');
  const {default: Settings} = goog.module.get('os.config.Settings');
  const testMessage = {
    id: 'message-1',
    title: 'test title',
    text: 'test text',
    reminders: [
      {startDate: '2022-04-05 00:00', frequency: 'MONTHLY', day: 1}, // first of month
      {startDate: '2022-05-05 00:00', frequency: 'WEEKLY', day: 2}, // tuesday
      {startDate: '2022-06-23 00:00', frequency: 'DAILY'}
    ]
  };

  beforeEach(function() {
    Settings.getInstance().delete('siteMessage');
  });

  describe('when a site message is declared in the settings', function() {
    beforeEach(function() {
      Settings.getInstance().set('siteMessage', testMessage);
    });

    it('should return the site message', function() {
      const message = siteMessageUtils.getSiteMessage();
      expect(message).not.toBeNull();
      expect(message.getId()).toEqual(testMessage.id);
      expect(message.getTitle()).toEqual(testMessage.title);
      expect(message.getText()).toEqual(testMessage.text);
      var actualReminders = message.getReminders();
      expect(actualReminders).not.toBeNull();
      for (var i = 0; i < actualReminders.length; i++) {
        expect(actualReminders[i].getStartDate()).toEqual(new Date(testMessage.reminders[i].startDate));
        expect(actualReminders[i].getFrequency()).toEqual(testMessage.reminders[i].frequency);
        expect(actualReminders[i].getDay()).toEqual(testMessage.reminders[i].day);
      }
    });

    it('should return the first known reminder date', function() {
      const monthlyReminder = siteMessageUtils.getNextReminderDate(new Date('2022-03-15 00:00'));
      expect(monthlyReminder).toEqual(new Date('2022-04-05 00:00'));
    });

    it('should return the next monthly reminder date', function() {
      const monthlyReminder = siteMessageUtils.getNextReminderDate(new Date('2022-04-15 00:00'));
      expect(monthlyReminder).toEqual(new Date('2022-05-01 00:00'));
    });

    it('should return the next weekly reminder date', function() {
      const weeklyReminder = siteMessageUtils.getNextReminderDate(new Date('2022-05-15 00:00'));
      expect(weeklyReminder).toEqual(new Date('2022-05-17 00:00'));
    });

    it('should return the next daily reminder date', function() {
      const dailyReminder = siteMessageUtils.getNextReminderDate(new Date('2022-07-15 00:00'));
      expect(dailyReminder).toEqual(new Date('2022-07-16 00:00'));
    });

    it('should return the start of the next reminder period if it comes before the next reminder', function() {
      const monthlyReminder = siteMessageUtils.getNextReminderDate(new Date('2022-05-02 00:00'));
      expect(monthlyReminder).toEqual(new Date('2022-05-05 00:00')); // start of weekly reminder period
    });

    it('should return correct dates for months with fewer days', function() {
      const testMessage2 = {
        id: 'message-2',
        title: 'test title',
        text: 'test text',
        reminders: [
          {startDate: '2022-01-01 00:00', frequency: 'MONTHLY', day: 31} // end of month
        ]
      };
      Settings.getInstance().set('siteMessage', testMessage2);
      const monthlyReminder = siteMessageUtils.getNextReminderDate(new Date('2022-01-31 12:00'));
      expect(monthlyReminder).toEqual(new Date('2022-02-28 00:00'));
    });
  });

  describe('when a site message is not defined', function() {
    it('should not return a site message', function() {
      const message = siteMessageUtils.getSiteMessage();
      expect(message).toBeNull();
    });

    it('should not return a reminder date', function() {
      const monthlyReminder = siteMessageUtils.getNextReminderDate(new Date('2022-03-15 00:00'));
      expect(monthlyReminder).toEqual(null);
    });
  });
});
