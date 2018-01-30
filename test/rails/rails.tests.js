import {testFileName} from "../testHelpers";
import {testFileParsing} from "../testHelpers";

describe('rails', function() {

  it('fileName', function () {
    testFileName('rails', 'en', 'en.yml')
    testFileName('rails', 'en', 'config/locales/en.yml')
    testFileName('rails', null, 'config/locales/bla.en.yml')
  })

  it('parsing', function () {
    testFileParsing('rails')
  })

})

