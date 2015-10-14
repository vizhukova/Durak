
    requirejs.config({

        baseUrl: './js/',

        paths: {
            jquery: '../bower_components/jquery/dist/jquery',
            underscore: '../bower_components/lodash/lodash',
            backbone: '../bower_components/backbone/backbone',
            handlebars: '../bower_components/handlebars/handlebars',
            text: '../bower_components/text/text',
            bootstrap: '../bower_components/bootstrap/dist/js/bootstrap.min',
            io: '../bower_components/socket.io-client/socket.io'
        },

        shim: {
            underscore: {
                exports: '_'
            },
            backbone: {
                deps: ['underscore', 'jquery'],
                exports: 'Backbone'
            },
            handlebars: {
                exports: 'Handlebars'
            },
            bootstrap: {
                deps: ['jquery'],
                exports: 'bootstrap'
            },
            io: {
                export: 'io'
            }
        }

    });

    window.config = {
        apiUrl: 'http://localhost:127/'
    }


    define(['controllers/rooms-controller'], function (RoomController) {
        var view = new RoomController({parent: "#content"})
    });

