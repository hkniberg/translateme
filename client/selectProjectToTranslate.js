import {parseGitUrl} from "./util";

Template.selectProjectToTranslate.events({
  "click .selectButton"() {
    const url = $(".projectUrl").val()
    const parsedUrl = parseGitUrl(url)
    Router.go("/languages/" + parsedUrl.owner + "/" + parsedUrl.repo)
  }
})
