import {getLanguageName} from "./data/languages";
import {getPlugins} from "./initPlugins";
import {getPluginByName} from "./initPlugins";
import {getRelativeString} from "./util";
import {removeParentsFromPath} from "./util";
import {getParentOfFile} from "./util";
import {callGitHub} from "./gitHub";
import {canAccessRepo} from "./gitHub";
import {commitFile} from "./gitHub";
import {forkRepo} from "./gitHub";
import {getEnvVariable} from "./serverUtil";
import {getGitUser} from "./gitHub";
import {getHttpFileContents} from "./gitHub";
import {getDatesOfGitHubFile} from "./gitHub";
import {getUrlToExistingPullRequest} from "./gitHub";

const log = console.log
const logAllStackTraces = false
const trace = true

const querystring = require('querystring')

/**
 Returns an array of LanguageDatas
 ... or null if I can't find any, for example because the project type is unknown.

 @param baseLanguageFilePath optional. If given, we'll only look for files in that same dir. Otherwise we'll search in the standard locations as defined in each plugin.
 @param gitHubAccessToken optional

 Meteor.Error codes:
 - cantFindRepo = Either the repo doesn't exist, or it is private and the user should do a github signin
 - cantFindLocaleFiles = We found the repo, but can't find any locale files. Could be an unknown project structure.
 */
export function getAllLanguageDatasForProject({owner, repo, baseLanguageFilePath, languageCodes, gitHubAccessToken}) {
  log("getAllLanguageDatasForProject", arguments[0])

  assertThatWeCanAccessRepo({owner, repo, gitHubAccessToken})

  let languageDatas

  if (baseLanguageFilePath) {
    //OK, were given a specific path, so we'll only search there

    const dir = getParentOfFile(baseLanguageFilePath)
    languageDatas = getLanguageDatasInDir({owner, repo, dir, gitHubAccessToken})

  } else {

    //We were not given a specific path, so we'll loop through
    //each plugin and search their typical locale paths
    const plugins = getPlugins()
    for (let i = 0; i < plugins.length; ++i) {
      const plugin = plugins[i]

      //Let's see where this plugin normally searches for locale files
      let dirs = plugin.getTypicalLocalePaths()
      for (let j = 0; j < dirs.length; ++j) {
        const dir = dirs[j]
        //Let's see if we could parse this dir with this plugin
        languageDatas = tryToGetLanguageDatasForDirAndPlugin({owner, repo, dir, plugin, languageCodes, gitHubAccessToken})
        if (languageDatas && languageDatas.length > 0) {
          //We got languageDatas! No need to continue looping to the next dir
          break
        }
        //No languageDatas found, so let's loop to the next dir
      }
      if (languageDatas && languageDatas.length > 0) {
        //We got languageDatas! No need to continue looping to the next plugin
        break
      }
      //No languageDatas found, so let's loop to the next plugins
    }
  }
  if (!languageDatas || languageDatas.length == 0) {
    console.log("Strange, languageInfos is empty!")
  }
  return languageDatas
}

/**
 * 
 * @param plugin if given we'll use that plugin, otherwise we'll try all plugins
 * 
 * Throws Meteor.Error cantFindWorkingPlugin if no plugin could be found that could parse that file.
 */
export function getLanguageDataFromPath({owner, repo, path, plugin = null, gitHubAccessToken}) {
  check(owner, String)
  check(repo, String)
  check(path, String)
  check(plugin, Match.Maybe(Object))
  check(gitHubAccessToken, Match.Maybe(String))

  assertThatWeCanAccessRepo({owner, repo, gitHubAccessToken})

  //First load the file contents

  const gitHubFile = callGitHub({owner, repo, command: "contents/" + path, gitHubAccessToken})
  console.log("Downloading " + gitHubFile.download_url)
  const fileContents = getHttpFileContents(gitHubFile.download_url)

  console.log("fileContents", fileContents)
  console.log("file contents type", typeof fileContents)

  const fileName = removeParentsFromPath(path)

  let plugins 
  if (plugin) {
    plugins = [plugin]
  } else {
    plugins = getPlugins()
  }
  
  for (let i = 0; i < plugins.length; ++i) {
    const plugin = plugins[i]
    try {
      plugin.convertFileContentsToLanguageTexts(fileName, fileContents) //Don't need the result, just checking if it works.

      const languageData = tryToCreateLanguageDataFromFileContents({owner, repo, plugin, gitHubFile, fileContents, gitHubAccessToken})
      if (languageData) {
        return languageData
      }
    } catch (err) {
      maybeLogError("(ignore) Couldn't parse " + path + " using " + plugin.getName(), err)
    }
  }
  if (plugin) {
    throw new Meteor.Error("cantFindWorkingPlugin", "I couldn't parse " + path + " using plugin " + plugin.getName())
  } else {
    throw new Meteor.Error("cantFindWorkingPlugin", "I couldn't parse " + path + " using any plugin")
  }
}

