import {Session} from "meteor/session"
import {storage} from "./storage"

export const session = {
  setLanguageData(owner, repo, languageCode, languageData) {
    check(owner, String)
    check(repo, String)
    check(languageCode, String)
    check(languageData, Match.Maybe(Object))

    if (languageData) {
      console.assert(languageData.languageCode == languageCode, "Hey, the given languageData doesn't match the given languageCode", languageCode, languageData)
      Session.set("languageData-" + owner + "-" + repo + "-" + languageCode, languageData)
    } else {
      Session.set("languageData-" + owner + "-" + repo + "-" + languageCode, null)
    }
  },

  removeLanguageDatas(owner, repo) {
    const languageCodes = Session.get("languageCodes-" + owner + "-" + repo)
    languageCodes.forEach((languageCode) => {
      this.setLanguageData(owner, repo, languageCode, null)
    })
    Session.set("languageCodes-" + owner + "-" + repo, null)
  },

  setLanguageDatas(owner, repo, languageDatas) {
    check(owner, String)
    check(repo, String)
    check(languageDatas, [Object])


    const languageCodes = []
    languageDatas.forEach((languageData) => {
      const languageCode = languageData.languageCode
      languageCodes.push(languageCode)
      this.setLanguageData(owner, repo, languageCode, languageData)
    })
    Session.set("languageCodes-" + owner + "-" + repo, languageCodes)
  },

  //Also saves to storage
  setEditedTexts(owner, repo, languageCode, texts) {
    console.log("setEditedTexts", languageCode, texts)
    console.log("setEditedTexts", texts)
    check(owner, String)
    check(repo, String)
    check(languageCode, String)
    check(texts, Object)

    Session.set("editedTexts-" + owner + "-" + repo + "-" + languageCode, texts)
    storage.saveTexts(owner, repo, languageCode, texts)
  },

  setEditedText(owner, repo, languageCode, key, text) {
    console.log("setEditedText", languageCode, key, text)
    check(owner, String)
    check(repo, String)
    check(languageCode, String)
    check(key, String)
    check(text, String)

    let editedTexts = this.getEditedTexts(owner, repo, languageCode)
    if (!editedTexts) {
      editedTexts = {}
    }

    const oldText = this.getLanguageText(owner, repo, languageCode, key)
    if (isSameText(text, oldText)) {
      console.log("Ah, edited text is same as original text. So I'll remove the edited text")
      delete editedTexts[key]
    } else {
      if (!text || text.trim() == "") {
        console.log("Setting edited text to empty string")
        editedTexts[key] = ""
      } else {
        console.log("Setting edited text to " + text)
        editedTexts[key] = text
      }
    }

    this.setEditedTexts(owner, repo, languageCode, editedTexts)
  },

  getEditedTexts(owner, repo, languageCode) {
    return Session.get("editedTexts-" + owner + "-" + repo + "-" + languageCode)
  },

  getEditedText(owner, repo, languageCode, key) {
    check(owner, String)
    check(repo, String)
    check(languageCode, String)
    check(key, String)

    const texts = this.getEditedTexts(owner, repo, languageCode)
    if (texts) {
      return texts[key]
    } else {
      return null
    }
  },

  //Returns true if there was something to load
  loadEditedTextsFromStorage(owner, repo, languageCode) {
    const texts = storage.loadTexts(owner, repo, languageCode)
    console.log("loadEditedTextsFromStorage", languageCode)
    console.log("loaded", texts)
    if (texts) {
      Session.set("editedTexts-" + owner + "-" + repo + "-" + languageCode, texts)
      return true
    } else {
      return false
    }
  },

  hasLanguageDatas(owner, repo) {
    return this.getLanguageDatas(owner, repo).length > 0    
  },
  
  // always returns an array
  getLanguageDatas(owner, repo) {
    check(owner, String)
    check(repo, String)

    const languageCodes = Session.get("languageCodes-" + owner + "-" + repo)
    if (!languageCodes) {
      return []
    }

    const languageDatas =  []
    languageCodes.forEach((languageCode) => {
      const languageData = this.getLanguageData(owner, repo, languageCode)
      if (languageData) {
        languageDatas.push(languageData)
      }
    })

    if (languageDatas && languageDatas.length > 0) {
      return languageDatas
    } else {
      return []
    }
  },

  getLanguageData(owner, repo, languageCode) {
    check(owner, String)
    check(repo, String)
    check(languageCode, String)

    return Session.get("languageData-" + owner + "-" + repo + "-" + languageCode)
  },

  getLanguageText(owner, repo, languageCode, key) {
    check(owner, String)
    check(repo, String)
    check(languageCode, String)
    check(key, String)

    const languageData = this.getLanguageData(owner, repo, languageCode)
    if (languageData) {
      return languageData.texts[key]
    } else {
      return null
    }
  },

  isLoadingLanguageData() {
    return !!Session.get("loadingLanguageData")
  },

  setLoadingLanguageData(isLoadingLanguageData) {
    Session.set("loadingLanguageData", isLoadingLanguageData)
  },
  
  getError(context) {
    return Session.get("error " + context)
  },

  setError(context, description, err) {
    console.log("setError called", description, err)
    if (err) {
      if (err.reason) {
        Session.set("error " + context, description + "\n\nReason: " + err.reason)
      } else {
        Session.set("error " + context, description + "\n\n" + err)
      }
    } else {
      Session.set("error " + context, description)
    }
  },

  clearError(context) {
    Session.set("error " + context, null)
  },

  isRepoNotFound() {
    return Session.get("repoNotFound")
  },

  setRepoNotFound(repoNotFound) {
    Session.set("repoNotFound", repoNotFound)
  },

  getMergedTexts(owner, repo, toLanguageCode) {
    console.log("getMergedTranslation")
  
    const toLanguageData = this.getLanguageData(owner, repo, toLanguageCode)
    console.log("toLanguageData", toLanguageData)
  
    let translatedTextsFromGitHub = {}
    if (toLanguageData) {
      translatedTextsFromGitHub = toLanguageData.texts
    }
    let locallyEditedTexts = this.getEditedTexts(owner, repo, toLanguageCode)
    if (!locallyEditedTexts) {
      locallyEditedTexts = {}
    }
  
    console.log("translatedTextsFromGitHub", translatedTextsFromGitHub)
    console.log("locallyEditedTexts", locallyEditedTexts)
  
    let mergedTexts = {}
    Object.assign(mergedTexts, translatedTextsFromGitHub)
    Object.assign(mergedTexts, locallyEditedTexts)

    console.log("mergedTexts", mergedTexts)

    const mergedTextsWithEmptyStringKeysRemoved = removeEmptyKeys(mergedTexts)

    console.log("mergedTextsWithEmptyStringKeysRemoved", mergedTextsWithEmptyStringKeysRemoved)
  
    return mergedTextsWithEmptyStringKeysRemoved
  }
}

function isSameText(text1, text2) {
  if (isEmptyText(text1) || isEmptyText(text2)) {
    return isEmptyText(text1) && isEmptyText(text2)
  } else {
    return text1.trim() == text2.trim()
  }
}

function isEmptyText(text) {
  return !text || text.trim() == ""
}

function removeEmptyKeys(texts) {
  const clone = {}
  Object.assign(clone, texts)


  const keys = Object.getOwnPropertyNames(clone)
  keys.forEach((key) => {
    const value = clone[key]
    if (isEmptyText(value)) {
      delete clone[key]
    }
  })
  return clone

}
