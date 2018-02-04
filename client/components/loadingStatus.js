import {getGitHubAccessToken} from "../authentication";
import {session} from "../session"

/*

 */
Template.loadingStatus.onRendered(function() {
  const data = Template.parentData()
  check(data.owner, String)
  check(data.repo, String)
  check(data.baseLanguagePath, Match.Maybe(String))

  session.clearError("loadingStatus")
  loadLanguageDataIfMissing(data.owner, data.repo, data.baseLanguagePath)
})


function loadLanguageDataIfMissing(owner, repo, baseLanguagePath) {
  const gitHubAccessToken = getGitHubAccessToken()

  if (!session.hasLanguageDatas(owner, repo)) {
    //Load all language datas for this project
    //and store in the session
    session.setLoadingLanguageData(true)
    session.setRepoNotFound(false)

    Meteor.call("getAllLanguageDatasForProject", {owner, repo, baseLanguagePath, gitHubAccessToken}, function(err, languageDatas) {
      console.log("getAllLanguageDatasForProject", languageDatas)
      session.setLoadingLanguageData(false)

      if (err) {
        console.log("Got error", err)
        if (err.error == "notFound") {
          session.setRepoNotFound(true)
        } else {
          session.setError("loadingStatus", "getAllLanguageDatasForProject failed", err)
        }
        return
      }

      if (languageDatas) {
        languageDatas = languageDatas.sort((a, b) => {
          return a.languageName > b.languageName
        })
        session.setLanguageDatas(owner, repo, languageDatas)
      }
    })
  }
}