export function getReviewData({fromOwner, toOwner, repo, fromPath, toPath, fileFormat, gitHubAccessToken}) {
  console.log("getReviewData", arguments[0])
  const plugin = getPluginByName(fileFormat)
  const fromLanguageData = getLanguageDataFromPath({owner: fromOwner, repo, path: fromPath, plugin, gitHubAccessToken})
  const toLanguageData = getLanguageDataFromPath({owner: toOwner, repo, path: toPath, plugin, gitHubAccessToken})
  return {
    fromLanguage: fromLanguageData,
    toLanguage: toLanguageData
  }
}


/*
 Returns:
 {
   commitUrl: //github url to the commit
   pullRequestUrl: //github url to the pull request, if a pull request was done
   pullRequestAlreadyExisted: true
   reviewUrl: //link to where the translation can be reviewed on translateme
   log: [
     "Forked the repo",
     "Created a commit",
     "Sent a pull request"
   ]
 }

 */
export function submitTranslation({owner, repo, fileFormat, fromLanguageFile, toLanguageCode, texts, commitComment, gitHubAccessToken}) {
  console.log("submitTranslation", owner, repo, fileFormat, fromLanguageFile, toLanguageCode, texts, commitComment, gitHubAccessToken)
  const currentGitUser = getGitUser(gitHubAccessToken)

  const result = {
    log: []
  }

  let isForkNeeded = true
  if (owner == currentGitUser) {
    isForkNeeded = false
  }
  //TODO check if the current user can commit directly to the given repo

  const plugin = getPluginByName(fileFormat)
  const fileName = plugin.getFileNameForLanguage(toLanguageCode)
  const fileContent = plugin.convertLanguageTextsToFileContents(fileName, texts)

  const translatedFilePath = getRelativeString(fromLanguageFile, fileName)
  console.log("translatedFilePath", translatedFilePath)
  //console.log("translatedFilePath", translatedFilePath)

  const reviewUrl = Meteor.absoluteUrl(
    "review" +
    "?fromOwner=" + owner +
    "&toOwner=" + currentGitUser +
    "&repo=" + repo +
    "&fromPath=" + encodeURIComponent(fromLanguageFile) +
    "&toPath=" + encodeURIComponent(translatedFilePath) +
    "&fileFormat=" + fileFormat
  )
  result.reviewUrl = reviewUrl

  const commitMessageWithReviewLink =
    commitComment + "\nReview the translation at:\n" + reviewUrl




  if (isForkNeeded) {
    //Fork the repo to the current github user's account
    console.log("Forking repo")
    forkRepo({owner, repo, gitHubAccessToken})
    result.log.push("Forked the repo from " + owner + "/" + repo + " to " + currentGitUser + "/" + repo)

    //Commit the translation file to the forked repo
    console.log("Committing to the fork")

    result.commitUrl = commitFile({owner: currentGitUser, repo, filePath: translatedFilePath, fileContent, commitMessage: commitMessageWithReviewLink, gitHubAccessToken})
    result.log.push("Committed the translation file to " + currentGitUser + "/" + repo)

    //Send a pull request, if needed
    console.log("Checking if pull request already exists")
    result.pullRequestUrl = getUrlToExistingPullRequest({currentGitUser, owner, repo, gitHubAccessToken})
    if (result.pullRequestUrl) {
      console.log("Pull request already exists")
      result.log.push("Pull request already exists on " + owner + "/" + repo)
      result.pullRequestAlreadyExisted = true
    } else {
      console.log("No existing pull request. Submitting a pull request.")
      const pullRequestComment = "Translation from " + currentGitUser + " (via TranslateMe service)"
      result.pullRequestUrl = createPullRequest({currentGitUser, owner, repo, comment: pullRequestComment, gitHubAccessToken})
      result.log.push("Submitted a pull request on " + owner + "/" + repo)
    }


  } else {
    //Commit the translation file directly to the owner's repo
    console.log("Committing directly to the repo")
    const commitSha = commitFile({owner, repo, filePath: translatedFilePath, fileContent, commitMessage: commitMessageWithReviewLink, gitHubAccessToken})
    result.log.push("Committed the translation file to " + owner + "/" + repo)
    result.commitUrl = "https://github.com/" + currentGitUser + "/" + repo + "/commit/" + commitSha
  }

  console.log("Returning", result)
  return result
}




