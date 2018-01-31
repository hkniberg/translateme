import {parseGitUrl} from "../../lib/util";

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
  
  Router.go("/languages/" + parsedUrl.owner + "/" + parsedUrl.repo)
}