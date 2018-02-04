const merger = require('../lib/merger.js')
const expect = require('chai').expect
const merge = merger.mergeLanguageTexts

describe('merger', function() {
  it('empty', function() {
    expect(merge(null, null, null)).to.deep.equal({})
  })

  it('onlyBase', function() {
    const base = {
      bla: "hi"
    }
    const saved = {
    }
    const edited = {
    }

    expect(merge(base, saved, edited)).to.deep.equal({
    })
  })

  it('onlySaved', function() {
    const base = {
    }
    const saved = {
      apple: "green"
    }
    const edited = {
    }

    expect(merge(base, saved, edited)).to.deep.equal({
    })
  })

  it('onlyBaseAndEdited', function() {
    const base = {
      first: "bob",
      last: "jackson"
    }
    const saved = {
    }
    const edited = {
      first: "lisa"
    }

    expect(merge(base, saved, edited)).to.deep.equal({
      first: "lisa"
    })
  })

  it('baseAndEdited', function() {
    const base = {
      apple: "blue"
    }
    const saved = {
    }
    const edited = {
      apple: "red"
    }

    expect(merge(base, saved, edited)).to.deep.equal({
      apple: "red"
    })
  })

  it('addOneText', function() {
    const base = {
      color: "red",
      age: "16",
      animal: "pig"
    }
    const saved = {
      color: "orange",
    }
    const edited = {
      animal: "cat"
    }

    expect(merge(base, saved, edited)).to.deep.equal({
      color: "orange",
      animal: "cat"
    })
  })

  it('removeOneText', function() {
    const base = {
      color: "red",
      age: "16",
      animal: "pig"
    }
    const saved = {
      color: "orange",
      age: "32"
    }
    const edited = {
      color: ""
    }

    expect(merge(base, saved, edited)).to.deep.equal({
      age: "32",
      color: ""
    })
  })

  it('keyOrder', function() {
    const base = {
      line1: "hi",
      line2: "there",
    }
    const saved = {
    }
    const edited = {
      line2: "y",
      line1: "x"
    }

    const expectedResult = {
      line1: "x",
      line2: "y"
    }
    //We need to compare strings, since we want to check that the
    //ordering is correct
    const expectedResultAsString = JSON.stringify(expectedResult)

    expect(JSON.stringify(merge(base, saved, edited))).to.equal(expectedResultAsString)
  })

})