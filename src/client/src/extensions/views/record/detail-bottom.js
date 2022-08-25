extend('comments:extensions/views/record/detail-bottom', function (Dep) {
    return Dep.extend({
        setup: function () {
            if (!this.commentsPanel) {
                this.commentsPanel = this.streamPanel;
            }

            Dep.prototype.setup.call(this);
        },

        setupPanels: function () {
            Dep.prototype.setupPanels.call(this);
            if (this.commentsPanel && this.getMetadata().get(['scopes', this.scope, 'comments'])) {
                this.setupCommentsPanel();
            }
        },

        setupCommentsPanel: function () {
            this.panelList.push({
                name: 'comments',
                label: 'Comments',
                view: this.getMetadata().get(['clientDefs', this.scope, 'commentsPanelView']) || 'comments:views/comments/panel',
                sticked: true,
                index: 2,
            });
        },
    });
});