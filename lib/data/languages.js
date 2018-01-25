export const rightToLeftLanguages = ["he", "ar", "fa", "ur", "yi"] //TODO add all RTL languages

export const specialLanguages = [
  ["dalmal", "Dalmål"],
  ["sindarin", "Sindarin (Elvish)"],
  ["klingon", "Klingon"],
  ["dothraki", "Dothraki"],
  ["navi", "Na’vi"],
  ["lolcat", "LOLcat"]
]

export function isRightToLeftLanguageCode(languageCode) {
  return rightToLeftLanguages.includes(languageCode)
}

/*
Returns something like:
[
  {languageCode: "en", languageName: "English"},
  {languageCode: "sv", languageName: "Swedish"},
  ...
]
 */
export function getAllLanguages() {
  const pairs = ISOLanguages.getNamePairs().concat(specialLanguages)
  const languages = []
  pairs.forEach((pair) => {
    languages.push({
      languageCode: pair[0],
      languageName: pair[1]
    })
  })
  return languages.sort((a, b) => {
    return a.languageName.localeCompare(b.languageName)
  })
}

export function getLanguageName(languageCode) {
  console.assert(languageCode, "languageCode must be given!")

  let languageName
  specialLanguages.forEach((language) => {
    if (language[0] == languageCode) {
      languageName = language[1]
    }
  })
  if (languageName) {
    return languageName
  }
  return ISOLanguages.getName(languageCode)
}