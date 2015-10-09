module.exports = function Card(value, kind, isTrump) {
    ///////////////////////////////////////////////////////////////////
    // value:
    //  6 = 0   J = 5
    //  7 = 1   Q = 6
    //  8 = 2   K = 7
    //  9 = 3   A = 8
    //  10 = 4
    //
    //kind:
    //heart = 0      club = 2
    //diamond = 1    spade = 3
    ///////////////////////////////////////////////////////////////////

    this.value = value;
    this.kind = kind;
    this.isTrump = isTrump;
}