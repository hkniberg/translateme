import {getGitHubAccessToken} from "../authentication";
import {session} from "../session"

/*
  
 */
Template.loadingStatus.onRendered(function() {
  console.log("\n\n===================================loadingStatus onRendered", Template.currentData())
  
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

  console.log("Calling session.hasLanguageDatas", owner, repo, languageCodes)
  if (!session.hasLanguageDatas(owner, repo, languageCodes)) {
    console.log("Some languageDatas are not loaded! Let's load them now.")
    //Load all language datas for this project
    //and store in the session
    session.setRepoNotFound(false)
    session.setLoadingLanguageData(true)
    Meteor.call("getLanguageDatas", {owner, repo, baseLanguagePath, languageCodes, gitHubAccessToken}, function(err, languageDatas) {
      console.log("getLanguageDatas", languageDatas)
      session.setLoadingLanguageData(false)

      if (err) {
        console.log("Got error", err)
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
    console.log("All language datas are loaded!")
  }
}
