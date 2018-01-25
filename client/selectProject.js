Template.selectProject.events({
  "click .selectButton"() {
    const url = $(".projectUrl").val()
    console.log("url", url)
    const regexp = /(.*)github\.com\/([^\/]*)\/([^\/]*)\/(.*)/
    const match = url.match(regexp)
    const owner = match[2]
    const repo = match[3]
    const path = match[4]

    Session.set("owner", owner)
    Session.set("repo", repo)
    Session.set("path", path)
    Router.go('view')
  }
})