describe("Cypress smoke test", () => {
  it("should load the homepage", () => {
    cy.visit("/");
    cy.get("main").should("exist");
  });
});
