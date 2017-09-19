window.browser = {

    callback: null,
    element: null,

    compatible: function(browsers, callback) {
        this.callback = null;
        if(!window['bowser'] || !browsers || window.bowser.check(browsers, true)) {
            callback && callback();
        } else {
            this.callback = callback;
            this.showWarning();
        }
    },


    showWarning: function() {
        this.element = $(
            '<div class="incompatible-browser">' +
                '<p data-i18n="incompatible_browser_text"></p>' +
                '<button data-i18n="incompatible_browser_btn"></button>' +
            '</div>'
        );
        this.element.find('button').click(this.closeWarning.bind(this));
        $(document.body).append(this.element);
        this.refreshWarning();
    },


    refreshWarning: function() {
        this.element && this.element.find('[data-i18n]').each(function(i, el) {
            var key = $(el).attr('data-i18n');
            window.i18next.exists(key) && $(el).html(window.i18next.t(key));
        })
    },

    closeWarning: function() {
        this.element.remove();
        this.element = null;
        this.callback && this.callback();
    },


    info: function() {
        return window['bowser'] ? window.bowser.name + ' ' + window.bowser.version : '';
    }

}