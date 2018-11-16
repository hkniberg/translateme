import {Session} from "meteor/session"
import {storage} from "./storage"
import {mergeLanguageTexts} from "../lib/merger";

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
    check(owner, String)
    check(repo, String)
    check(languageCode, String)
    check(texts, Object)

    Session.set("editedTexts-" + owner + "-" + repo + "-" + languageCode, texts)
    storage.saveTexts(owner, repo, languageCode, texts)
  },

  setEditedText(owner, repo, languageCode, key, text) {
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
      delete editedTexts[key]
    } else {
      if (!text || text.trim() == "") {
        editedTexts[key] = ""
      } else {
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
    if (texts) {
      Session.set("editedTexts-" + owner + "-" + repo + "-" + languageCode, texts)
      return true
    } else {
      return false
    }
  },

  /**
   * Checks if we have data for the given language codes.
   * If no specific language codes were given, we'll check if we have
   * data for any language codes.
   */
  hasLanguageDatas(owner, repo, languageCodes) {
    check(owner, String)
    check(repo, String)
    check(languageCodes, Match.Maybe([String]))

    if (languageCodes) {
      return languageCodes.every((languageCode) => {
        return this.hasLanguageData(owner, repo, languageCode)
      })
    } else {
      this.getLanguageDatas(owner, repo).length > 0
    }
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

  hasLanguageData(owner, repo, languageCode) {
    return !!this.getLanguageData(owner, repo, languageCode)
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

  getMergedTexts(owner, repo, fromLanguageCode, toLanguageCode) {
    const fromLanguageData = this.getLanguageData(owner, repo, fromLanguageCode)

    const toLanguageData = this.getLanguageData(owner, repo, toLanguageCode)
    let translatedTextsFromGitHub = {}
    if (toLanguageData) {
      translatedTextsFromGitHub = toLanguageData.texts
    }

    let locallyEditedTexts = this.getEditedTexts(owner, repo, toLanguageCode)

    //console.log("\n==========================================\nWill merge")
    //console.log("base", fromLanguageData.texts)
    //console.log("saved", translatedTextsFromGitHub)
    //console.log("edited", locallyEditedTexts)

    const mergedTexts = mergeLanguageTexts(
      fromLanguageData.texts,
      translatedTextsFromGitHub,
      locallyEditedTexts
    )

    //console.log("mergedTexts", mergedTexts)
    //console.log("--------------------------------------------")

    return mergedTexts
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

