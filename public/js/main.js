
// Configure the AMD module loader
    requirejs.config({
        // The path where your JavaScripts are located
        baseUrl: './js/',
        // Specify the paths of vendor libraries
        paths: {
            jquery: '../bower_components/jquery/dist/jquery',
            underscore: '../bower_components/lodash/lodash',
            backbone: '../bower_components/backbone/backbone',
            handlebars: '../bower_components/handlebars/handlebars',
            text: '../bower_components/text/text',
            bootstrap: '../bower_components/bootstrap/dist/js/bootstrap.min',
            io: '../bower_components/socket.io-client/socket.io'
        },
        // Underscore and Backbone are not AMD-capable per default,
        // so we need to use the AMD wrapping of RequireJS
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
        // For easier development, disable browser caching
        // Of course, this should be removed in a production environment
        //, urlArgs: 'bust=' +  (new Date()).getTime()
    });

    window.config = {
        apiUrl: 'http://localhost:127/'
    }

// Bootstrap the application
    define(['controllers/rooms-controller'], function (RoomController) {
        var view = new RoomController({parent: "#content"})
    });

