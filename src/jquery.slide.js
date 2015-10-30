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
            loop: false,
            lazyLoad: false,
            pauseOnHover: true
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
            var _ = this;
            _.totalWidth = !_.settings.loop ? _.getWidth() : _.getWidth() * 3;
            _.$ul = _.$element.find('ul');
            _.items = _.$element.find('li');
            _.length = _.items.length;

            _.$currElem = $(_.items[0]);

            _.addIds();
            _.$element.addClass('slide-js-wrapper').find('ul').css('width', _.totalWidth + 'px').wrap('<div class="slide-js-list"></div>');

            if (_.settings.loop) {
                _.loop();
            }
            _.$slider = _.$element.find('.slide-js-list');

            if (_.settings.arrows) {
                _.listenToArrowEvents();
                _.disableArrows();
            }
            if (_.settings.dots) {
                _.initDots();
                _.listenToDotEvents();
            }
            _.initElement(_.$currElem);

            if (_.settings.autoplay) {
                _.autoplay();
            }

            _.lazyLoad();

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
        slideToNext: function(e, direction) {
            var x = $(e.currentTarget);
            var _ = this;

            if ((x.hasClass('next') || direction == 'right') && $(_.$currElem).next().length) {
                _.$currElem = $(_.$currElem).next();
                _.slideToElem(_.$currElem);
            } else if ((x.hasClass('prev') || direction == 'left') && $(_.$currElem).prev().length) {
                _.$currElem = $(_.$currElem).prev();
                _.slideToElem(_.$currElem);
            }
        },

        /**
         * Slide to a particular element from any element position
         * @param  {selector} elem The destination element
         * @return {}
         */
        slideToElem: function($elem) {
            var _ = this;
            this.$element.find('.slide-js-list').stop().animate({
                scrollLeft: $elem.position().left
            }, this.settings.speed, function() {
                _.postSlide($elem);
            });
        },

        postSlide: function($elem) {
            var _ = this;
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
            _.lazyLoad();
            _.currElemChanged = false;
        },

        initElement: function($elem) {
            this.$slider.scrollLeft($elem.position().left);
            this.postSlide($elem);
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
            _.$arrowNav = _.$element.find('.nav-arrow');
            _.$arrowNav.children().click(function(e) {
                _.slideToNext(e);
            });
        },

        /**
         * Listen to click on the dots and then go to the particular element.
         * @return {null}
         */
        listenToDotEvents: function() {
            var _ = this;
            _.$dots = _.$element.find('.nav-dot-section');
            _.$dotsChildren = _.$dots.children();
            _.$dotsChildren.click(function(e) {
                var index = $(e.currentTarget).index() + 1;
                _.slideToElem(_.$ul.find('[data-slide-index="' + index + '"]').not('.-before,.-after'));
            });
        },

        /**
         * Adds dots to the map
         * @return {null}
         */
        initDots: function() {
            var $dots = '<div class="nav-dot-section">' + new Array(this.length + 1).join('<div class="nav-dot"></div>') + '</div>';
            this.$element.append($dots);
        },

        /**
         * Adds an index data attribute to each slider element.
         */
        addIds: function() {
            this.items.each(function(index, val) {
                $(val).attr('data-slide-index', index + 1);
            });
        },

        /**
         * Initializes the loop and adds a clone of the items before and after the
         * original items.
         * @return {null}
         */
        loop: function() {
            var _ = this;
            _.content = _.$ul.html();
            _.items.clone().addClass('-after').insertAfter(_.items.filter(':last'));
            _.items.filter(':first').before(_.items.clone().addClass('-before'));
            _.items = _.$ul.children();
        },

        /**
         * This function is helpful when the loop option is turned on.
         * Whenever the active element reaches the boundary the element is
         * shifted to the similar element in the boundary and also scrools the
         * slider horizontally using `scrollLeft()`
         * @return {null}
         */
        processloop: function() {
            if (this.settings.loop) {
                var i, _ = this;
                var active = _.items.filter('.active');

                //When the element reaches the left boundary
                if (_.$currElem.hasClass('-before')) {
                    active.removeClass('active');
                    i = active.prevAll().length;
                    active = _.$currElem = _.items.filter(':not(.-before):eq(' + i + ')').addClass('active');
                    _.$slider.scrollLeft(active.position().left);
                    _.currElemChanged = true;
                }

                //when the element reaches the right boundary
                else if (_.$currElem.hasClass('-after')) {
                    active.removeClass('active');
                    i = active.prevAll('.-after').length;
                    active.removeClass('active');
                    _.$currElem = active = _.items.filter(':not(.-before):eq(' + i + ')').addClass('active');
                    _.$slider.scrollLeft(active.position().left);
                    _.currElemChanged = true;
                }
            }
        },

        /**
         * Lazyload functionality loads the image once the slide is in the view and
         * its immediate siblings. The image is shown once the image is fully loaded.
         * @return {null}
         */
        lazyLoad: function() {
            var _ = this;
            if (_.settings.lazyLoad) {
                var leftImages = _.$currElem.prev().find('[data-slide-src]');
                var centerImages = _.$currElem.find('[data-slide-src]');
                var rightImages = _.$currElem.next().find('[data-slide-src]');
                var images = $.merge(leftImages, centerImages);
                images = $.merge(images, rightImages);
                images.each(function() {
                    var image = new Image();
                    image.src = $(this).data('slide-src');
                    image.onload = function() {
                        var $similarElem = _.$ul.find('[data-slide-src = "' + image.src + '"]');
                        if ($similarElem.length) {
                            $similarElem.each(function() {
                                if ($(this).prop('tagName') == 'IMG') {
                                    $(this).attr('src', image.src).removeAttr('data-slide-src');
                                } else {
                                    $(this).css('background-image', 'url(' + image.src + ')').removeAttr('data-slide-src');
                                }
                            });
                        }
                    };
                });
            }
        },

        /**
         * Autoplay initialization
         * @return {null}
         */
        autoplay: function() {
            var _ = this;
            _.play();
            if (_.settings.pauseOnHover) {
                _.pauseOnHover();
            }
        },

        /**
         * Implementation of the pause on hover functionality
         * @return {null}
         */
        pauseOnHover: function() {
            var _ = this;
            _.$element.hover(function() {
                _.pause();
            }, function() {
                if (_.cleared) {
                    _.play();
                }
            });
        },

        /**
         * play the slideshow
         * @return {null}
         */
        play: function() {
            var _ = this;
            _.timeout = setTimeout(function() {
                var x = {};
                x.currentTarget = _.$currElem;
                _.slideToNext(x, 'right');
                _.play();
            }, 3000);
            this.cleared = false;
        },

        /**
         * pause the slideshow
         * @return {null}
         */
        pause: function() {
            clearTimeout(this.timeout);
            this.cleared = true;
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
