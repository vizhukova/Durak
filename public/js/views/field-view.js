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

            initialize: function (obj) {
                this.obj = obj;
                this.render(obj);

                $('.field').on('click', this.onClick.bind(this));
            },

            remove: function() {
                $('.field').unbind('click');
            },

            setMessage: function(message) {
                $('#message').html(message);
            },

            render: function (obj) {
                var templ = Handlebars.compile(template)({name: obj.roomData.name});
                $(obj.parent).html(templ);
                $('#playerModal').modal();
            },

            onClick: function(event) {
                if( $(event.target).hasClass('exit') ) {
                    this.hideTable();
                    this.trigger("change:removePlayer");
                }

                else if( $(event.target).hasClass('trump') ) {
                    if(!this.cardsLength) return;
                   this.trigger('change:showTrump')
                }

                else if(this.isYourTurn && $(event.target).hasClass('take') ) {
                    this.trigger('change:takeCards')
                }

                else if(this.isYourTurn && $(event.target).hasClass('pass') ) {
                    this.trigger('change:passAttack')
                }

                else if($(event.target).hasClass('enter-game-button') ) {
                    var name = $(event.target).parent().prev().find('.player-name-input')[0].value;

                    if(name == '' || name.length > 30) {
                        $(event.target).parent().prev().find('.prompt').addClass('wrong');
                        return;
                    } else {
                        this.beforeHideModal.bind(this)(name)
                    }
                }

                else if( $(event.target).hasClass('cancel') ) {
                    this.trigger("change:cancelEnter");
                }
            },

            beforeHideModal: function(name) {
                this.hideModal();
                $(this.obj.parent).addClass('not-redraw-rooms')
                if( $('.container').hasClass('hide') )  $('.container').removeClass('hide')
                if( $('.control-panel').hasClass('hide') )  $('.control-panel').removeClass('hide')

                this.obj.playerName = name;

                this.trigger("change:newPlayer");
            },

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

            setCardsOnCanvas: function() {
                this.tableCanvas = $('#table');
                this.context = this.tableCanvas.get(0).getContext('2d');
                this.context.font="20px Cursive";
                this.context.fillStyle = "#CBCC21";
                this.imageObj = new Image();
                this.imageObj.src = "./images/cards.png";
            },

            setYourTurnTrue: function() {
                this.isYourTurn = true;
                this.tableCanvas.on('click', function(evt) {
                    var rect = this.getMousePos(this.tableCanvas, evt)
                    this.isMouseOnCard(rect)
                }.bind(this));
            },

            setYourTurnFalse: function() {
                this.tableCanvas.unbind('click')
                this.isYourTurn = false;
            },

            getMousePos: function(canvas, evt) {
                var rect = this.tableCanvas.get(0).getBoundingClientRect();
                return {
                    x: evt.clientX - rect.left,
                    y: evt.clientY - rect.top
                };
            },

            isMouseOnCard: function(rect) {
                if(rect.x > (800 / this.cardsLength) && rect.x < (800 / this.cardsLength + this.cardsLength * 78.77)
                && rect.y > (560 - 114.4) && rect.y < 560) {
                 console.log('YOU ARE IN')
                    this.idAttackCard =  Math.floor( (rect.x - (800 / this.cardsLength) ) / 78.77 );
                    console.log('idCard = ' + this.idAttackCard)
                    if(this.idAttackCard > this.cardsLength - 1) return;
                    this.trigger('change:chooseCard')
                }
            },

            renderDefend: function(data) {
                var x = 78.77, y = 114.4;
                var dx = 800 / this.cardsLength;
                this.context.drawImage(this.imageObj, x * data.card.value, y * data.card.kind, x, y
                    , dx + x/2 * data.deckAttackingLength, 280, x, y);
            },

            renderAttack: function(data) {
                var x = 78.77, y = 114.4;
                var dx = 800 / this.cardsLength;
                this.context.drawImage(this.imageObj, x * data.card.value, y * data.card.kind, x, y
                    , dx + x/2 * data.deckAttackingLength, 280 - y/2, x, y);
            },

            clearDeck: function() {
                this.context.clearRect(800 / this.cardsLength, 560 - 114.4, 78.77 * this.cardsLength, 114.4);
                this.context.clearRect(0, 0, 150, 560);
            },

            clearTable: function() {
                this.context.clearRect(0, 0, 800, 560);
            },

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
                var x = 78.77, y = 114.4;
                var dx = 800 / cards.length;

                for(var i = 0; i < cards.length; i++) {
                    this.context.drawImage(this.imageObj, x * cards[i].value, y * cards[i].kind
                        , x, y, dx, 560 - y, x, y);
                    dx += x;
                }
            },

            renderTrump: function(data) {
                var x = 78.77, y = 114.4;
                var dx = 800/2;
                this.context.drawImage(this.imageObj, x * data.value, y * data.kind
                    , x, y, dx, 560/2 - y, x, y);
            },

            renderOpponentsCards: function(data) {
                var x = 78.77, y = 114.4;
                var dx;
                var rotateBack = 0;

                for(var i = 0; i < data.length + 1; i++) {
                    (function(i){

                    if(i == data.length) {
                        this.context.rotate((-1)* rotateBack * Math.PI / 180)
                    }

                    else if(i == 0) {
                        dx =  2 * (800 / 6) + data[i].deckLength*10/2

                        this.context.rotate(-90 * Math.PI / 180)
                        this.context.fillText(data[i].name, -dx - data[i].name.length * 10 / 2 / 2, 130);

                        rotateBack -= 90;
                        for(var j = 0; j < data[i].deckLength; j++) {
                            this.context.drawImage(this.imageObj, x*2, y*4,  x, y + 12, -dx, 0, x, y);
                            dx += 10;
                        }
                    }
                    else if(i == 1) {
                        dx = 50;
                        this.context.rotate(30 * Math.PI / 180)
                        this.context.fillText(data[i].name,-dx + - data[i].name.length * 10 / 2, 180);

                        rotateBack += 30;
                        for(var j = 0; j < data[i].deckLength; j++) {
                            this.context.drawImage(this.imageObj, x*2, y*4,  x, y + 12, -dx, 50, x, y);
                            dx += 10;
                        }
                    }

                    else if(i == 2) {
                        dx = 800/2;

                        this.context.rotate(60 * Math.PI / 180)
                        this.context.fillText(data[i].name,dx + data[i].name.length * 10 / 2 - data[i].name.length * 10, 125);

                        rotateBack += 60;
                        for(var j = 0; j < data[i].deckLength; j++) {
                            this.context.drawImage(this.imageObj, x*2, y*4,  x, y + 12, dx, 0, x, y);
                            dx -= 10;
                        }
                    }

                    else if(i == 3) {
                        dx = 400 - 10 * data[i].deckLength / 2;

                        this.context.rotate(60 * Math.PI / 180)
                        this.context.fillText(data[i].name,dx + 10 * data[i].deckLength - data[i].name.length * 10 / 2
                            , -510);

                        rotateBack += 60;
                        for(var j = 0; j < data[i].deckLength; j++) {
                            this.context.drawImage(this.imageObj, x*2, y*4,  x, y + 12, dx, -640, x, y);
                            dx += 10;
                        }
                    }

                    else if(i == 4) {
                        dx = 560/2 - 10 * data[i].deckLength;

                        this.context.rotate(30 * Math.PI / 180)
                        this.context.fillText(data[i].name, dx + 10 * data[i].deckLength - data[i].name.length * 10 / 2
                            , -800 + y + 20);

                        rotateBack += 30;
                        for(var j = 0; j < data[i].deckLength; j++) {
                            this.context.drawImage(this.imageObj, x*2, y*4,  x, y + 12, dx, -800, x, y);
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