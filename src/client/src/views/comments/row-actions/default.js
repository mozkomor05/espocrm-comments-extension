Espo.define('comments:views/comments/row-actions/default', 'views/stream/row-actions/default', function (Dep) {

    return Dep.extend({

        getActionList: function () {
            const list = Dep.prototype.getActionList.call(this);
            list.unshift({
                action: 'quickReply',
                label: 'Reply',
                data: {
                    id: this.model.id
                }
            });
            return list;
        }
    });
});

