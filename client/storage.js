
export const storage = {
  saveTexts(owner, repo, languageCode, texts) {
    console.log("saveTexts", languageCode, texts)
    check(owner, String)
    check(repo, String)
    check(languageCode, String)
    check(texts, Object)
    
    window.localStorage.setItem("texts-" + owner + "-" + repo + "-" + languageCode, JSON.stringify(texts))
  },

  removeTexts(owner, repo, languageCode) {
    check(owner, String)
    check(repo, String)
    check(languageCode, String)

    console.log("removing storage item: " + "texts-" + owner + "-" + repo + "-" + languageCode )
    window.localStorage.removeItem("texts-" + owner + "-" + repo + "-" + languageCode)
  },

  loadTexts(owner, repo, languageCode) {
    console.log("loadTexts", languageCode)
    console.assert(owner, "owner is required")
    console.assert(repo, "repo is required")

    const textsString = window.localStorage.getItem("texts-" + owner + "-" + repo + "-" + languageCode)
    if (textsString) {
      console.log("...Loaded", JSON.parse(textsString))
      return JSON.parse(textsString)
    } else {
      console.log("...nothing to load")
      return null
    }
  }
}


