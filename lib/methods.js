import {getLanguageName} from "./data/languages";
import {getPlugins} from "./initPlugins";
import {getPluginByName} from "./initPlugins";
import {getRelativeString} from "./util";
const querystring = require('querystring')

//995dc627bf5340de8cd3c904fd52b8de1676a1bf

Meteor.methods({
  /*
    Returns an array of LanguageInfos
    ... or null if I can't find any, for example because the project type is unknown.

    Meteor.Error codes:
    - cantFindRepo = Either the repo doesn't exist, or it is private and the user should do a github signin
    - cantFindLocaleFiles = We found the repo, but can't find any locale files. Could be an unknown project structure.
   */
  getLanguageInfos(owner, repo, gitHubAccessToken) {
    //console.log("getLanguageInfos", owner, repo, gitHubAccessToken)
    if (Meteor.isServer) {
      return getLanguageInfos(owner, repo, gitHubAccessToken)
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
    if (Meteor.isServer) {
      return getReviewData(fromOwner, toOwner, repo, fromPath, toPath, fileFormat, gitHubAccessToken)
    }
  },


  /* Gets the actual texts for the given fromLanguage and toLanguage
    {
      fromLanguage: {
        ... languageData object
      }
      toLanguage: {
       ... languageData object
      }
    }

   Throws Meteor.Error("parseError") if it can't parse a file.

   */
  getLanguageDatas(owner, repo, fromLanguageInfo, toLanguageCode, gitHubAccessToken) {
    if (Meteor.isServer) {
      return getLanguageDatas(owner, repo, fromLanguageInfo, toLanguageCode, gitHubAccessToken)
    }
  },


  requestGitHubAccessToken(code) {
    if (Meteor.isServer) {
      return requestGitHubAccessToken(code)
    }
  },

  googleTranslate(text, fromLanguageCode, toLanguageCode) {
    if (Meteor.isServer) {
      this.unblock()
      return googleTranslate(text, fromLanguageCode, toLanguageCode)
    }
  },

  submitTranslation(owner, repo, fromLanguageInfo, toLanguageCode, fullTranslation, comment, gitHubAccessToken) {
    if (Meteor.isServer) {
      return submitTranslation(owner, repo, fromLanguageInfo, toLanguageCode, fullTranslation, comment, gitHubAccessToken)
    }
  }
})


/*
  Returns:
  {
    commitUrl: //github url to the commit
    pullRequestUrl: //github url to the pull request, if a pull request was done
    pullRequestAlreadyExisted: true
    log: [
      "Forked the repo",
      "Created a commit",
      "Sent a pull request"
    ]
  }

 */
function submitTranslation(owner, repo, fromLanguageInfo, toLanguageCode, texts, commitComment, gitHubAccessToken) {
  //console.log("submitTranslation", owner, repo, fromLanguageInfo, toLanguageCode, texts, comment, gitHubAccessToken)
  const currentGitUser = getGitUser(gitHubAccessToken)

  const result = {
    log: []
  }

  let isForkNeeded = true
  if (owner == currentGitUser) {
    isForkNeeded = false
  }
  //TODO check if the current user can commit directly to the given repo

  const plugin = getPluginByName(fromLanguageInfo.fileFormat)
  const fileName = plugin.getFileNameForLanguage(toLanguageCode)
  const fileContent = plugin.convertLanguageTextsToFileContents(fileName, texts)

  console.log("fromLanguageInfo", fromLanguageInfo)
  const translatedFilePath = getRelativeString(fromLanguageInfo.path, fileName)
  console.log("translatedFilePath", translatedFilePath)
  //console.log("translatedFilePath", translatedFilePath)

  const reviewUrl = Meteor.absoluteUrl(
    "review" +
      "?fromOwner=" + owner +
      "&toOwner=" + currentGitUser +
      "&repo=" + repo +
      "&fromPath=" + encodeURIComponent(fromLanguageInfo.path) +
      "&toPath=" + encodeURIComponent(translatedFilePath) +
      "&fileFormat=" + fromLanguageInfo.fileFormat
  )

  const commitCommentWithReviewLink =
    commitComment + "\nReview the translation at " + reviewUrl




  if (isForkNeeded) {
    //Fork the repo to the current github user's account
    console.log("Forking repo")
    forkRepo(owner, repo, gitHubAccessToken)
    result.log.push("Forked the repo from " + owner + "/" + repo + " to " + currentGitUser + "/" + repo)

    //Commit the translation file to the forked repo
    console.log("Committing to the fork")

    result.commitUrl = commitFile(currentGitUser, repo, translatedFilePath, fileContent, commitCommentWithReviewLink, gitHubAccessToken)
    result.log.push("Committed the translation file to " + currentGitUser + "/" + repo)

    //Send a pull request, if needed
    console.log("Checking if pull request already exists")
    result.pullRequestUrl = getUrlToExistingPullRequest(currentGitUser, owner, repo, gitHubAccessToken)
    if (result.pullRequestUrl) {
      console.log("Pull request already exists")
      result.log.push("Pull request already exists on " + owner + "/" + repo)
      result.pullRequestAlreadyExisted = true
    } else {
      console.log("No existing pull request. Submitting a pull request.")
      const pullRequestComment = "Translation from " + currentGitUser + " (via TranslateMe service)"
      result.pullRequestUrl = createPullRequest(currentGitUser, owner, repo, pullRequestComment, gitHubAccessToken)
      result.log.push("Submitted a pull request on " + owner + "/" + repo)
    }


  } else {
    //Commit the translation file directly to the owner's repo
    console.log("Committing directly to the repo")
    const commitSha = commitFile(owner, repo, translatedFilePath, fileContent, commitCommentWithReviewLink, gitHubAccessToken)
    result.log.push("Committed the translation file to " + owner + "/" + repo)
    result.commitUrl = "https://github.com/" + currentGitUser + "/" + repo + "/commit/" + commitSha
  }

  return result
}


function forkRepo(owner, repo, gitHubAccessToken) {
  callGitHub(owner, repo, "forks", gitHubAccessToken, "POST")
}

/*
  Adds or updates the given file in the given repo
  Returns the commit SHA.
 */
function commitFile(owner, repo, filePath, fileContents, commitMessage, gitHubAccessToken) {
  //console.log("commitFile", owner, repo, filePath, fileContents, commitMessage, gitHubAccessToken)
  // The steps below are from this tutorial:
  // http://www.levibotelho.com/development/commit-a-file-with-the-github-api/

  let result

  //Get a reference to HEAD
  result = callGitHub(owner, repo, "git/refs/heads/master", gitHubAccessToken, "GET")
  const sha = result.object.sha

  //Grab the commit that HEAD points to
  result = callGitHub(owner, repo, "git/commits/" + sha, gitHubAccessToken, "GET")
  const lastCommitSha = result.sha
  const treeSha = result.tree.sha

  //Create a tree containing the new file
  const createTreeParams = {
    "base_tree": treeSha,
    "tree": [
      {
        "path": filePath,
        "mode": "100644",
        "type": "blob",
        "content": fileContents
      }
    ]
  }
  result = callGitHub(owner, repo, "git/trees", gitHubAccessToken, "POST", createTreeParams)
  const newTreeSha = result.sha

  //6. Create a new commit
  const commitPayload = {
    "message": commitMessage,	// Your commit message.
    "parents": [lastCommitSha],	// Array of SHAs. Usually contains just one SHA.
    "tree": newTreeSha		// SHA of the tree.
  }
  result = callGitHub(owner, repo, "git/commits", gitHubAccessToken, "POST", commitPayload)
  const newCommitSha = result.sha

  //7. Update HEAD
  result = callGitHub(owner, repo, "git/refs/heads/master", gitHubAccessToken, "PATCH", {sha: newCommitSha})

  return result.object.sha
}

function getUrlToExistingPullRequest(currentGitUser, owner, repo, gitHubAccessToken) {
  const head = currentGitUser + ":master"

  let result = callGitHub(owner, repo, "pulls", gitHubAccessToken, "GET", {head: head})
  //console.log("result", result)
  if (result.length > 0) {
    //Oh, a pull request already exists. Let's return that one.
    return result[0].html_url
  } else {
    return null
  }
}

/*
  Returns a URL to the pull request
 */
function createPullRequest(currentGitUser, owner, repo, comment, gitHubAccessToken) {
  const head = currentGitUser + ":master"

  const params = {
    title: comment,
    base: "master",
    head: head,
    body: comment
  }
  result = callGitHub(owner, repo, "pulls", gitHubAccessToken, "POST", params)
  return result.html_url
}

function googleTranslate(text, fromLanguageCode, toLanguageCode) {
  //console.log("googleTranslate", text, fromLanguageCode, toLanguageCode)
  assert(text, "Missing text")
  assert(fromLanguageCode, "Missing fromLanguageCode")
  assert(toLanguageCode, "Missing toLanguageCode")


  const googleApiKey = getEnvVariable("googleApiKey")

  var googleTranslate = require('google-translate')(googleApiKey)
  const translate = Meteor.wrapAsync(googleTranslate.translate, googleTranslate.translate)

  const textLines = text.split('\n')
  let translatedText = ""
  textLines.forEach((textLine) => {
    if (textLine) {
      const translation = translate(textLine, fromLanguageCode, toLanguageCode)
      if (translation.translatedText) {
        translatedText = translatedText + translation.translatedText
      }
    }
    translatedText = translatedText + "\n"
  })
  //console.log("translatedText = ", translatedText)

  return translatedText.trim()
}

function requestGitHubAccessToken(code) {
  //console.log("getGitHubAccessToken", code)
  var clientId = getEnvVariable("oauthClientId")
  var clientSecret = getEnvVariable("oauthClientSecret")

  const url = "https://github.com/login/oauth/access_token"
  const params = "client_id=" + clientId + "&client_secret=" + clientSecret + "&code=" + code
  console.log("calling " + url + " with params: ", params)
  try {
    const response = HTTP.call("POST", url, {headers: {"User-Agent": "translateme"}, data: params, query: params})
    if (response.statusCode != 200) {
      throw new Meteor.Error("gitHubError", "Got http status code " + response.statusCode + " from github!")
    }
    const contentString = response.content
    const content = querystring.parse(contentString)
    console.log("got response content", content)

    //const regexp = /access_token=(\w*)&.*/
    /*
    const match = content.match(regexp)
    if (match) {
      return match[1]
    } else {
      throw new Meteor.Error("gitHubError", "Strange, I was unable to parse the response from https://github.com/login/oauth/access_token: " + response.content )
    }
    */
    return content.access_token

  } catch (err) {
    console.log("error", err)
    throw new Meteor.Error("gitHubError", err.message)
  }
}


function canAccessRepo(owner, repo, gitHubAccessToken) {
  try {
    callGitHub(owner, repo, null, gitHubAccessToken)
    return true
  } catch (err) {
    if (err.error == "notFound") {
      return false
    } else {
      throw err
    }
  }
}

function createLanguageInfoFromPath(owner, repo, path, fileFormat) {
  const plugin = getPluginByName(fileFormat)

  const languageCode = plugin.getLanguageOfFile(path)

  const languageInfo = {
    languageCode: languageCode,
    languageName: getLanguageName(languageCode),
    path: path,
    downloadUrl: "https://raw.githubusercontent.com/" + owner + "/" + repo + "/master/" + path,
    fileFormat: fileFormat
  }
  return languageInfo
}


function getReviewData(fromOwner, toOwner, repo, fromPath, toPath, fileFormat, gitHubAccessToken) {
  const fromUrl = "https://api.github.com/repos/" + fromOwner + "/" + repo + "/contents/" + fromPath
  const toUrl = "https://api.github.com/repos/" + toOwner + "/" + repo + "/contents/" + toPath

  const fromLanguageInfo = createLanguageInfoFromPath(fromOwner, repo, fromPath, fileFormat)
  const toLanguageInfo = createLanguageInfoFromPath(toOwner, repo, toPath, fileFormat)

  const fromLanguageData = getLanguageData(fromLanguageInfo)
  const toLanguageData = getLanguageData(toLanguageInfo)

  return {
    fromLanguage: fromLanguageData,
    toLanguage: toLanguageData
  }
}



/*
Returns an array of all languageInfos in the given repo
 */
function getLanguageInfos(owner, repo, gitHubAccessToken) {
  //console.log("getLanguages", owner, repo, gitHubAccessToken)
  if (!canAccessRepo(owner, repo, gitHubAccessToken)) {
    if (gitHubAccessToken) {
      throw new Meteor.Error("notFound", "Can't access " + owner + "/" + repo + ", even though I have a github access token " + gitHubAccessToken)
    } else {
      throw new Meteor.Error("notFound", "Can't access " + owner + "/" + repo + ". However, I don't have a github access token " + gitHubAccessToken)
    }
  }


  const plugins = getPlugins()
  console.log("plugins", plugins.length)
  const languageInfos = []
  for (let i = 0; i < plugins.length; ++i) {
    const plugin = plugins[i]
    //console.log("Checking " + plugin.getName())
    const localeDirPaths = plugin.getTypicalLocalePaths()
    for (let j = 0; j < localeDirPaths.length; ++j) {
      const localeDirPath = localeDirPaths[j]
      //console.log("Checking " + localeDirPath)
      try {
        const localeFiles = callGitHub(owner, repo, "contents/" + localeDirPath, gitHubAccessToken)
        localeFiles.forEach((localeFile) => {
          const localeFilePath = localeFile.name
          const languageCode = plugin.getLanguageOfFile(localeFilePath)
          if (languageCode) {
            //Yay, found a locale file!
            const languageInfo = {
              languageCode: languageCode,
              languageName: getLanguageName(languageCode),
              path: localeFile.path,
              downloadUrl: localeFile.download_url,
              fileFormat: plugin.getName()
            }
            languageInfos.push(languageInfo)
          }
        })

      } catch (err) {
        if (err.error == "notFound") {
          //OK the localeDirPath was not found. No worries, we'll just keep looping.
        } else {
          //Oh, some other error. Let's rethrow!
          throw err
        }
      }
      if (languageInfos.length > 0) {
        break
      }
    }
  }
  //console.log("Returning", languageInfos)
  return languageInfos


}


function getGitUser(gitHubAccessToken) {
  const url = "https://api.github.com/user?access_token=" + gitHubAccessToken

  try {
    console.log("Calling " + url)
    const response = HTTP.call("GET", url, {headers: {"User-Agent": "translateme"}})
    console.log("Done! Got status code " + response.statusCode)
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Meteor.Error("gitHubError", "Got http status code " + response.statusCode + " from github!")
    }
    return response.data.login

  } catch (err) {
    console.log("error", err)
    throw new Meteor.Error("gitHubError", err.message)
  }
}


