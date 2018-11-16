import {getGitHubAccessToken} from "../authentication";
import {session} from "../session"

/*
  
 */
Template.loadingStatus.onRendered(function() {
  const data = Template.currentData()
  check(data.owner, String)
  check(data.repo, String)
  check(data.baseLanguagePath, Match.Maybe(String))
  check(data.languageCodes, Match.Maybe([String]))

  session.clearError("loadingStatus")


  loadLanguageDataIfMissing(data)
})


function loadLanguageDataIfMissing({owner, repo, baseLanguagePath, languageCodes}) {
  const gitHubAccessToken = getGitHubAccessToken()

  if (!session.hasLanguageDatas(owner, repo, languageCodes)) {
    //Load all language datas for this project
    //and store in the session
    session.setRepoNotFound(false)
    session.setLoadingLanguageData(true)
    Meteor.call("getLanguageDatas", {owner, repo, baseLanguagePath, languageCodes, gitHubAccessToken}, function(err, languageDatas) {
      session.setLoadingLanguageData(false)

      if (err) {
        console.log("getLanguageDatas method returned an error", err)
        if (err.error == "notFound") {
          session.setRepoNotFound(true)
        } else {
          session.setError("loadingStatus", "getLanguageDatas failed", err)
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
  } else {
  }
}
