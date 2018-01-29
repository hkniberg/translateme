
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

