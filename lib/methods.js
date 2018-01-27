import {getLanguageName} from "./data/languages";
const querystring = require('querystring')

//995dc627bf5340de8cd3c904fd52b8de1676a1bf

Meteor.methods({
  getLanguages(owner, repo, gitHubAccessToken) {
    if (Meteor.isServer) {
      return getLanguages(owner, repo, gitHubAccessToken)
    }
  },

  getLanguageTexts(owner, repo, languageCode, gitHubAccessToken) {
    if (Meteor.isServer) {
      return getLanguageTexts(owner, repo, languageCode, gitHubAccessToken)
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

  submitTranslation(owner, repo, fromLanguageCode, toLanguageCode, fullTranslation, comment, gitHubAccessToken) {
    if (Meteor.isServer) {
      return submitTranslation(owner, repo, fromLanguageCode, toLanguageCode, fullTranslation, comment, gitHubAccessToken)
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
function submitTranslation(owner, repo, fromLanguageCode, toLanguageCode, fullTranslation, comment, gitHubAccessToken) {
  const currentGitUser = getGitUser(gitHubAccessToken)

  const result = {
    log: []
  }

  let isForkNeeded = true
  if (owner == currentGitUser) {
    isForkNeeded = false
  }
  //TODO check if the current user can commit directly to the given repo

  //TODO: figure out the file name
  const translatedFilePath = "i18n/" + toLanguageCode + ".i18n.json"
  const fullTranslationAsString = JSON.stringify(fullTranslation)

  if (isForkNeeded) {
    //Fork the repo to the current github user's account
    console.log("Forking repo")
    forkRepo(owner, repo, gitHubAccessToken)
    result.log.push("Forked the repo from " + owner + "/" + repo + " to " + currentGitUser + "/" + repo)

    //Commit the translation file to the forked repo
    console.log("Committing to the fork")
    result.commitUrl = commitFile(currentGitUser, repo, translatedFilePath, fullTranslationAsString, comment, gitHubAccessToken)
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
      result.pullRequestUrl = createPullRequest(currentGitUser, owner, repo, comment, gitHubAccessToken)
      result.log.push("Submitted a pull request on " + owner + "/" + repo)
    }


  } else {
    //Commit the translation file directly to the owner's repo
    console.log("Committing directly to the repo")
    const commitSha = commitFile(owner, repo, translatedFilePath, fullTranslationAsString, comment, gitHubAccessToken)
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
  console.log("commitFile", owner, repo, filePath, fileContents, commitMessage, gitHubAccessToken)
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
  console.log("result", result)
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

function isAlreadyForked(owner, repo, gitHubAccessToken) {
  const forks = callGitHub(owner, repo, "forks", gitHubAccessToken, "GET")
  console.log("forks", forks)
  return true
}

function googleTranslate(text, fromLanguageCode, toLanguageCode) {
  console.log("googleTranslate", text, fromLanguageCode, toLanguageCode)
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
  console.log("translatedText = ", translatedText)

  return translatedText
}

function requestGitHubAccessToken(code) {
  console.log("getGitHubAccessToken", code)
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


/*
Returns something like:
  [
    {
      languageCode: en,
      languageName: "English",
      path: "i18n/en.i18n.json",
      downloadUrl: "https://raw.githubusercontent.com/hkniberg/translateme/master/i18n/en.i18n.json"
    }
  ]
 */
function getLanguages(owner, repo, gitHubAccessToken) {
  console.log("getLanguages", owner, repo, gitHubAccessToken)
  const files = callGitHub(owner, repo, "contents/", gitHubAccessToken)
  const i18nFolder = findDir(files, "i18n")

  if (i18nFolder) {
    const i18nFiles = callGitHub(owner, repo, "contents/" + i18nFolder.path, gitHubAccessToken)
    const regexp = /(\w*)\..*/
    const languages = []
    i18nFiles.forEach((i18nFile) => {
      //Figure out if this file looks like "en.i18n.json"
      const match = i18nFile.name.match(regexp)
      if (match) {
        languages.push({
          languageCode: match[1],
          languageName: getLanguageName(match[1]),
          path: i18nFile.path,
          downloadUrl: i18nFile.download_url
        })
      }
    })
    return languages
  } else {
    throw new Meteor.Error("noTranslationFolderFound")
  }
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
  Return something like:
  [
    {key: "Title", text: "My cool website"}
    ...
  ]
 */
function getLanguageTexts(owner, repo, languageCode, gitHubAccessToken) {
  const languages = getLanguages(owner, repo, gitHubAccessToken)
  const language = languages.find((language) => {
    return language.languageCode == languageCode
  })
  const url = language.downloadUrl
  const languageTextsAsObject = getHttpFileAsJson(url)
  const languageTextsAsArray = []
  Object.keys(languageTextsAsObject).forEach((key) => {
    languageTextsAsArray.push({
      key: key,
      text: languageTextsAsObject[key]
    })
  })
  return languageTextsAsArray

}

function getHttpFileAsJson(url) {
  const response = HTTP.call("GET", url)
  assert(response.statusCode == 200, "Oh no! Got http status code " + response.statusCode)
  const content = response.content
  assert(content, "No content in the http response from " + url)
  return JSON.parse(content)
}

function callGitHub(owner, repo, command, gitHubAccessToken, method = "GET", queryParams = {}) {
  const url = "https://api.github.com/repos/" + owner + "/" + repo + "/" + command

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
    if (err.response && err.response.statusCode && err.response.statusCode == 404) {
      console.log("Got 404. Will return gitHubError. Repo is probably private.")
      throw new Meteor.Error("gitHubError", err.message)
    } else {
      console.log("error.response", err.response)
      throw new Meteor.Error("gitHubError", err.message)
    }
  }
}


function findDir(files, dirName) {
  return files.find((file) => {
    return file.type == "dir" && file.name == dirName
  })
}

function getLanguageFilePath(languageCode) {
  const projectLanguage = projectLanguagesVar.get().find((projectLanguage) => {
    return projectLanguage.languageCode == languageCode
  })
  return projectLanguage.path
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
