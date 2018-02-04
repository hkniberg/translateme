
import {getGitHubAccessToken} from "./../authentication";
import {setLanguageDataInSession} from "../session";
import {loadLanguageDataFromLocalStorage} from "../session";
import {triggerGoogleTranslationIfNeeded} from "../helpers";
import {session} from "../session"
import {getAllLanguages} from "../../lib/data/languages";
import {getLanguageName} from "../../lib/data/languages";

//TODO remove
//const languageInfosVar = new ReactiveVar()

const selectedLanguageCodeVar = new ReactiveVar()
const repoNotFoundVar = new ReactiveVar()
const parseErrorVar = new ReactiveVar(false)
const parseErrorLanguageInfoVar = new ReactiveVar(null)

const showFormVar = new ReactiveVar(false)

const fromLanguageCodeVar = new ReactiveVar()
const toLanguageCodeVar = new ReactiveVar()

/*
Expects data:
- owner
- repo

Optional data:
- baseLanguagePath = the path to the locale file that we should use as fromLanguage
 */
Template.languages.onRendered(function() {
  session.clearError("languages")
})

Template.languages.helpers({
  languageTileData() {
    const languageData = Template.currentData()
    const data = Template.parentData()
    const languageDatas = session.getLanguageDatas(data.owner, data.repo)
    return {
      languageData: languageData,
      maxTextCount: getMaxTextCount(languageDatas)
    }
  },

  showForm() {
    return showFormVar.get()
  },

  fromLanguageSelected() {
    const languageData = this
    const data = Template.parentData()
    if (isSame(languageData.languageCode, getFromLanguageCode(data))) {
      return "selected"
    }
  },

  toLanguageSelected() {
    const languageData = this
    if (isSame(languageData.languageCode, toLanguageCodeVar.get())) {
      return "selected"
    }
  },
  
  toLanguageCode() {
    return toLanguageCodeVar.get()
  },

  toLanguageName() {
    const toLanguageCode = toLanguageCodeVar.get()
    if (toLanguageCode) {
      return getLanguageName(toLanguageCode)
    }
  },

  editingExistingTranslation() {
    const data = Template.currentData()
    const toLanguageCode = toLanguageCodeVar.get()
    if (toLanguageCode) {
      if (session.getLanguageData(data.owner, data.repo, toLanguageCode)) {
        return true
      }
    }

  },

  baseLanguageName() {
    const baseLanguageInfo = getBaseLanguageInfo()
    if (baseLanguageInfo) {
      return baseLanguageInfo.languageName
    }
  },

  toLanguageDatas() {
    const data = Template.currentData()

    const allLanguages = getAllLanguages()
    allLanguages.unshift({languageCode: "", languageName: "--- pick one ---"})
    return allLanguages
  },

  hasMoreThanOneLanguage() {
    const data = Template.currentData()
    const languages = session.getLanguageDatas(data.owner, data.repo)
    return languages.length > 1
  },

  projectLanguagesExceptBase() {
    const data = Template.currentData()
    const projectLanguages = session.getLanguageDatas(data.owner, data.repo)
    const baseLanguageCode = baseLanguageCodeVar.get()
    if (baseLanguageCode) {
      return projectLanguages.filter((projectLanguage) => {
        return projectLanguage.languageCode != baseLanguageCode
      })
    } else {
      return projectLanguages
    }
  },

  createNewTranslationButtonDisabled() {
    console.log("toLanguageCodeVar", toLanguageCodeVar.get())
    if (!toLanguageCodeVar.get()) {
      return "disabled"
    }
  }
  
})


