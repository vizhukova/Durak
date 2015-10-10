module.exports = function Card(value, kind, isTrump) {
///////////////////////////////////////////////////////////////////
    // value:
    //  A = 0   10 = 5
    //  6 = 1   J = 6
    //  7 = 2   Q = 7
    //  8 = 3   K = 8
    //  9 = 4
    //
    //kind:
    //diamond = 1      club = 0
    //heart = 2        spade = 3
    ///////////////////////////////////////////////////////////////////

    this.value = value;
    this.kind = kind;
    this.isTrump = isTrump;
}