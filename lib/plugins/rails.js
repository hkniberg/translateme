const util = require("../util")
const yaml = require("node-yaml")

//NOTE: We're using our own patched version of the standard "flat" package.
//because we need to guarantee the ordering.
const flatten = require('../flattenWithRetainedKeyOrder')
const unflatten = flatten.unflatten

module.exports = {
  getName() {
    return "rails"
  },

  getDescription() {
    return "Rails with Ruby i18n gem"
  },

  getInfoUrl() {
    return "http://guides.rubyonrails.org/i18n.html"
  },

  getExampleUrl() {
    return null //TODO
  },

  getTypicalLocalePaths() {
    return [
      "rails/locale",
      "config/locales"
    ]
  },
  
  getLanguageOfFile(path) {
    const fileName = util.removeParentsFromPath(path)

    const regexp = /^(\w{2})\.yml/
    //Figure out if this file looks like "en.yml"
    const match = fileName.match(regexp)
    if (match) {
      return match[1]
    } else {
      return null
    }
  },

  getFileNameForLanguage(languageCode) {
    return languageCode + ".yml"
  },

  convertFileContentsToLanguageTexts(fileName, fileContentsAsString) {
    /*
      fileContents is something like:

      en:
        label1: hi
        label2: there
        faq:
          faq1: Who am I?
          faq2: Who are you?
     */
    const languageCode = this.getLanguageOfFile(fileName)

    //Let's parse it into an object
    const parsedFile =  yaml.parse(fileContentsAsString)

    //Then let's remove the top level, since that is the language code.
    const parsedFileWithoutLanguageCode = parsedFile[languageCode]

    //And flatten it
    //console.log("Before flatten", parsedFileWithoutLanguageCode)
    const languageTexts = flatten(parsedFileWithoutLanguageCode)
    //console.log("AFter flatten", languageTexts)

    /*
      We should now have:
      {
        label1: hi
        label2: there
        faq.faq1: Who am I?
        faq.faq2: Who are you?
      }
     */

    return languageTexts
  },

  convertLanguageTextsToFileContents(fileName, languageTexts) {
    const languageCode = this.getLanguageOfFile(fileName)
    //console.log("Before unflatten", JSON.stringify(languageTexts))
    const unflattened = unflatten(languageTexts)
    //console.log("After unflatten", JSON.stringify(unflattened))


    const unflattenedWithParent = {}
    unflattenedWithParent[languageCode] = unflattened

    const text = yaml.dump(unflattenedWithParent)
    return text
  }
}

