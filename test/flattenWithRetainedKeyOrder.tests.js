//NOTE: We're using our own patched version of the standard "flat" package.
//because we need to guarantee the ordering.
const flatten = require('./../lib/flattenWithRetainedKeyOrder')
const unflatten = flatten.unflatten

const expect = require('chai').expect


describe('flatten', function() {
  it('test1', function() {
    testFlatUnflat({a: "a"})
  })

  it('test2', function() {
    testFlatUnflat({
      b: 2,
      a: 1
    })
  })

  it('test3', function() {
    testFlatUnflat({
      b: {c: "c"},
      a: 1
    })
  })

  it('test4', function() {
    testFlatUnflat({
      "goclimateneutral_org":"GoClimateNeutral.org",
      "welcome_to_a_climate_neutral_life":"Velkommen til et klima-neutralt liv!",
      "settings":"Indstillinger",
      "ok_i_want_to_know_more":"Ok, skriv mig op!"
    })
  })

  it('test5', function() {
    testUnflatFlat({
      "a.b.c": "abc",
      "a.b.d": "abd",
      "y": "y",
      "x": "x",
      "m.g": "mg"
    })
  })
})

function testFlatUnflat(a) {
  const aFlat = flatten(a)
  const aUnflat = unflatten(aFlat)

  const aString = JSON.stringify(a)
  const aFlatString = JSON.stringify(aFlat)
  const aUnflatString = JSON.stringify(aUnflat)

  //console.log("aString", aString)
  //console.log("aFlatString", aFlatString)
  //console.log("aUnflatString", aUnflatString)

  expect(aString).to.equal(aUnflatString)

}

function testUnflatFlat(a) {
  const aUnflat = unflatten(a)
  const aFlat = flatten(aUnflat)

  const aString = JSON.stringify(a)
  const aUnflatString = JSON.stringify(aUnflat)
  const aFlatString = JSON.stringify(aFlat)

  //console.log("aString", aString)
  //console.log("aUnflatString", aUnflatString)
  //console.log("aFlatString", aFlatString)

  expect(aString).to.equal(aFlatString)

}
