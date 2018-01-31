const fs = require('fs')
const path = require('path')

/*
Parses something like:
https://github.com/hkniberg/dingoblat/blob/master/i18n/en.i18n.json
...or 
 https://github.com/hkniberg/dingoblat

and returns something like:
{
  owner: hkniberg
  repo: dingoblat
  path: i18n/en.i18n.json (if available)
}
or null if the url can't be parsed
 */
export function parseGitUrl(gitUrl) {
  const regexp1 = /(.*)github\.com\/([^\/]*)\/([^\/]*)\/blob\/master\/(.*)/
  const regexp2 = /(.*)github\.com\/([^\/]*)\/([^\/]*)/

  let match = gitUrl.match(regexp1)
  if (match) {
    const owner = match[2]
    const repo = match[3]
    const path = match[4]
    return {owner, repo, path}
  }

  match = gitUrl.match(regexp2)
  if (match) {
      const owner = match[2]
      const repo = match[3]
      return {owner, repo}
  }

  return null
}

export function getRelativeString(path1, file2) {
  return path.join(path1, "..", file2)
}

export function removeParentsFromPath(path) {
  const lastSlash = path.lastIndexOf('/')
  if (lastSlash > -1) {
    return path.substring(lastSlash + 1)
  } else {
    return path
  }
}

export function getParentOfFile(file) {
  return path.join(file, "..")
}