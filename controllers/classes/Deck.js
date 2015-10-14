var Card = require('./Card.js');

module.exports = function Deck() {
    this.deck = []
    this.trump;

    this.makeTrump = function() {
        var value = Math.round(Math.random() * 8);
        var kind  = Math.round(Math.random() * 3);
        return new Card(value, kind, true);
    }

    this.makeDeck = function() {
        var value = 0;
        var kind = 0;

        this.deck.push(this.trump)

        for(var i = 0; i < 36; i++) {

            if(value == this.trump.value && kind == this.trump.kind) {  // do not push trump card into the deck, after shuffling it must be the first
                value++;
            }
            else {
                this.deck.push(new Card(value++, kind, kind ==  this.trump.kind))
            }

            if(value == 9) {
                value = 0;
                kind++;
            }
        }
        return this.deck;
    }

    this.shuffleDeck = function() {
        var temp;
        var temp_i;

        for(var i = 1; i < 36; i++) {  //35 - because there is no trump card
            temp_i = Math.round(Math.random()*34) + 1;

            temp = this.deck[temp_i];
            this.deck[temp_i] = this.deck[i];
            this.deck[i] = temp;
        }

        return this.deck;
    }

    this.next = function() {
        return this.deck.pop()
    }

    this.run = function() {
        this.trump = this.makeTrump();
        this.makeDeck();
        this.shuffleDeck();
    }
}
