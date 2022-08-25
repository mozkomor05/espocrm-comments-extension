define('comments:views/comments/record/list', 'views/stream/record/list', function (Dep) {

    return Dep.extend({

        showMore: false,

        setup: function () {
            Dep.prototype.setup.call(this);
        },

        buildRow: function (i, model, callback) {
            const key = model.id;
            this.rowList.push(key);
            const viewName = this.getMetadata().get(['clientDefs', 'Comment', 'views', 'comment']) || 'comments:views/comments/comment';

            this.createView(key, viewName, {
                model: model,
                parentCollection: this.collection,
                threadComment: model,
                parentModel: this.model,
                acl: {
                    edit: this.getAcl().checkModel(model, 'edit')
                },
                noEdit: this.options.noEdit,
                optionsToPass: ['acl'],
                name: this.type + '-' + model.name,
                el: this.options.el + ' li[data-id="' + model.id + '"]',
                setViewBeforeCallback: this.options.skipBuildRows && !this.isRendered()
            }, callback);
        },
    });
});