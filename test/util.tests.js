const util = require('../lib/util.js')
const expect = require('chai').expect


describe('util', function() {
  it('getRelativeString', function() {
    expect(util.getRelativeString('hi', 'there')).to.equal('there')
    expect(util.getRelativeString('dir/stuff.txt', 'this.txt')).to.equal('dir/this.txt')
    expect(util.getRelativeString('/dir/stuff.txt', 'this.txt')).to.equal('/dir/this.txt')
  })

})