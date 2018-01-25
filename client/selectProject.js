import {Session} from "meteor/session"

const checking = new ReactiveVar(false)

Template.selectProject.events({
  "click .selectButton"() {
    const url = $(".projectUrl").val()
    console.log("url", url)
    const regexp = /(.*)github\.com\/([^\/]*)\/([^\/]*)/
    const match = url.match(regexp)
    const owner = match[2]
    const repo = match[3]

    Router.go("/languages/" + owner + "/" + repo)
  }
})

Template.selectProject.helpers({
  checking() {
    return checking.get()
  }
})