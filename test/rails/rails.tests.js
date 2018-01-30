import {testFileName} from "../testHelpers";
import {testFileParsing} from "../testHelpers";

describe('rails', function() {

  it('fileName', function () {
    testFileName('rails', 'en', 'en.yml')
    testFileName('rails', 'en', 'config/locales/en.yml')
  })

  it('parsing', function () {
    testFileParsing('rails')
  })

})