//============ EXPORTS ABOVE ======================================================
//============ PRIVATE FUNCTIONS BELOW ============================================






/**
 * Returns an array of languageDatas for the given dir that were parseable by the given plugin.
 * Returns null if the dir didn't exist.
 * Returns empty array if the dir exists, but none of the files in it were parseable by the given plugin
 * @languageCodes array of language codes to include, or null to include all
 */
function tryToGetLanguageDatasForDirAndPlugin({owner, repo, dir, plugin, languageCodes, gitHubAccessToken}) {
  maybeLog("tryToGetLanguageDatasForDirAndPlugin", owner, repo, dir, plugin.getName(), languageCodes, gitHubAccessToken)
  check(dir, String)
  check(plugin, Object)

  const gitHubFiles = tryToGetGitHubDirContents({owner, repo, dir, gitHubAccessToken})

  if (gitHubFiles) {
    //OK this was a valid dir.

    //Let's parse them all (or as many as possible) into LanguageDatas.
    let languageDatas = []
    gitHubFiles.forEach((gitHubFile) => {
      const languageCode = plugin.getLanguageOfFile(gitHubFile.path)

      if (!languageCodes || languageCodes.includes(languageCode)) {
        const fileContents = getHttpFileContents(gitHubFile.download_url)
        let languageData = tryToCreateLanguageDataFromFileContents({owner, repo, plugin, gitHubFile, fileContents, gitHubAccessToken})
        if (languageData) {
          maybeLog("Found a languageData with " + languageData.textCount + " texts", languageData)
          languageDatas.push(languageData)
        } else {
          maybeLog("Didn't find a languageData here")
        }
      } else {
        maybeLog("Ignoring " + gitHubFile.path + ", because " + languageCode + " is not included in " + languageCodes)
      }

    })
    maybeLog("Returning " + languageDatas.length + " languageDatas")
    return languageDatas
  } else {
    //The dir couldn't be found. Return null.
    return null
  }
}

/**
 * Returns a LanguageData for each parseable file in the given dir.
 * For every file in there, tries all the different plugins until it finds one that can parse the file.
 *
 */
function getLanguageDatasInDir({owner, repo, dir, gitHubAccessToken}) {
  maybeLog("getLanguageDatasInDir", owner, repo, dir)

  let languageDatas = []

  const gitHubFiles = tryToGetGitHubDirContents({owner, repo, dir, gitHubAccessToken})

  if (gitHubFiles) {
    //OK we found the contents of the dir.
    //Let's loop through each file and see if we can parse it.

    const plugins = getPlugins()
    gitHubFiles.forEach((gitHubFile) => {

      //download the file
      const fileContents = getHttpFileContents(gitHubFile.download_url)

      //Loop through the plugins, stop when we find the first plugin that can parse this file.
      for (let i = 0; i < plugins.length; ++i) {
        const plugin = plugins[i]
        let languageData = tryToCreateLanguageDataFromFileContents({owner, repo, plugin, gitHubFile, fileContents, gitHubAccessToken})
        if (languageData) {
          //Ah, great, we could parse it. We are done with this file, so let's stop looping through plugins.
          languageDatas.push(languageData)
          break
        }
      }
    })
  } else {
    log("Strange, I was given path " + dir + " for " + owner + "/" + repo + ", but I can't open it in github")
  }
  return languageDatas
}


/**
 * Creates a LanguageData that represents the given gitHub file.
 *
 * If something goes wrong, throws Meteor.Error with codes:
 *    - cantFindRepo
      - cantParseFileName
      - cantParseFileContents
 *
 * @param plugin the plugin to use to parse the file
 * @param gitHubFile for example the response from https://api.github.com/repos/hkniberg/dingoblat/contents/i18n/en.i18n.json
 */
