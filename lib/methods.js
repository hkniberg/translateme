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
  }
})

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

  const files = callGitHub(owner, repo, "/contents/", gitHubAccessToken)
  const i18nFolder = findDir(files, "i18n")

  if (i18nFolder) {
    const i18nFiles = callGitHub(owner, repo, "/contents/" + i18nFolder.path, gitHubAccessToken)
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

function callGitHub(owner, repo, command, gitHubAccessToken) {
  const url = "https://api.github.com/repos/" + owner + "/" + repo + command

  let query = ""
  if (gitHubAccessToken) {
    query = "access_token=" + gitHubAccessToken
  } else {
    var clientId = getEnvVariable("defaultClientId")
    var clientSecret = getEnvVariable("defaultClientSecret")
    query = "client_id=" + clientId + "&client_secret=" + clientSecret
  }

  try {
    console.log("Calling " + url + " with query ", query)
    const response = HTTP.call("GET", url, {headers: {"User-Agent": "translateme"}, query: query})
    if (response.statusCode != 200) {
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
