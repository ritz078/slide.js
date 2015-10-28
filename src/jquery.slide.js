// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
(function($, window, document, undefined) {

    'use strict';

    // window and document are passed through as local variable rather than global
    // as this (slightly) quickens the resolution process and can be more efficiently
    // minified (especially when both are regularly referenced in your plugin).

    // Create the defaults once
    var pluginName = 'SlideJS',
        defaults = {
            autoplay: false,
            speed: 200,
            arrows: true,
            firstElement: 1,
            dots: true,
            loop: true
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
            this.totalWidth = !this.settings.loop ? this.getWidth() : this.getWidth() * 3;
            this.$ul = this.$element.find('ul');
            this.items = this.$element.find('li');
            this.length = this.items.length;

            this.$currElem = $(this.items[0]);

            this.addIds();
            this.$element.addClass('slide-js-wrapper').find('ul').css('width', this.totalWidth + 'px').wrap('<div class="slide-js-list"></div>');

            if (this.settings.loop) {
                this.loop();
            }
            this.$slider = this.$element.find('.slide-js-list');
            this.slideToElem(this.$currElem);

            if (this.settings.arrows) {
                this.listenToArrowEvents();
                this.disableArrows();
            }

            if (this.settings.dots) {
                this.initDots();
                this.listenToDotEvents();
            }

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
            });
            return totalWidth;
        },

        /**
         * Slide to the immediate next or the previous slide based on
         * the click on the the arrow buttons
         * @param  {object} e Event
         * @return {}
         */
        slideToNext: function(e) {
            var x = $(e.currentTarget);

            if (x.hasClass('next') && $(this.$currElem).next().length) {
                this.$currElem = $(this.$currElem).next();
                this.slideToElem(this.$currElem);
            } else if (x.hasClass('prev') && $(this.$currElem).prev().length) {
                this.$currElem = $(this.$currElem).prev();
                this.slideToElem(this.$currElem);
            }
        },

        /**
         * Slide to a particular element from any element position
         * @param  {selector} elem The destination element
         * @return {}
         */
        slideToElem: function($elem) {
            var _ = this;
            var left = $elem.position().left;
            this.$element.find('.slide-js-list').stop().animate({
                scrollLeft: left
            }, this.settings.speed, function() {
                _.disableArrows();

                $elem
                    .addClass('active')
                    .siblings()
                    .removeClass('active');
                if (_.$dots) {
                    var index = $elem.data('slide-index') - 1;
                    _.$dots
                        .find('.nav-dot:eq(' + index + ')')
                        .addClass('active')
                        .siblings()
                        .removeClass('active');
                }
                _.processloop();

                if (!_.currElemChanged) {
                    _.$currElem = $elem;
                }
                _.currElemChanged = false;
            });
        },

        disableArrows: function() {
            this.$arrowNav.children().removeClass('disabled');
            if (!this.$ul.position().left) {
                this.$arrowNav.find('.prev').addClass('disabled');
            } else if (((this.$ul.position().left - this.$element.width()) + this.totalWidth) === 0) {
                this.$arrowNav.find('.next').addClass('disabled');
            }
        },

        /**
         * Listen to the clicks on the arrows and take proper
         * actions
         * @return {null}
         */
        listenToArrowEvents: function() {
            var _ = this;
            this.$arrowNav = this.$element.find('.nav-arrow');
            this.$arrowNav.children().click(function(e) {
                _.slideToNext(e);
            });
        },


        listenToDotEvents: function() {
            var _ = this;
            _.$dots = _.$element.find('.nav-dot-section');
            _.$dotsChildren = _.$dots.children();
            _.$dotsChildren.click(function(e) {
                var index = $(e.currentTarget).index() + 1;
                _.slideToElem(_.$ul.find('[data-slide-index="' + index + '"]'));
            });
        },

        initDots: function() {
            var $dots = '<div class="nav-dot-section">' + new Array(this.length + 1).join('<div class="nav-dot"></div>') + '</div>';
            this.$element.append($dots);
        },

        addIds: function() {
            this.items.each(function(index, val) {
                $(val).attr('data-slide-index', index + 1);
            });
        },

        loop: function() {
            this.content = this.$ul.html();
            this.items.clone().addClass('-after').insertAfter(this.items.filter(':last'));
            this.items.filter(':first').before(this.items.clone().addClass('-before'));
            this.items = this.$ul.children();
        },

        processloop: function() {
            var active = this.items.filter('.active');
            var i,_=this;
            if (_.$currElem.hasClass('-before')) {
                active.removeClass('active');
                i = active.prevAll().length;
                active = _.$currElem = _.items.filter(':not(.-before):eq(' + i + ')').addClass('active');
                _.$slider.scrollLeft(active.position().left);
                _.currElemChanged = true;
            } else if (_.$currElem.hasClass('-after')) {
                active.removeClass('active');
                i = active.prevAll('.-after').length;
                active.removeClass('active');
                _.$currElem = active = _.items.filter(':not(.-before):eq(' + i + ')').addClass('active');
                _.$slider.scrollLeft(active.position().left);
                _.currElemChanged = true;
            }
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
