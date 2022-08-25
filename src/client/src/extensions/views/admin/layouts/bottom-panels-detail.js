extend('comments:extensions/views/admin/layouts/bottom-panels-detail', function (Dep) {
    return Dep.extend({
        readDataFromLayout: function (layout) {
            Dep.prototype.readDataFromLayout.call(this, layout);

            if (!this.hasStream || !this.getMetadata().get(['scopes', this.scope, 'comments'])) {
                return;
            }

            const panelData = {
                index: 2,
                name: 'comments',
                label: this.translate('Comment', 'scopeNamesPlural')
            };

            if ('comments' in layout) {
                const commentsData = layout.comments;

                if (commentsData.disabled) {
                    this.disabledFields.unshift(panelData);
                } else {
                    for (const i in commentsData) {
                        panelData[i] = commentsData[i];
                    }
                }
            }

            this.rowLayout.push(panelData);
            this.itemsData.comments = Espo.Utils.cloneDeep(panelData);
            this.itemsData.comments.noLayout = true;

            this.rowLayout.sort(function (v1, v2) {
                return (v1.index || 0) - (v2.index || 0);
            });
        },
    });
});