/*
 Throws Meteor.Error("parseError") if it can't parse a file.
 */
function getLanguageDatas(owner, repo, fromLanguageInfo, toLanguageCode, gitHubAccessToken) {
  //console.log("getLanguageDatas", owner, repo, fromLanguageInfo, toLanguageCode, gitHubAccessToken)
  const projectType = fromLanguageInfo.fileFormat
  const plugin = getPluginByName(projectType)

  //TODO check if toLanguage already exists as a file.
  //for now we assume it doesn't.

  const toLanguageFileName = plugin.getFileNameForLanguage(toLanguageCode)
  const toLanguageData = {
    languageCode: toLanguageCode,
    languageName: getLanguageName(toLanguageCode),
    path: getRelativeString(fromLanguageInfo.path, toLanguageFileName),
    downloadUrl: getRelativeString(fromLanguageInfo.downloadUrl, toLanguageFileName),
    fileFormat: projectType,
    texts: {}
  }

  return {
    fromLanguage: getLanguageData(fromLanguageInfo),
    toLanguage: toLanguageData
  }
}

/*
 Throws Meteor.Error("parseError") if it can't parse the file.
 */
function getLanguageData(languageInfo, gitHubAccessToken) {
  assert(languageInfo, "Missing languageInfo")

  const plugin = getPluginByName(languageInfo.fileFormat)
  assert(plugin, "No plugin named " + languageInfo.fileFormat)



  const languageData = {
    languageCode: languageInfo.languageCode,
    languageName: languageInfo.languageName,
    path: languageInfo.path,
    downloadUrl: languageInfo.downloadUrl,
    fileFormat: languageInfo.fileFormat
  }

  const fileName = plugin.getFileNameForLanguage(languageInfo.languageCode)

  let url = languageInfo.downloadUrl
  if (gitHubAccessToken) {
    url = url + "?access_token=" + gitHubAccessToken
  }
  const fileContents = getHttpFileContents(url)
  console.log("fileContents", fileContents)
  try {
    languageData.texts = plugin.convertFileContentsToLanguageTexts(fileName, fileContents)
    console.log("texts", languageData.texts)
  } catch(error) {
    console.log("Couldn't parse " + languageInfo.downloadUrl)
    throw new Meteor.Error("parseError", "Couldn't parse " + languageInfo.downloadUrl, error.message)
  }

  return languageData
}

