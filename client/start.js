Template.start.events({
  "click .translate"() {
    Router.go('/selectProject')
  },
  "click .getTranslateMeButton"() {
    console.log("get button")
  }
})