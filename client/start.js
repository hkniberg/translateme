Template.start.events({
  "click .translate"() {
    Router.go('/selectProjectToTranslate')
  },
  "click .getTranslateMeButton"() {
    Router.go('/createButton')
  }
})