import {testFileName} from "../testHelpers";
import {testFileParsing} from "../testHelpers";

describe('meteorTap', function() {

  it('fileName', function () {
    testFileName('meteorTap', 'en', 'en.i18n.json')
  })

  it('parsing', function () {
    testFileParsing('meteorTap')
  })

})

