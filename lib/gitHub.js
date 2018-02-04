import {getEnvVariable} from "./serverUtil"
const querystring = require('querystring')


const log = console.log
const logAllStackTraces = false
const trace = true

export function forkRepo({owner, repo, gitHubAccessToken}) {
  check(owner, String)
  check(repo, String)
  check(gitHubAccessToken, String)

  callGitHub({owner, repo, command: "forks", gitHubAccessToken, method: "POST"})
}

/*
Returns two dates: {newest: ..., oldest: ...}
 */
export function getDatesOfGitHubFile({owner, repo, filePath, gitHubAccessToken}) {
  const params = {
    path: filePath
  }
  const result = callGitHub({owner, repo, command: "commits", gitHubAccessToken, method: "GET", params})
  if (result && result.length) {
    const newest = result[0].commit.committer.date
    const oldest = result[result.length - 1].commit.committer.date
    return {newest, oldest}
  } else {
    return null
  }
}



export function getGitUser(gitHubAccessToken) {
  check(gitHubAccessToken, String)

  const url = "https://api.github.com/user?access_token=" + gitHubAccessToken

  try {
    maybeLog("Calling " + url)
    const response = HTTP.call("GET", url, {headers: {"User-Agent": "translateme"}})
    maybeLog("Done! Got status code " + response.statusCode)
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
 Adds or updates the given file in the given repo
 Returns the commit SHA.
 */
export function commitFile({owner, repo, filePath, fileContent, commitMessage, gitHubAccessToken}) {
  maybeLog("commitFile", arguments[0])

  check(owner, String)
  check(repo, String)
  check(filePath, String)
  check(fileContent, String)
  check(commitMessage, String)
  check(gitHubAccessToken, String)

  //console.log("commitFile", owner, repo, filePath, fileContents, commitMessage, gitHubAccessToken)
  // The steps below are from this tutorial:
  // http://www.levibotelho.com/development/commit-a-file-with-the-github-api/

  let result

  //Get a reference to HEAD
  result = callGitHub({owner, repo, command: "git/refs/heads/master", gitHubAccessToken, method: "GET"})
  const sha = result.object.sha

  //Grab the commit that HEAD points to
  result = callGitHub({owner, repo, command: "git/commits/" + sha, gitHubAccessToken, method: "GET"})
  const lastCommitSha = result.sha
  const treeSha = result.tree.sha

  console.log("filePath", filePath)

  console.log("fileContent", fileContent)

  //Create a tree containing the new file
  const createTreeParams = {
    "base_tree": treeSha,
    "tree": [
      {
        "path": filePath,
        "mode": "100644",
        "type": "blob",
        "content": fileContent
      }
    ]
  }
  result = callGitHub({owner, repo, command: "git/trees", gitHubAccessToken, method: "POST", params: createTreeParams})
  const newTreeSha = result.sha

  //6. Create a new commit
  const commitPayload = {
    "message": commitMessage,	// Your commit message.
    "parents": [lastCommitSha],	// Array of SHAs. Usually contains just one SHA.
    "tree": newTreeSha		// SHA of the tree.
  }
  console.log("commit payload", commitPayload)
  result = callGitHub({owner, repo, command: "git/commits", gitHubAccessToken, method: "POST", params: commitPayload})
  const newCommitSha = result.sha

  //7. Update HEAD
  result = callGitHub({owner, repo, command: "git/refs/heads/master", gitHubAccessToken, method: "PATCH", params: {sha: newCommitSha}})

  return result.object.sha
}




export function canAccessRepo({owner, repo, gitHubAccessToken}) {
  try {
    callGitHub({owner, repo, command: "", gitHubAccessToken})
    return true
  } catch (err) {
    if (err.error == "notFound") {
      return false
    } else {
      throw err
    }
  }
}



export function getUrlToExistingPullRequest({currentGitUser, owner, repo, gitHubAccessToken}) {
  check(currentGitUser, String)
  check(owner, String)
  check(repo, String)
  check(gitHubAccessToken, Match.Maybe(String))
  
  const head = currentGitUser + ":master"

  let result = callGitHub({owner, repo, command: "pulls", gitHubAccessToken, method: "GET", params: {head: head}})
  if (result.length > 0) {
    //Oh, a pull request already exists. Let's return that one.
    return result[0].html_url
  } else {
    return null
  }
}


/**
 * Throw Meteor.Error("notFound") if not found
 */
export function getHttpFileContents(url) {
  check(url, String)
  try {
    const response = HTTP.call("GET", url, {headers: {"User-Agent": "translateme"}})
    assert(response.statusCode == 200, "Oh no! Got http status code " + response.statusCode)
    const content = response.content
    assert(content, "No content in the http response from " + url)
    return content
  } catch (error) {
    if (error.response && error.response.statusCode == 404) {
      //This is a "normal" case for example when trying to talk to a private repo.
      maybeLogError("Got HTTP error code 404 from " + url, error)
      throw new Meteor.Error("notFound", "Got HTTP error code 404 from " + url)
    } else {
      log("Got error from " + url, error)
      throw error
    }
  }
}



/*
 Throws Meteor.Error if GIT API returns an error.
 The error code "notFound" means we got a 404
 Otherwise we use error code "gitHubError"

 */
export function callGitHub({owner, repo, command, gitHubAccessToken, method = "GET", params = {}}) {
  maybeLog("callGitHub", arguments[0])
  check(owner, String)
  check(repo, String)
  check(command, String)
  check(gitHubAccessToken, Match.Maybe(String))
  check(method, String)
  check(params, Match.Maybe(Object))

  let url = "https://api.github.com/repos/" + owner + "/" + repo

  if (command) {
    url = url + "/" + command
  }

  if (gitHubAccessToken) {
    params.access_token = gitHubAccessToken
    //query = "access_token=" + gitHubAccessToken
  } else {
    params.client_id = getEnvVariable("defaultClientId")
    params.client_secret = getEnvVariable("defaultClientSecret")
  }
  const queryString = querystring.stringify(params)

  try {
    maybeLog("Calling " + method + " to " + url + " with query ", queryString)
    const response = HTTP.call(method, url, {headers: {"User-Agent": "translateme"}, query: queryString, content: JSON.stringify(params)})
    maybeLog("Done! Got status code " + response.statusCode)
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Meteor.Error("gitHubError", "Got http status code " + response.statusCode + " from github!")
    }
    return response.data

  } catch (err) {
    if (err.response && err.response.statusCode && err.response.statusCode == 404) {
      maybeLog("Got 404. Will return gitHubError..")
      throw new Meteor.Error("notFound", err.message)
    } else {
      log("error.response", err.response)
      throw new Meteor.Error("gitHubError", err.message)
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
  if (err) {
    if (logAllStackTraces) {
      console.log(message, err)
    }
  } else {
    if (trace) {
      console.log(message)
    }
  }
}

function maybeLog() {
  if (trace) {
    console.log("\n")
    console.log.apply(null, arguments)
  }
}