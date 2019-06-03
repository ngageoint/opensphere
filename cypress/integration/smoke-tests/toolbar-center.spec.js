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
    cy.get(os.Toolbar.Date.INPUT)
        .should('have.value', Cypress.moment().format('YYYY[-]MM[-]DD'));
    cy.get(os.Toolbar.PREVIOUS_DAY_BUTTON).click();
    cy.get(os.Toolbar.Date.INPUT)
        .should('have.value', Cypress.moment().subtract(1, 'days').format('YYYY[-]MM[-]DD'));

    // Clean up
    cy.wait(500); // Wait to avoid rapidly changing dates
    cy.get(os.Toolbar.NEXT_DAY_BUTTON).click();
    cy.get(os.Toolbar.Date.INPUT)
        .should('have.value', Cypress.moment().format('YYYY[-]MM[-]DD'));
  });

  it('Date', function() {
    // Setup
    cy.get(os.Toolbar.Date.Calendar.PANEL).should('not.be.visible');

    // Test
    cy.get(os.Toolbar.Date.INPUT).click();
    cy.get(os.Toolbar.Date.Calendar.PANEL).should('be.visible');
    cy.get(os.Toolbar.Date.Calendar.MONTH_DROPDOWN).should('contain', Cypress.moment().format('MMM'));
    cy.get(os.Toolbar.Date.Calendar.YEAR_DROPDOWN).should('contain', Cypress.moment().format('YYYY'));
    cy.get(os.Toolbar.Date.Calendar.CURRENT_DAY).should('contain', Cypress.moment().format('D'));

    // Clean up
    cy.wait(500);
    cy.get(os.Toolbar.Date.Calendar.CLOSE_BUTTON).click();
    cy.get(os.Toolbar.Date.Calendar.PANEL).should('not.be.visible');
  });

  it('Next day', function() {
    // Setup
    // none

    // Test
    cy.get(os.Toolbar.Date.INPUT)
        .should('have.value', Cypress.moment().format('YYYY[-]MM[-]DD'));
    cy.get(os.Toolbar.NEXT_DAY_BUTTON).click();
    cy.get(os.Toolbar.Date.INPUT)
        .should('have.value', Cypress.moment().add(1, 'days').format('YYYY[-]MM[-]DD'));

    // Clean up
    cy.wait(500); // Wait to avoid rapidly changing dates
    cy.get(os.Toolbar.PREVIOUS_DAY_BUTTON).click();
    cy.get(os.Toolbar.Date.INPUT)
        .should('have.value', Cypress.moment().format('YYYY[-]MM[-]DD'));
  });

  it('Duration', function() {
    // Setup
    // none

    // Test
    cy.get(os.Toolbar.DURATION_DROPDOWN).should('have.value', 'day');
    cy.get(os.Toolbar.DURATION_DROPDOWN).should('contain', 'day');
    cy.get(os.Toolbar.DURATION_DROPDOWN).should('contain', 'week');
    cy.get(os.Toolbar.DURATION_DROPDOWN).should('contain', 'month');
    cy.get(os.Toolbar.DURATION_DROPDOWN).should('contain', 'custom');
    cy.get(os.Toolbar.DURATION_DROPDOWN).select('month');
    cy.get(os.Toolbar.DURATION_DROPDOWN).should('have.value', 'month');

    // Clean up
    cy.get(os.Toolbar.DURATION_DROPDOWN).select('day');
    cy.get(os.Toolbar.DURATION_DROPDOWN).should('have.value', 'day');
  });

  it('Time filter', function() {
    // Setup
    cy.get(os.Toolbar.timeFilter.BUTTON)
        .should('not.have.class', os.Toolbar.timeFilter.BUTTON_IS_ACTIVE_CLASS);
    cy.get(os.Toolbar.timeFilter.PANEL).should('not.be.visible');

    // Test
    cy.get(os.Toolbar.timeFilter.BUTTON).click();
    cy.get(os.Toolbar.timeFilter.BUTTON)
        .should('have.class', os.Toolbar.timeFilter.BUTTON_IS_ACTIVE_CLASS);
    cy.get(os.Toolbar.timeFilter.PANEL).should('be.visible');
    cy.get(os.Toolbar.timeFilter.START_HOUR_INPUT).should('be.visible');
    cy.get(os.Toolbar.timeFilter.END_HOUR_INPUT).should('be.visible');
    cy.get(os.Toolbar.timeFilter.APPLY_BUTTON).should('be.visible');

    // Clean up
    cy.get(os.Toolbar.timeFilter.BUTTON).click();
    cy.get(os.Toolbar.timeFilter.BUTTON)
        .should('not.have.class', os.Toolbar.timeFilter.BUTTON_IS_ACTIVE_CLASS);
    cy.get(os.Toolbar.timeFilter.PANEL).should('not.be.visible');
  });

  it('Timeline', function() {
    // Setup
    cy.get(os.Timeline.PANEL).should('not.exist');

    // Test
    cy.get(os.Toolbar.TIMELINE_TOGGLE_BUTTON).click();
    cy.get(os.Timeline.PANEL).should('be.visible');
    cy.get(os.Timeline.START_DATE_TIME_TEXT).should('be.visible');
    cy.get(os.Timeline.PLAY_BUTTON).should('be.visible');
    cy.get(os.Timeline.RECORD_BUTTON).should('be.visible');
    cy.get(os.Timeline.END_DATE_TIME_TEXT).should('be.visible');

    // Clean up
    cy.get(os.Toolbar.TIMELINE_TOGGLE_BUTTON).click();
    cy.get(os.Timeline.PANEL).should('not.exist');
  });
});
