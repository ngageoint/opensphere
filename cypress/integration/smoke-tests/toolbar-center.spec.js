/// <reference types="Cypress" />
var os = require('../../support/selectors.js');

describe('Toolbar center', function() {
  before('Login', function() {
    cy.login();
  });

  it('Previous day', function() {
    // Setup
    // none

    // Test
    cy.get(os.Toolbar.Date.FIELD)
        .should('have.value', Cypress.moment().format('YYYY[-]MM[-]DD'));
    cy.get(os.Toolbar.PREVIOUS_DAY_BUTTON).click();
    cy.get(os.Toolbar.Date.FIELD)
        .should('have.value', Cypress.moment().subtract(1, 'days').format('YYYY[-]MM[-]DD'));

    // Clean up
    cy.wait(500); // TODO: Remove wait - https://github.com/ngageoint/opensphere/issues/385
    cy.get(os.Toolbar.NEXT_DAY_BUTTON).click();
    cy.get(os.Toolbar.Date.FIELD)
        .should('have.value', Cypress.moment().format('YYYY[-]MM[-]DD'));
  });

  it('Date', function() {
    // Setup
    cy.get(os.Toolbar.Date.Calendar.PANEL).should('not.be.visible');

    // Test
    cy.get(os.Toolbar.Date.FIELD).click();
    cy.get(os.Toolbar.Date.Calendar.PANEL).should('be.visible');
    cy.get(os.Toolbar.Date.Calendar.MONTH).should('contain', Cypress.moment().format('MMM'));
    cy.get(os.Toolbar.Date.Calendar.YEAR).should('contain', Cypress.moment().format('YYYY'));
    cy.get(os.Toolbar.Date.Calendar.CURRENT_DAY).should('contain', Cypress.moment().format('D'));

    // Clean up
    cy.get(os.Toolbar.Date.Calendar.CLOSE_BUTTON).click();
    cy.get(os.Toolbar.Date.Calendar.PANEL).should('not.be.visible');
  });

  it('Next day', function() {
    // Setup
    // none

    // Test
    cy.get(os.Toolbar.Date.FIELD)
        .should('have.value', Cypress.moment().format('YYYY[-]MM[-]DD'));
    cy.get(os.Toolbar.NEXT_DAY_BUTTON).click();
    cy.get(os.Toolbar.Date.FIELD)
        .should('have.value', Cypress.moment().add(1, 'days').format('YYYY[-]MM[-]DD'));

    // Clean up
    cy.wait(500); // TODO: Remove wait - https://github.com/ngageoint/opensphere/issues/385
    cy.get(os.Toolbar.PREVIOUS_DAY_BUTTON).click();
    cy.get(os.Toolbar.Date.FIELD)
        .should('have.value', Cypress.moment().format('YYYY[-]MM[-]DD'));
  });

  it('Duration', function() {
    // Setup
    // none

    // Test
    cy.get(os.Toolbar.DURATION_SELECT).should('have.value', 'day');
    cy.get(os.Toolbar.DURATION_SELECT).should('contain', 'day');
    cy.get(os.Toolbar.DURATION_SELECT).should('contain', 'week');
    cy.get(os.Toolbar.DURATION_SELECT).should('contain', 'month');
    cy.get(os.Toolbar.DURATION_SELECT).should('contain', 'custom');
    cy.get(os.Toolbar.DURATION_SELECT).select('month');
    cy.get(os.Toolbar.DURATION_SELECT).should('have.value', 'month');

    // Clean up
    cy.get(os.Toolbar.DURATION_SELECT).select('day');
    cy.get(os.Toolbar.DURATION_SELECT).should('have.value', 'day');
  });

  it('Time filter', function() {
    // Setup
    cy.get(os.Toolbar.timeFilter.BUTTON)
        .should('not.have.class', os.Toolbar.timeFilter.BUTTON_IS_ACTIVE);
    cy.get(os.Toolbar.timeFilter.PANEL).should('not.be.visible');

    // Test
    cy.get(os.Toolbar.timeFilter.BUTTON).click();
    cy.get(os.Toolbar.timeFilter.BUTTON)
        .should('have.class', os.Toolbar.timeFilter.BUTTON_IS_ACTIVE);
    cy.get(os.Toolbar.timeFilter.PANEL).should('be.visible');
    cy.get(os.Toolbar.timeFilter.START_HOUR).should('be.visible');
    cy.get(os.Toolbar.timeFilter.END_HOUR).should('be.visible');
    cy.get(os.Toolbar.timeFilter.APPLY_BUTTON).should('be.visible');

    // Clean up
    cy.get(os.Toolbar.timeFilter.BUTTON).click();
    cy.get(os.Toolbar.timeFilter.BUTTON)
        .should('not.have.class', os.Toolbar.timeFilter.BUTTON_IS_ACTIVE);
    cy.get(os.Toolbar.timeFilter.PANEL).should('not.be.visible');
  });

  it('Timeline', function() {
    // Setup
    cy.get(os.Timeline.PANEL).should('not.exist');

    // Test
    cy.get(os.Toolbar.TIMELINE_TOGGLE).click();
    cy.get(os.Timeline.PANEL).should('be.visible');
    cy.get(os.Timeline.START_DATE_TIME).should('be.visible');
    cy.get(os.Timeline.PLAY_BUTTON).should('be.visible');
    cy.get(os.Timeline.RECORD_BUTTON).should('be.visible');
    cy.get(os.Timeline.END_DATE_TIME).should('be.visible');

    // Clean up
    cy.get(os.Toolbar.TIMELINE_TOGGLE).click();
    cy.get(os.Timeline.PANEL).should('not.exist');
  });
});
