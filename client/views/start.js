import {Session} from "meteor/session"

Template.start.onRendered(() => {
  Session.set("showIntroVideo", true)
})

Template.start.events({
  "click .translate"() {
    Session.set("showIntroVideo", false)
    Router.go('/selectProjectToTranslate')
  },
  "click .getTranslateMeButton"() {
    Session.set("showIntroVideo", false)
    Router.go('/createButton')
  }
})