const fs = require('fs')
const path = require('path')

/*
Returns:
{
  owner: ...
  repo: ....
}
 */
export function parseGitUrl(gitUrl) {
  const regexp = /(.*)github\.com\/([^\/]*)\/([^\/]*)/
  const match = gitUrl.match(regexp)
  const owner = match[2]
  const repo = match[3]
  return {owner, repo}
}

export function getRelativeString(path1, file2) {
  return path.join(path1, "..", file2)
}
