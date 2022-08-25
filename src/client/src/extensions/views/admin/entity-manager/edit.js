extend('comments:extensions/views/admin/entity-manager/edit', function (Dep) {
    return Dep.extend({
        setupData: function () {
            Dep.prototype.setupData.call(this);

            if (this.scope) {
                this.model.set('comments', this.getMetadata().get('scopes.' + this.scope + '.comments') || false);
            }

            for (const [i, row] of this.detailLayout[0].rows.entries()) {
                if (row.length > 1 && row[1].name === 'stream') {
                    this.detailLayout[0].rows.splice(i + 1, 0, [false, {
                        name: 'comments',
                    }]);
                    break;
                }
            }
        },

        createRecordView: function () {
            this.model.defs.fields.comments = {
                type: 'bool',
                default: false,
                tooltip: true,
            };
            Dep.prototype.createRecordView.call(this);
        },

        actionSave: function () {
            const orgPostRequest = Espo.Ajax.postRequest;
            Espo.Ajax.postRequest = (url, data, options) => {
                return orgPostRequest.call(Espo.Ajaxs, url, data, options).then(() => {
                    return this.ajaxPostRequest('EntityManager/action/toggleComments', {
                        scope: this.scope || this.model.get('name'),
                        commentsEnabled: this.model.get('comments'),
                    });
                });
            };
            Dep.prototype.actionSave.call(this);
            Espo.Ajax.postRequest = orgPostRequest;
        },
    });
});