Template.languages.events({
  "click .createNewTranslationButton"(evt) {
    startTranslating()
  },

  "click .languageTile"(evt) {
    const languageCode = $(evt.currentTarget).data("languagecode")
    toLanguageCodeVar.set(languageCode)
    showFormVar.set(true)
  },

  "click .newLanguageTile"() {
    showFormVar.set(true)
  },

  "click .languageOverviewButton"() {
    showFormVar.set(false)
  },

  "change .fromLanguageCode"(evt) {
    const languageCode = $(evt.target).val()
    fromLanguageCodeVar.set(languageCode)
  },

  "change .toLanguageCode"(evt) {
    const languageCode = $(evt.target).val()
    toLanguageCodeVar.set(languageCode)
  }
})

function startTranslating() {
  const data = Template.currentData()

  const fromLanguageCode = getFromLanguageCode(data)
  const toLanguageCode = toLanguageCodeVar.get()
  if (fromLanguageCode && toLanguageCode) {
    Router.go('translate', {
      owner: data.owner,
      repo: data.repo,
      fromLanguageCode: fromLanguageCode,
      toLanguageCode: toLanguageCode
    })
  } else {
    console.log("Hey, fromLanguage and toLanguage need to be selected!", fromLanguageCode, toLanguageCode)
  }
}

function getMaxTextCount(languageDatas) {
  let max = 0
  languageDatas.forEach((languageData) => {
    max = Math.max(max, languageData.textCount)
  })
  return max
}

function getBaseLanguageInfo() {
  const data = Template.currentData()
  if (!data.baseLanguagePath) {
    return null
  }

  return languageInfosVar.get().find((languageInfo) => {
    return languageInfo.path == data.baseLanguagePath
  })
}

function isSame(a, b) {
  if (!a || !b) {
    return !a && !b
  } else {
    return a == b
  }
}

function isSameLanguage(languageData1, languageData2) {
  if (isEmptyLanguageData(languageData1) || isEmptyLanguageData(languageData2) ) {
    return isEmptyLanguageData(languageData1) && isEmptyLanguageData(languageData2)
  }

  return languageData1.languageCode == languageData2.languageCode
}

function isEmptyLanguageData(languageData) {
  return !languageData || !languageData.languageCode
}

/**
 * Returns the explicitely selected fromLanguageCode, or
 * the default fromLanguage if none has been selected.
 * Never returns null.
 */
function getFromLanguageCode({owner, repo, baseLanguagePath}) {
  const fromLanguageCode = fromLanguageCodeVar.get()
  if (fromLanguageCode) {
    return fromLanguageCode
  } else {
    return getDefaultFromLanguageCode({owner, repo, baseLanguagePath})
  }
}

function getDefaultFromLanguageCode({owner, repo, baseLanguagePath}) {
  const languageDatas = session.getLanguageDatas(owner, repo)
  if (baseLanguagePath) {
    //A base language has been explicitely set, so let's use that
    const baseLanguageData = languageDatas.find((languageData) => {
      return languageData.path == baseLanguagePath
    })
    if (baseLanguageData) {
      return baseLanguageData.languageCode
    } else {
      throw new Error("Strange, no language matching baseLanguagePath " + baseLanguagePath)
    }
  } else {
    //No base language was set. Let's filter the list down to those that are complete
    const completeLanguages = getCompleteLanguages(languageDatas)
    if (completeLanguages.length == 1) {
      //Ah, there's only 1! Return that one.
      return completeLanguages[0].languageCode
    } else {
      //There's more than one. Returns the oldest one.
      return getOldestLanguage(languageDatas).languageCode
    }
  }
}

/**
 * Returns the subset of the given languages that are "complete" (i.e. have the max number of texts)
 */
function getCompleteLanguages(languageDatas) {
  const max = getMaxTextCount(languageDatas)
  return languageDatas.filter((languageData) => {
    return languageData.textCount == max
  })
}

/**
 * Returns the language with the oldest createdDate
 */
function getOldestLanguage(languageDatas) {
  let oldest = null
  languageDatas.forEach((languageData) => {
    if (!oldest || (languageData.createdDate < oldest.createdDate)) {
      oldest = languageData
    }
  })
  return oldest
}


