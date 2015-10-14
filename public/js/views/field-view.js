define([
        'views/base',
        'text!../templates/field-template.hbs',
        'handlebars'
    ],

    function (View, template, Handlebars, io) {
        'use strict'

        var FieldView = View.extend({
            autoRender: true,
            template: template,
            data: {},
            isYourTurn: false,
            x: 78.77,//width of card
            y: 114.4,//height of card

            initialize: function (obj) {
                this.obj = obj;
                this.render(obj);

                $('.field').on('click', this.onClick.bind(this));
            },

            remove: function() {
                $('.field').unbind('click');
            },

            ////////////////////////////shows message in heading////////////////////////////
            setMessage: function(message) {
                $('#message').html(message);
            },

            render: function (obj) {
                var templ = Handlebars.compile(template)({name: obj.roomData.name});
                $(obj.parent).html(templ);
                $('#playerModal').modal();
            },

            onClick: function(event) {
                ////////////////////////////when player push button 'Exit'////////////////////////////
                if( $(event.target).hasClass('exit') ) {
                    this.hideTable();
                    this.trigger("change:removePlayer");
                }

                ////////////////////////////when player push button 'Trump'////////////////////////////
                else if( $(event.target).hasClass('trump') ) {
                    if(!this.cardsLength) return;
                   this.trigger('change:showTrump')
                }

                ////////////////////////////when player push button 'Take'////////////////////////////
                else if(this.isYourTurn && $(event.target).hasClass('take') ) {
                    this.trigger('change:takeCards')
                }

                ////////////////////////////when player push button 'Pass'////////////////////////////
                else if(this.isYourTurn && $(event.target).hasClass('pass') ) {
                    this.trigger('change:passAttack')
                }

                ////////////////////////////when player push button 'Begin' in modal window////////////////////////////
                else if($(event.target).hasClass('enter-game-button') ) {
                    var name = $(event.target).parent().prev().find('.player-name-input')[0].value;

                    if(name == '' || name.length > 30) {
                        $(event.target).parent().prev().find('.prompt').addClass('wrong');
                        return;
                    } else {
                        this.beforeHideModal.bind(this)(name)
                    }
                }

                ////////////////////////////when player push button 'Cancel' in modal window////////////////////////////
                else if( $(event.target).hasClass('cancel') ) {
                    this.trigger("change:cancelEnter");
                }
            },

            ////////////////////////////sets options before start game////////////////////////////
            beforeHideModal: function(name) {
                this.hideModal();
                $(this.obj.parent).addClass('not-redraw-rooms')
                if( $('.container').hasClass('hide') )  $('.container').removeClass('hide')
                if( $('.control-panel').hasClass('hide') )  $('.control-panel').removeClass('hide')

                this.obj.playerName = name;
                this.trigger("change:newPlayer");
            },

            ////////////////////////////hides game field////////////////////////////
            hideTable: function() {
                $('#content').removeClass('not-redraw-rooms');
                setTimeout(function() {
                    $('body').removeClass('table')
                }, 500)
            },

            beginGame: function() {
                $('.loading').addClass('hide');
                if( $('#table').hasClass('hide') )  $('#table').removeClass('hide')
                this.setCardsOnCanvas();
            },

            ////////////////////////////sets options for canvas////////////////////////////
            setCardsOnCanvas: function() {
                this.tableCanvas = $('#table');
                this.context = this.tableCanvas.get(0).getContext('2d');
                this.context.font="20px Cursive";
                this.context.fillStyle = "#CBCC21";
                this.imageObj = new Image();
                this.imageObj.src = "./images/cards.png";
            },

            /////////////give access to attacker or defender to use control elements ( buttons and cards)/////////////
            setYourTurnTrue: function() {
                this.isYourTurn = true;
                this.tableCanvas.on('click', function(evt) {
                    var rect = this.getMousePos(this.tableCanvas, evt)
                    this.isMouseOnCard(rect)
                }.bind(this));
            },

            ////////////takes away access attacker or defender to use control elements ( buttons and cards)////////////
            setYourTurnFalse: function() {
                this.tableCanvas.unbind('click')
                this.isYourTurn = false;
            },

            ////////////////////////////takes position on canvas////////////////////////////
            getMousePos: function(canvas, evt) {
                var rect = this.tableCanvas.get(0).getBoundingClientRect();
                return {
                    x: evt.clientX - rect.left,
                    y: evt.clientY - rect.top
                };
            },

            ////////////////////////////check if mouse click on the card////////////////////////////
            isMouseOnCard: function(rect) {
                var dx = this.cardsLength == 1 ? 800 / 2 : 800 / this.cardsLength
                var delta = this.cardsLength > 9 ? ( this.cardsLength > 18 ? this.x / 3 : this.x / 2) : this.x

                if(rect.x > dx && rect.x < (dx + this.cardsLength * delta)
                && rect.y > (560 - 114.4) && rect.y < 560) {
                    this.idAttackCard =  this.cardsLength == 1 ? 0 : Math.floor( (rect.x - (dx) ) / delta );
                    if(this.idAttackCard > this.cardsLength - 1) return;
                    this.trigger('change:chooseCard')
                }
            },

            ////////////////////////////render defend card////////////////////////////
            renderDefend: function(data) {
                var dx = 800 / 6 + data.deckAttackingLength*15;;
                this.context.drawImage(this.imageObj, this.x * data.card.value, this.y * data.card.kind, this.x, this.y
                    , dx + this.x/2, 280, this.x, this.y);
            },

            ////////////////////////////render attack card////////////////////////////
            renderAttack: function(data) {
                var dx = 800 / 6  + data.deckAttackingLength*15;
                this.context.drawImage(this.imageObj, this.x * data.card.value, this.y * data.card.kind, this.x, this.y
                    , dx + this.x/2, 280 - this.y/2, this.x, this.y);
            },

            ////////////////////////////clear some places of canvas////////////////////////////
            clearDeck: function() {
                var dx = this.cardsLength == 1 ? 800/2 : 800 / this.cardsLength
                this.context.clearRect(dx, 560 - this.y, this.x * this.cardsLength, this.y);
                this.context.clearRect(0, 0, 150, 560);
                this.context.clearRect(800-150, 0, 800, 560);
            },

            ////////////////////////////clear full canvas////////////////////////////
            clearTable: function() {
                this.context.clearRect(0, 0, 800, 560);
            },

            ////////////////////////////render player cards////////////////////////////
            renderCards: function(cards) {///cards {value, kind, isTrump}///
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

                this.cardsLength = cards.length;
                var dx = 800 / cards.length == 800 ? 800 / 2 : 800 / cards.length;
                var delta = cards.length > 9 ? ( cards.length > 18 ? this.x / 3 : this.x / 2) : this.x

                for(var i = 0; cards[i] && i < cards.length; i++) {
                    this.context.drawImage(this.imageObj, this.x * cards[i].value, this.y * cards[i].kind
                        , this.x, this.y, dx, 560 - this.y, this.x, this.y);
                    dx += delta;
                }
            },

            renderTrump: function(data) {
                var dx = 800/2;
                this.context.drawImage(this.imageObj, this.x * data.value, this.y * data.kind
                    , this.x, this.y, 550, 120, this.x, this.y);
            },

            renderDeck: function(data) {
                if(data.deckLength == 0) return;
                var dx = 230;
                this.renderTrump(data.trump)
                this.context.rotate(-90 * Math.PI / 180)
                for(var i = 0; i < data.deckLength - 1; i++) {
                    this.context.drawImage(this.imageObj, this.x*2, this.y*4,  this.x, this.y + 12, -dx, 590 - this.y/2, this.x, this.y);
                    dx += 3;
                }
                this.context.rotate(90 * Math.PI / 180)
            },

            renderOpponentsCards: function(data) {
                var dx;
                var rotateBack = 0;

                for(var i = 0; i < data.length + 1; i++) {
                    (function(i){

                    if(i == data.length) {
                        this.context.rotate((-1)* rotateBack * Math.PI / 180)
                    }

                    else if(i == 0) {
                        dx =  300;

                        this.context.rotate(-90 * Math.PI / 180)
                        this.context.fillText(data[i].name, -dx - data[i].name.length * 10 / 2 / 2, 130);

                        rotateBack -= 90;
                        for(var j = 0; j < data[i].deckLength; j++) {
                            this.context.drawImage(this.imageObj, this.x*2, this.y*4,  this.x, this.y + 12, -dx, 0
                                , this.x, this.y);
                            dx += 10;
                        }
                    }
                    else if(i == 1) {
                        dx = 50;
                        this.context.rotate(30 * Math.PI / 180)
                        this.context.fillText(data[i].name,-dx + - data[i].name.length * 10 / 2, 180);

                        rotateBack += 30;
                        for(var j = 0; j < data[i].deckLength; j++) {
                            this.context.drawImage(this.imageObj, this.x*2, this.y*4,  this.x, this.y + 12, -dx, 50, this.x, this.y);
                            dx += 10;
                        }
                    }

                    else if(i == 2) {
                        dx = 800/2;

                        this.context.rotate(60 * Math.PI / 180)
                        this.context.fillText(data[i].name,dx + data[i].name.length * 10 / 2 - data[i].name.length * 10, 125);

                        rotateBack += 60;
                        for(var j = 0; j < data[i].deckLength; j++) {
                            this.context.drawImage(this.imageObj, this.x*2, this.y*4,  this.x, this.y + 12, dx, 0, this.x, this.y);
                            dx -= 10;
                        }
                    }

                    else if(i == 3) {
                        dx = 370;

                        this.context.rotate(60 * Math.PI / 180)
                        this.context.fillText(data[i].name,dx + 10 * data[i].deckLength - data[i].name.length * 10 / 2
                            , -510);

                        rotateBack += 60;
                        for(var j = 0; j < data[i].deckLength; j++) {
                            this.context.drawImage(this.imageObj, this.x*2, this.y*4,  this.x, this.y + 12, dx, -640, this.x, this.y);
                            dx += 10;
                        }
                    }

                    else if(i == 4) {
                        dx = 560/2 - 60;

                        this.context.rotate(30 * Math.PI / 180)
                        this.context.fillText(data[i].name, dx + 10 * data[i].deckLength - data[i].name.length * 10 / 2
                            , -800 + this.y + 20);

                        rotateBack += 30;
                        for(var j = 0; j < data[i].deckLength; j++) {
                            this.context.drawImage(this.imageObj, this.x*2, this.y*4,  this.x, this.y + 12, dx, -800, this.x, this.y);
                            dx += 10;
                        }
                    }
                    }.bind(this))(i)
                }
            },

            hideModal: function() {
                $('#playerModal').modal('hide');
                $('.modal-backdrop').remove();
                setTimeout(function() {
                    $('body').addClass('table')
                }, 500)
            }

        })
        return FieldView;
    });
