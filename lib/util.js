const fs = require('fs')
const path = require('path')

/*
Parses something like:
https://github.com/hkniberg/dingoblat/blob/master/i18n/en.i18n.json

and returns something like:
{
  owner: hkniberg
  repo: dingoblat
  path: i18n/en.i18n.json
}
 */
export function parseGitUrl(gitUrl) {
  const regexp = /(.*)github\.com\/([^\/]*)\/([^\/]*)\/blob\/master\/(.*)/
  const match = gitUrl.match(regexp)
  const owner = match[2]
  const repo = match[3]
  const path = match[4]
  return {owner, repo, path}
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