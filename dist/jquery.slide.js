/*
 *  slide-js - v0.0.0
 *  A jQuery plugin to slide HTML elements.
 *  http://riteshkr.com/slide.js
 *
 *  Made by Ritesh Kumar
 *  Under MIT License
 */
// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;(function($, window, document, undefined) {

    'use strict';

    // window and document are passed through as local variable rather than global
    // as this (slightly) quickens the resolution process and can be more efficiently
    // minified (especially when both are regularly referenced in your plugin).

    // Create the defaults once
    var pluginName = 'SlideJS',
        defaults = {
            autoplay: false,
            speed   : 500
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.$element = $(element);
        // jQuery has an extend method which merges the contents of two or
        // more objects, storing the result in the first object. The first object
        // is generally empty as we don't want to alter the default options for
        // future instances of the plugin
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function() {
            this.$element.addClass('slide-js-wrapper').find('ul').css('width', this.getWidth() + 'px').wrap('<div class="slide-js-list"></div>');
            this.items = this.$element.find('li');
            this.$currentElement = $(this.items[0]);
            this.listenToEvents();
        },

        /**
         * Returns the total width of the ul tag by summing up the individual
         * widths of all the li tags and at the same time creates an array of
         * all the width of the list items.
         * @return {number} Total width of the ul tag
         */
        getWidth: function() {
            var _ = this;
            _.milestone = [];
            var totalWidth = 0;
            _.$element.find('li').each(function() {
                var width = parseInt($(this).outerWidth(true), 10);
                totalWidth += width;
                _.milestone.push(totalWidth);
            });
            return totalWidth;
        },

        slideToNext: function(e) {
            var $currentTarget = $(e.currentTarget);
            if ($currentTarget.hasClass('next') && this.$currentElement.next().length) {
                this.$currentElement = this.$currentElement.next();
                this.moveToElement(this.$currentElement);
            } else if ($currentTarget.hasClass('prev') && this.$currentElement.prev().length) {
                this.$currentElement = this.$currentElement.prev();
                this.moveToElement(this.$currentElement);
            }
        },

        moveToElement:function(elem){
        	var _=this;
        	 this.$element.find('.slide-js-list').stop().animate({
                scrollLeft: elem.position().left
            }, this.settings.speed, function(){
            	!elem.position().left ? _.$arrowNav.find('prev').addClass('disabled') : _.$arrowNav.find('prev').removeClass('disabled');
            });
        },

        listenToEvents: function() {
            var _ = this;
            this.$arrowNav = this.$element.find('.nav-arrow');
            this.$arrowNav.children().click(function(e) {
                _.slideToNext(e);
            });
        }
    });

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[pluginName] = function(options) {
        return this.each(function() {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
            }
        });
    };

})(jQuery, window, document);
