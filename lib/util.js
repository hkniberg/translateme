
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
  const lastSlash = path1.lastIndexOf('/') == -1
  if (lastSlash == -1) {
    //There is no slash. Replace the whole string
    return file2
  } else {
    //There is a slash. Replace the part after the last slash.
    const parent = path1.substr(0, lastSlash)
    return parent + "/" + file2
  }
}