function getHttpFileContents(url) {
  console.log("Opening " + url)
  const response = HTTP.call("GET", url, {headers: {"User-Agent": "translateme"}})
  assert(response.statusCode == 200, "Oh no! Got http status code " + response.statusCode)
  const content = response.content
  assert(content, "No content in the http response from " + url)
  return content
}


/*
  Throws Meteor.Error if GIT API returns an error.
  The error code "notFound" means we got a 404
  Otherwise we use error code "gitHubError"

 */
function callGitHub(owner, repo, command, gitHubAccessToken, method = "GET", queryParams = {}) {
  //console.log("callGitHub", owner ,repo, command, gitHubAccessToken, method, queryParams)
  let url = "https://api.github.com/repos/" + owner + "/" + repo

  if (command) {
    url = url + "/" + command
  }

  if (gitHubAccessToken) {
    queryParams.access_token = gitHubAccessToken
    //query = "access_token=" + gitHubAccessToken
  } else {
    //var clientId = getEnvVariable("defaultClientId")
    //var clientSecret = getEnvVariable("defaultClientSecret")
    //query = "client_id=" + clientId + "&client_secret=" + clientSecret
    queryParams.client_id = getEnvVariable("defaultClientId")
    queryParams.client_secret = getEnvVariable("defaultClientSecret")
  }
  const queryString = querystring.stringify(queryParams)

  try {
    console.log("Calling " + method + " to " + url + " with query ", queryString)
    const response = HTTP.call(method, url, {headers: {"User-Agent": "translateme"}, query: queryString, content: JSON.stringify(queryParams)})
    console.log("Done! Got status code " + response.statusCode)
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Meteor.Error("gitHubError", "Got http status code " + response.statusCode + " from github!")
    }
    return response.data

  } catch (err) {
    //console.log("err", err)
    if (err.response && err.response.statusCode && err.response.statusCode == 404) {
      console.log("Got 404. Will return gitHubError..")
      throw new Meteor.Error("notFound", err.message)
    } else {
      console.log("error.response", err.response)
      throw new Meteor.Error("gitHubError", err.message)
    }
  }
}


function getEnvVariable(name) {
  const value = process.env[name]
  if (!value) {
    throw new Meteor.Error("Env variable " + name + " must be set on the server!")
  }
  return value
}

function assert(test, errorKey, errorDescription) {
  if (!test) {
    console.log("Assert failed! Throwing " + errorKey, errorDescription)
    throw new Meteor.Error(errorKey, errorDescription)
  }
}
