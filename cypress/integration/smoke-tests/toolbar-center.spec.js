/// <reference types="Cypress" />
var core = require('../../support/selectors/core.js');

describe('Toolbar center', function() {
  before('Login', function() {
    cy.login();
  });

  it('Previous day', function() {
    // Setup
    // none

    // Test
    cy.get(core.Toolbar.Date.INPUT)
        .should('have.value', Cypress.moment().format('YYYY[-]MM[-]DD'));
    cy.get(core.Toolbar.PREVIOUS_DAY_BUTTON).click();
    cy.get(core.Toolbar.Date.INPUT)
        .should('have.value', Cypress.moment().subtract(1, 'days').format('YYYY[-]MM[-]DD'));

    // Clean up
    cy.wait(500); // Wait to avoid rapidly changing dates
    cy.get(core.Toolbar.NEXT_DAY_BUTTON).click();
    cy.get(core.Toolbar.Date.INPUT)
        .should('have.value', Cypress.moment().format('YYYY[-]MM[-]DD'));
  });

  it('Date', function() {
    // Setup
    cy.get(core.Toolbar.Date.Calendar.PANEL).should('not.be.visible');

    // Test
    cy.get(core.Toolbar.Date.INPUT).click();
    cy.get(core.Toolbar.Date.Calendar.PANEL).should('be.visible');
    cy.get(core.Toolbar.Date.Calendar.MONTH_DROPDOWN).should('contain', Cypress.moment().format('MMM'));
    cy.get(core.Toolbar.Date.Calendar.YEAR_DROPDOWN).should('contain', Cypress.moment().format('YYYY'));
    cy.get(core.Toolbar.Date.Calendar.CURRENT_DAY).should('contain', Cypress.moment().format('D'));

    // Clean up
    cy.wait(500);
    cy.get(core.Toolbar.Date.Calendar.CLOSE_BUTTON).click();
    cy.get(core.Toolbar.Date.Calendar.PANEL).should('not.be.visible');
  });

  it('Next day', function() {
    // Setup
    // none

    // Test
    cy.get(core.Toolbar.Date.INPUT)
        .should('have.value', Cypress.moment().format('YYYY[-]MM[-]DD'));
    cy.get(core.Toolbar.NEXT_DAY_BUTTON).click();
    cy.get(core.Toolbar.Date.INPUT)
        .should('have.value', Cypress.moment().add(1, 'days').format('YYYY[-]MM[-]DD'));

    // Clean up
    cy.wait(500); // Wait to avoid rapidly changing dates
    cy.get(core.Toolbar.PREVIOUS_DAY_BUTTON).click();
    cy.get(core.Toolbar.Date.INPUT)
        .should('have.value', Cypress.moment().format('YYYY[-]MM[-]DD'));
  });

  it('Duration', function() {
    // Setup
    // none

    // Test
    cy.get(core.Toolbar.DURATION_DROPDOWN).should('have.value', 'day');
    cy.get(core.Toolbar.DURATION_DROPDOWN).should('contain', 'day');
    cy.get(core.Toolbar.DURATION_DROPDOWN).should('contain', 'week');
    cy.get(core.Toolbar.DURATION_DROPDOWN).should('contain', 'month');
    cy.get(core.Toolbar.DURATION_DROPDOWN).should('contain', 'custom');
    cy.get(core.Toolbar.DURATION_DROPDOWN).select('month');
    cy.get(core.Toolbar.DURATION_DROPDOWN).should('have.value', 'month');

    // Clean up
    cy.get(core.Toolbar.DURATION_DROPDOWN).select('day');
    cy.get(core.Toolbar.DURATION_DROPDOWN).should('have.value', 'day');
  });

  it('Time filter', function() {
    // Setup
    cy.get(core.Toolbar.timeFilter.BUTTON)
        .should('not.have.class', core.Toolbar.timeFilter.BUTTON_IS_ACTIVE_CLASS);
    cy.get(core.Toolbar.timeFilter.PANEL).should('not.be.visible');

    // Test
    cy.get(core.Toolbar.timeFilter.BUTTON).click();
    cy.get(core.Toolbar.timeFilter.BUTTON)
        .should('have.class', core.Toolbar.timeFilter.BUTTON_IS_ACTIVE_CLASS);
    cy.get(core.Toolbar.timeFilter.PANEL).should('be.visible');
    cy.get(core.Toolbar.timeFilter.START_HOUR_INPUT).should('be.visible');
    cy.get(core.Toolbar.timeFilter.END_HOUR_INPUT).should('be.visible');
    cy.get(core.Toolbar.timeFilter.APPLY_BUTTON).should('be.visible');

    // Clean up
    cy.get(core.Toolbar.timeFilter.BUTTON).click();
    cy.get(core.Toolbar.timeFilter.BUTTON)
        .should('not.have.class', core.Toolbar.timeFilter.BUTTON_IS_ACTIVE_CLASS);
    cy.get(core.Toolbar.timeFilter.PANEL).should('not.be.visible');
  });

  it('Timeline', function() {
    // Setup
    cy.get(core.Timeline.PANEL).should('not.exist');

    // Test
    cy.get(core.Toolbar.TIMELINE_TOGGLE_BUTTON).click({force:true}); // TODO: Remove force:true workaround after #732 fixed
    cy.get(core.Timeline.PANEL).should('be.visible');
    cy.get(core.Timeline.START_DATE_TIME_TEXT).should('be.visible');
    cy.get(core.Timeline.PLAY_BUTTON).should('be.visible');
    cy.get(core.Timeline.RECORD_BUTTON).should('be.visible');
    cy.get(core.Timeline.END_DATE_TIME_TEXT).should('be.visible');

    // Clean up
    cy.get(core.Toolbar.TIMELINE_TOGGLE_BUTTON).click({force:true}); // TODO: Remove force:true workaround after #732 fixed
    cy.get(core.Timeline.PANEL).should('not.exist');
  });
});
