const util = require('../lib/util.js')
const expect = require('chai').expect


describe('util', function() {
  it('getRelativeString', function() {
    expect(util.getRelativeString('hi', 'there')).to.equal('there')
    expect(util.getRelativeString('dir/stuff.txt', 'this.txt')).to.equal('dir/this.txt')
    expect(util.getRelativeString('/dir/stuff.txt', 'this.txt')).to.equal('/dir/this.txt')
  })

  it('parseGitUrlWithPath', function() {
    const url = "https://github.com/hkniberg/dingoblat/blob/master/i18n/en.i18n.json"
    expect(util.parseGitUrl(url)).to.deep.equal({
      owner: "hkniberg",
      repo: "dingoblat",
      path: "i18n/en.i18n.json"
    })
  })

  it('parseGitUrlWithoutPath', function() {
    const url = "https://github.com/hkniberg/dingoblat"
    expect(util.parseGitUrl(url)).to.deep.equal({
      owner: "hkniberg",
      repo: "dingoblat"
    })
  })

})