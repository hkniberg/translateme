/**
 * Creates a mergeLanguageTexts of three texts. Each text has format:
 * { intro: "Hi there", question: "Who are you?"}
 * 
 * Guiding principals:
 * - The merged texts should have the same key orders as in the base
 * - editedTexts texts override previously saved texts
 * - in the editedTexts texts, null/undefined means keep the original saved text
 * - in the editedTexts texts, empty string is an actual value which overrides the original saved text
 * 
 * See the unit text for examples.
 * 
 * @param baseTexts the language texts that we are translating from
 * @param savedTexts the previously existing translated version of the texts
 * @param editedTexts current changes to the translated version of the texts
 */
export function mergeLanguageTexts(baseTexts, savedTexts, editedTexts) {
  if (!baseTexts) {
    baseTexts = {}
  }
  if (!savedTexts) {
    savedTexts = {}
  }
  if (!editedTexts) {
    editedTexts = {}
  }

  const keys = Object.getOwnPropertyNames(baseTexts)

  //We want to create a mergedTexts object with the keys in the same order as the fromLanguage
  let mergedTexts = {}
  keys.forEach((key) => {
    const editedText = editedTexts[key]
    const savedText = savedTexts[key]
    if (editedText != null && editedText != undefined) {
      //Aha, there is an edit. We'll use that.
      mergedTexts[key] = editedText
    } else if (savedText != null && savedText != undefined) {
      //No edit. But there is a save. Use that.
      mergedTexts[key] = savedText
    } else {
      //There is no edit and no save. So omit this key.
    }
  })
  return mergedTexts
}