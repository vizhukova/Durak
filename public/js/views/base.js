define(['handlebars', 'jquery', 'backbone', 'bootstrap', 'io'], function (Handlebars, $, Backbone, Bootstrap, io) {

    'use strict';

    var View = Backbone.View.extend({

        getTemplateFunction: function(){
            var template = this.template,
                templateFunc = null;

            if (typeof template === 'string') {

                templateFunc = Handlebars.compile(template);
                this.constructor.prototype.template = templateFunc;
            }
            else {
                templateFunc = template;
            }

            return templateFunc;
        }
    });

    return View
});