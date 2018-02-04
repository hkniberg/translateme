import {getLanguageInfos} from "./translationLogic"
import {getReviewData} from "./translationLogic";
import {_getLanguageInfo} from "./translationLogic";
import {_getLanguageDatas} from "./translationLogic";
import {requestGitHubAccessToken} from "./translationLogic";
import {googleTranslate} from "./googleTranslate";
import {submitTranslation} from "./translationLogic";
import {getAllLanguageDatasForProject} from "./translationLogic";
import {getLanguageDataFromPath} from "./translationLogic";


Meteor.methods({
  
  /**
   Returns an array of LanguageDatas
   ... or null if I can't find any, for example because the project type is unknown.

   @param baseLanguagePath optional. If given, we'll only look for files in that same dir. Otherwise we'll search in the standard locations as defined in each plugin.
   @param languageCodes an array of language codes to include, or null to include all available
   @param gitHubAccessToken optional

   Meteor.Error codes:
   - cantFindRepo = Either the repo doesn't exist, or it is private and the user should do a github signin
   - cantFindLocaleFiles = We found the repo, but can't find any locale files. Could be an unknown project structure.
   */
  getLanguageDatas({owner, repo, baseLanguagePath, languageCodes, gitHubAccessToken}) {
    check(owner, String)
    check(repo, String)
    check(baseLanguagePath, Match.Maybe(String))
    check(languageCodes, Match.Maybe([String]))
    check(gitHubAccessToken, Match.Maybe(String))

    if (Meteor.isServer) {
      const languageDatas = getAllLanguageDatasForProject({owner, repo, baseLanguagePath, languageCodes, gitHubAccessToken})
      //console.log("Returning", languageDatas)
      return languageDatas
    }
  },

  /**
   Returns a LanguageData that corresponds to the specific file path
   ... or null if I can't find any, for example because the project type is unknown.

   Meteor.Error codes:
   - cantFindRepo = Either the repo doesn't exist, or it is private and the user should do a github signin
   - cantFindWorkingPlugin
   */
  getLanguageDataFromPath({owner, repo, path, gitHubAccessToken}) {
    check(owner, String)
    check(repo, String)
    check(path, String)
    check(gitHubAccessToken, Match.Maybe(String))

    if (Meteor.isServer) {
      const languageData = getLanguageDataFromPath({owner, repo, path, gitHubAccessToken})
      console.log("Returning", languageData)
      return languageData
    }
  },


  /*
    Returns
   {
     fromLanguage: {
     ... languageData object
     }
     toLanguage: {
     ... languageData object
     }
   }

   Meteor.Error codes:
   - cantFindRepo = Either the repo doesn't exist, or it is private and the user should do a github signin
   - cantFindWorkingPlugin
   */
  getReviewData({fromOwner, toOwner, repo, fromPath, toPath, fileFormat, gitHubAccessToken}) {
    check(fromOwner, String)
    check(toOwner, String)
    check(repo, String)
    check(fromPath, String)
    check(toPath, String)
    check(fileFormat, String)
    check(gitHubAccessToken, Match.Maybe(String))

    console.log("getReviewData", fromOwner, toOwner, repo, fromPath, toPath, fileFormat, gitHubAccessToken)
    if (Meteor.isServer) {
      return getReviewData({fromOwner, toOwner, repo, fromPath, toPath, fileFormat, gitHubAccessToken})
    }
  },

  requestGitHubAccessToken(code) {
    console.log("requestGitHubAccessToken")

    if (Meteor.isServer) {
      return requestGitHubAccessToken(code)
    }
  },

  /**
   * Null if it couldn't translate
   */
  googleTranslate(text, fromLanguageCode, toLanguageCode) {
    if (Meteor.isServer) {
      this.unblock()
      return googleTranslate(text, fromLanguageCode, toLanguageCode)
    }
  },

  submitTranslation({owner, repo, fileFormat, fromLanguageFile, toLanguageCode, texts, commitComment, gitHubAccessToken}) {
    check(owner, String)
    check(repo, String)
    check(fileFormat, String)
    check(fromLanguageFile, String)
    check(toLanguageCode, String)
    check(texts, Object)
    check(commitComment, String)
    check(gitHubAccessToken, String)

    if (Meteor.isServer) {
      return submitTranslation({owner, repo, fileFormat, fromLanguageFile, toLanguageCode, texts, commitComment, gitHubAccessToken})
    }
  }
})


