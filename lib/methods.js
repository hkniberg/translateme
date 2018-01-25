import {getLanguageName} from "./data/languages";

//995dc627bf5340de8cd3c904fd52b8de1676a1bf

Meteor.methods({
  getLanguages(owner, repo) {
    if (Meteor.isServer) {
      return getLanguages(owner, repo)
    }
  },

  getLanguageTexts(owner, repo, languageCode) {
    if (Meteor.isServer) {
      return getLanguageTexts(owner, repo, languageCode)
    }

  }
})


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
function getLanguages(owner, repo) {

  const files = callGitHub(owner, repo, "/contents/")
  const i18nFolder = findDir(files, "i18n")
  console.log("i18nFolder", i18nFolder)

  if (i18nFolder) {
    const i18nFiles = callGitHub(owner, repo, "/contents/" + i18nFolder.path)
    const regexp = /(\w*)\..*/
    const languages = []
    i18nFiles.forEach((i18nFile) => {
      //Figure out if this file looks like "en.i18n.json"
      const match = i18nFile.name.match(regexp)
      if (match) {
        console.log("i18nFile", i18nFile)
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
function getLanguageTexts(owner, repo, languageCode) {
  const languages = getLanguages(owner, repo)
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
  console.log("Calling " + url)
  const response = HTTP.call("GET", url)
  console.assert(response.statusCode == 200, "Oh no! Got http status code " + response.statusCode)
  console.log("response", response)
  const content = response.content
  console.assert(content, "No content in the http response frmo " + url)
  return JSON.parse(content)
}

function callGitHub(owner, repo, command) {
  const url = "https://api.github.com/repos/" + owner + "/" + repo + command
  const headers = {
    "User-Agent": "translateme"
  }
  const clientId = process.env.gitClientId
  if (!clientId) {
    throw new Meteor.Error("Env variable gitClientId must be set on the server")
  }
  const clientSecret = process.env.gitClientSecret
  if (!clientSecret) {
    throw new Meteor.Error("Env variable gitClientSecret must be set on the server")
  }

  const query = "client_id=" + clientId + "&client_secret=" + clientSecret
  console.log("query", query)
  const response = HTTP.call("GET", url, {headers: headers, query: query})
  console.assert(response.statusCode == 200, "Oh no! Got http status code " + response.statusCode)
  return response.data
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