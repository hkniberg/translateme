import {parseGitUrl} from "../../lib/util"
import {session} from "../session"

Template.selectProjectToTranslate.onRendered(function() {
  session.clearError("selectProjectToTranslate")
})

Template.selectProjectToTranslate.events({
  "click .selectButton"() {
    submit()
  },

  "keyup .projectUrl": function(event) {
    if (event.which === 13) {
      submit()
    }
  }
})

function submit() {
  const url = $(".projectUrl").val()
  const parsedUrl = parseGitUrl(url)
  if (parsedUrl) {
    Router.go("/languages/" + parsedUrl.owner + "/" + parsedUrl.repo)
  } else {
    session.setError("selectProjectToTranslate", "Sorry, that doesn't look like a valid github project link to me.")
  }
  
}