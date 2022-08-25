define('comments:views/comments/comment', ['views/stream/note', 'views/record/list'], function (Dep, ListView) {

    return Dep.extend({
        template: 'comments:comments/comment',
        messageName: 'post',
        isEditable: true,
        isRemovable: true,
        postingMode: false,
        childrenComments: [],
        threadLoaded: false,

        init: function () {
            this.createField('createdAt', null, null, 'views/fields/datetime-short');

            if (this.getUser().isAdmin()) {
                this.isRemovable = true;
            }

            this.messageTemplate = this.translate(this.messageName + 'This', 'streamMessages');
            this.messageData = {
                'user': 'field:createdBy'
            };
            if (!this.options.noEdit && (this.isEditable || this.isRemovable)) {
                this.createView('right', 'comments:views/comments/row-actions/default', {
                    el: this.options.el + ' .right-container',
                    acl: this.options.acl,
                    model: this.model,
                    isEditable: this.isEditable,
                    isRemovable: this.isRemovable
                });
            }
        },

        actionQuickReply: function () {
            this.createView('postField', 'comments:views/comments/fields/post', {
                el: this.getSelector() + ' .comment-textarea-container[data-id="' + this.model.id + '"]',
                name: 'comment',
                mode: 'edit',
                params: {
                    required: true,
                    rowsMin: 1,
                    rows: 25,
                },
                model: this.model,
                placeholderText: this.translate('writeYourCommentHere', 'messages'),
            }, (view) => {
                view.render();
                this.$textarea = this.$el.find('.comment-textarea-container[data-id="' + this.model.id + '"] textarea');
                this.enablePostingMode(true);
            });
            this.createView('attachmentsView', 'views/stream/fields/attachment-multiple', {
                model: this.seed,
                mode: 'edit',
                el: this.options.el + ' div.attachments-container',
                defs: {
                    name: 'attachments',
                },
            }, function (view) {
                view.render();
            });
        },

        events: _.extend({
            'click .action': function (e) {
                Espo.Utils.handleAction(this, e);
            },
            'focus textarea[data-name="comment"]': function (e) {
                e.stopPropagation();
                this.enablePostingMode(true);
            },
        }, Dep.prototype.events),

        data: function () {
            const data = Dep.prototype.data.call(this);
            data.showAttachments = !!(this.model.get('attachmentsIds') || []).length;
            data.childrenComments = this.childrenComments;
            data.allowThreadLoading = this.model.get('hasChildren') && this.isRoot && !this.threadLoaded;
            return data;
        },

        actionPostReply: function () {
            const message = this.$textarea.val();
            this.$textarea.prop('disabled', true);

            this.getModelFactory().create('Comment', function (model) {
                if (this.getView('attachmentsView').validateReady()) {
                    this.$textarea.prop('disabled', false);
                    return;
                }

                if (message === '' && (this.seed.get('attachmentsIds') || []).length === 0) {
                    this.notify('Comment cannot be empty', 'error');
                    this.$textarea.prop('disabled', false);

                    return;
                }

                this.listenToOnce(model, 'sync', function () {
                    if (this.threadComment.id === this.model.id) {
                        model.fetch();
                        this.actionLoadReplies({
                            doNotNotify: true,
                            callback: () => {
                                this.notify('Posted', 'success');
                            }
                        }, this.$el.find('[data-action="loadReplies"]'));
                    } else {
                        model.fetch().then(() => {
                            this.addNewComment(model, {}, true, () => {
                                this.notify('Posted', 'success');
                                this.reRender();
                            });
                        });
                    }
                    this.disablePostingMode();
                }, this);

                model.set('post', message);
                model.set('attachmentsIds', Espo.Utils.clone(this.seed.get('attachmentsIds') || []));
                model.set('threadId', this.threadComment.id);
                model.set('commentReplyId', this.model.id);
                model.set('parentId', this.parentModel.id);
                model.set('parentType', this.parentModel.name);

                this.notify('Posting...');
                model.save(null, {
                    error: function () {
                        this.$textarea.prop('disabled', false);
                    }.bind(this)
                });
            }.bind(this));
        },

        addNewComment: function (model, children, prepend, callback) {
            if (prepend) {
                this.childrenComments.unshift(model.id);
            } else {
                this.childrenComments.push(model.id);
            }
            this.createView(model.id, 'comments:views/comments/comment', {
                el: this.options.el + ' .commentChild[data-id="' + model.id + '"]',
                model: model,
                parentCollection: this.parentCollection,
                threadComment: this.threadComment,
                parentModel: this.parentModel,
                childrenTree: Espo.Utils.cloneDeep(children),
                acl: {
                    edit: this.getAcl().checkModel(model, 'edit')
                },
                noEdit: this.options.noEdit,
                optionsToPass: ['acl'],
                name: this.type + '-' + model.name
            }, () => {
                callback.call(this);
            });
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);
            this.$postContainer = this.$el.find('.comment-post-container[data-id="' + this.model.id + '"]');
        },

        enablePostingMode: function (byFocus) {
            this.$el.find('.buttons-comment-panel[data-id="' + this.model.id + '"]').removeClass('hide');
            if (!this.postingMode) {
                if (this.$textarea.val() && this.$textarea.val().length) {
                    this.getView('postField').controlTextareaHeight();
                }
                var isClicked = false;
                $('body').on('click.stream-panel', function (e) {
                    if (byFocus && !isClicked) {
                        isClicked = true;
                        return;
                    }
                    var $target = $(e.target);
                    if ($target.parent().hasClass('remove-attachment')) return;
                    if ($.contains(this.$postContainer.get(0), e.target)) return;
                    if (this.$textarea.val() !== '') return;
                    if ($(e.target).closest('.popover-content').get(0)) return;
                    var attachmentsIds = this.seed.get('attachmentsIds') || [];
                    if (!attachmentsIds.length && (!this.getView('attachmentsView') || !this.getView('attachmentsView').isUploading)) {
                        this.disablePostingMode();
                    }
                }.bind(this));
            }

            this.postingMode = true;
        },

        disablePostingMode: function () {
            this.postingMode = false;

            $('body').off('click.stream-panel');
            this.$el.find('.buttons-comment-panel[data-id="' + this.model.id + '"]').addClass('hide');

            this.clearView('postField');
            this.clearView('attachmentsView');
        },

        setup: function () {
            this.parentModel = this.options.parentModel;
            this.threadComment = this.options.threadComment;
            this.isRoot = this.threadComment.id === this.model.id;
            this.parentCollection = this.options.parentCollection;
            this.childrenTree = this.options.childrenTree || {};

            this.wait(true);

            this.getModelFactory().create('Comment', (model) => {
                this.modelTemplate = model;
                this.seed = Espo.Utils.cloneDeep(this.modelTemplate);
                this.wait(false);

                this.processChildrenTree();
            });
            this.createField('post', null, {
                seeMoreDisabled: true
            }, 'views/stream/fields/post');
            this.createField('attachments', 'attachmentMultiple', {}, 'views/stream/fields/attachment-multiple', {
                previewSize: this.options.isNotification ? 'small' : 'medium'
            });

            this.listenTo(this.model, 'change', function () {
                if (this.model.hasChanged('post') || this.model.hasChanged('attachmentsIds')) {
                    this.reRender();
                }
            }, this);

            this.createMessage();
        },

        actionLoadReplies: function (data, e) {
            if (data.doNotNotify !== true) {
                this.notify('Loading...');
            }
            this.fetchChildren(data.callback);
            $(e.currentTarget).remove();
        },

        fetchChildren: function (callback) {
            this.ajaxGetRequest('Comment/action/commentThreadTree?threadId=' + this.model.id).then((response) => {
                this.childrenTree = response;
                this.processChildrenTree(callback);
            });
        },

        processChildrenTree: function (callback) {
            this.childrenComments = [];

            if (this.childrenTree) {
                this.notify(false);
            }

            const items = Object.values(this.childrenTree),
                itemsCount = items.length;
            let built = 0;

            if (itemsCount === 0) {
                this.notify(false);

                return;
            }

            items.forEach(child => {
                const model = Espo.Utils.cloneDeep(this.modelTemplate);
                model.set(child);

                this.addNewComment(model, child.children, false, () => {
                    if (++built === itemsCount) {
                        this.threadLoaded = true;
                        this.notify(false);
                        this.reRender();

                        if (callback) {
                            callback.call(this);
                        }
                    }
                });
            });
        }
    });
});
