import {getLanguageInfos} from "./translationLogic"
import {_getReviewData} from "./translationLogic";
import {_getLanguageInfo} from "./translationLogic";
import {_getLanguageDatas} from "./translationLogic";
import {requestGitHubAccessToken} from "./translationLogic";
import {googleTranslate} from "./googleTranslate";
import {submitTranslation} from "./translationLogic";
import {getAllLanguageDatasForProject} from "./translationLogic";

Meteor.methods({
  
  /**
   Returns an array of LanguageDatas
   ... or null if I can't find any, for example because the project type is unknown.

   @param baseLanguagePath optional. If given, we'll only look for files in that same dir. Otherwise we'll search in the standard locations as defined in each plugin.
   @param gitHubAccessToken optional

   Meteor.Error codes:
   - cantFindRepo = Either the repo doesn't exist, or it is private and the user should do a github signin
   - cantFindLocaleFiles = We found the repo, but can't find any locale files. Could be an unknown project structure.
   */
  getAllLanguageDatasForProject({owner, repo, baseLanguagePath, gitHubAccessToken}) {
    check(owner, String)
    check(repo, String)
    check(baseLanguagePath, Match.Maybe(String))
    check(gitHubAccessToken, Match.Maybe(String))

    if (Meteor.isServer) {
      const languageDatas = getAllLanguageDatasForProject({owner, repo, baseLanguagePath, gitHubAccessToken})
      console.log("Returning", languageDatas)
      return languageDatas
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
   - cantFindLocaleFiles = We found the repo, but can't find any locale files. Could be an unknown project structure.
   */
  getReviewData(fromOwner, toOwner, repo, fromPath, toPath, fileFormat, gitHubAccessToken) {
    console.log("getReviewData", fromOwner, toOwner, repo, fromPath, toPath, fileFormat, gitHubAccessToken)
    if (Meteor.isServer) {
      return _getReviewData(fromOwner, toOwner, repo, fromPath, toPath, fileFormat, gitHubAccessToken)
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


