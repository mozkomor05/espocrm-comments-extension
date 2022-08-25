define('comments:collections/comment', 'collection', function (Dep) {

    return Dep.extend({

        parse: function (response, params) {
            const total = this.total;
            const list = Dep.prototype.parse.call(this, response, params);

            if (params.data && params.data.after) {
                if (total >= 0 && response.total >= 0) {
                    this.total = total + response.total;
                } else {
                    this.total = total;
                }
            }
            return list;
        },

        fetchNew: function (options) {
            options = options || {};
            options.data = options.data || {};

            if (this.length) {
                options.data.after = this.models[0].get('createdAt');
                options.remove = false;
                options.at = 0;
                options.maxSize = null;
            }

            this.fetch(options);
        },

    });

});