function createLanguageDataFromFileContents({owner, repo, plugin, gitHubFile, fileContents, gitHubAccessToken}) {
  maybeLog("createLanguageDataFromFileContents", owner, repo, plugin.getName(), gitHubFile.path, "File of length " + fileContents.length)

  //Let's see if we recognize the language from the file name
  let languageCode
  try {
    languageCode = plugin.getLanguageOfFile(gitHubFile.name)
  } catch (err) {
    //Darn, couldn't recognize the file name. Bail out.
    throw new Meteor.Error("cantParseFileName", "Plugin " + plugin.getName() + " couldn't figure out the language from filename " + gitHubFile.name, err)
  }

  //Good! We know which language this is!
  //Now let's see if we can parse the content
  let texts
  try {
    texts = plugin.convertFileContentsToLanguageTexts(gitHubFile.path, fileContents)
    if (texts == null || texts.length == 0) {
      maybeLog("(ignoring) Plugin " + plugin.getName() + " couldn't find any language texts in " + gitHubFile.name)
      return null
    }
  } catch (err) {
    //Darn, couldn't parse the text. Bail out.
    throw new Meteor.Error("cantParseFileContents", "Plugin " + plugin.getName() + " couldn't understand the contents of " + gitHubFile.name, err)
  }

  //Yay, found a locale file that is parseable!
  const filePath = gitHubFile.path
  const dates = getDatesOfGitHubFile({owner, repo, filePath, gitHubAccessToken})
  const languageData = {
    languageCode: languageCode,
    languageName: getLanguageName(languageCode),
    path: filePath,
    downloadUrl: gitHubFile.download_url,
    fileFormat: plugin.getName(),
    modifiedDate: dates.newest,
    createdDate: dates.oldest,
    texts: texts,
    textCount: Object.getOwnPropertyNames(texts).length
  }
  return languageData
}

/**
 * Creates a LanguageData that represents the given gitHub file.
 *
 * Returns null if the fileName or contents aren't recognized by the given plugin.
 *
 *
 * @param plugin the plugin to use to parse the file
 * @param gitHubFile for example the response from https://api.github.com/repos/hkniberg/dingoblat/contents/i18n/en.i18n.json
 */
function tryToCreateLanguageDataFromFileContents({owner, repo, plugin, gitHubFile, fileContents, gitHubAccessToken}) {
  maybeLog("tryToCreateLanguageData", owner, repo, plugin.getName(), gitHubFile.path, "File of length " + fileContents.length)

  try {
    return createLanguageDataFromFileContents(arguments[0])
  } catch (err) {
    if (err.error == "cantFindRepo" || err.error == "cantParseFileName" || err.error == "cantParseFileContents") {
      maybeLogError("Couldn't create languageData from " + owner + "/" + repo + " with plugin " + plugin.getName() + " and path " + gitHubFile.path, err)
    } else {
      throw err
    }
  }
}

/*
 Returns a URL to the pull request
 */
function createPullRequest({currentGitUser, owner, repo, comment, gitHubAccessToken}) {
  const head = currentGitUser + ":master"

  const params = {
    title: comment,
    base: "master",
    head: head,
    body: comment
  }
  const result = callGitHub({owner, repo, command: "pulls", gitHubAccessToken, method: "POST", params})
  return result.html_url
}



export function requestGitHubAccessToken(code) {
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



function tryToGetGitHubDirContents({owner, repo, dir, gitHubAccessToken}) {
  check(dir, String)

  try {
    const command = "contents/" + dir
    return callGitHub({owner, repo, command, gitHubAccessToken})
  } catch (err) {
    maybeLogError("(ignoring) Couldn't load gitHub dir " + dir, err)
    return null
  }
}

/*
 Throws Meteor.Error("parseError") if it can't parse a file.
 */
export function _getLanguageDatas(owner, repo, fromLanguageInfo, toLanguageCode, gitHubAccessToken) {
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
    fromLanguage: _getLanguageDataFromLanguageInfo(fromLanguageInfo, gitHubAccessToken),
    toLanguage: toLanguageData
  }
}


/*
 Throws Meteor.Error("parseError") if it can't parse the file.
 */
function _getLanguageDataFromLanguageInfo(languageInfo, gitHubAccessToken) {
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


/**
 * Throws Meteor.Error("notFound") if we can't access the repo with the given token
 */
function assertThatWeCanAccessRepo({owner, repo, gitHubAccessToken}) {
  if (!canAccessRepo({owner, repo, gitHubAccessToken})) {
    if (gitHubAccessToken) {
      throw new Meteor.Error("notFound", "Can't access " + owner + "/" + repo + ", even though I have a github access token " + gitHubAccessToken)
    } else {
      throw new Meteor.Error("notFound", "Can't access " + owner + "/" + repo + ". Wasn't given a github access token from the user, so maybe the repo is private.")
    }
  }
}


function assert(test, errorKey, errorDescription) {
  if (!test) {
    console.log("Assert failed! Throwing " + errorKey, errorDescription)
    throw new Meteor.Error(errorKey, errorDescription)
  }
}

function maybeLogError(message, err) {
  maybeLog(message)
  if (err && logAllStackTraces) {
    log(err)
  }
}

function maybeLog() {
  if (trace) {
    console.log.apply(null, arguments)
  }
}