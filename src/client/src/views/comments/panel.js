define('comments:views/comments/panel', 'views/stream/panel', function (Dep) {
    return Dep.extend({

        setup: function () {
            this.scope = this.model.name;
            this.title = this.translate('Comment', 'scopeNamesPlural');
            this.placeholderText = this.translate('writeYourCommentHere', 'messages');

            this.storageTextKey = 'comments-post-' + this.model.name + '-' + this.model.id;
            this.storageAttachmentsKey = 'comments-post-attachments-' + this.model.name + '-' + this.model.id;

            this.on('remove', () => {
                this.storeControl();

                $(window).off('beforeunload.comments-' + this.cid);
            });
            $(window).off('beforeunload.comments-' + this.cid);
            $(window).on('beforeunload.comments-' + this.cid, () => {
                this.storeControl();
            });

            const storedAttachments = this.getSessionStorage().get(this.storageAttachmentsKey);
            this.wait(true);

            this.getModelFactory().create('Comment', (model) => {
                this.seed = model;

                if (storedAttachments) {
                    this.seed.set({
                        attachmentsIds: storedAttachments.idList,
                        attachmentsNames: storedAttachments.names,
                        attachmentsTypes: storedAttachments.types,
                    });
                }

                this.createView('postField', 'comments:views/comments/fields/post', {
                    el: this.getSelector() + ' .textarea-container',
                    name: 'post',
                    mode: 'edit',
                    params: {
                        required: true,
                        rowsMin: 1,
                        rows: 25,
                    },
                    model: this.seed,
                    placeholderText: this.placeholderText
                }, (view) => {
                    this.listenTo(view, 'after:render', function () {
                        this.$textarea = view.$el.find('textarea');
                    }, this);
                    this.initPostEvents(view);
                });

                this.createCollection(function () {
                    this.wait(false);
                }, this);

                this.listenTo(this.seed, 'change:attachmentsIds', () => {
                    this.controlPostButtonAvailability();
                });
            });
        },

        createCollection: function (callback, context) {
            this.getCollectionFactory().create('Comment', function (collection) {
                this.collection = collection;
                collection.url = this.model.name + '/' + this.model.id + '/comments';
                callback.call(context);
            }, this);

        },

        post: function () {
            const message = this.seed.get('post');
            this.$textarea.prop('disabled', true);

            this.getModelFactory().create('Comment', function (model) {
                if (this.getView('attachments').validateReady()) {
                    this.$textarea.prop('disabled', false);
                    return;
                }

                if (message === '' && (this.seed.get('attachmentsIds') || []).length === 0) {
                    this.notify('Comment cannot be empty', 'error');
                    this.$textarea.prop('disabled', false);

                    return;
                }

                this.listenToOnce(model, 'sync', function () {
                    this.collection.fetchNew();
                    this.seed.set('post', '');

                    this.$textarea.prop('disabled', false);
                    this.disablePostingMode();
                    this.afterPost();

                    this.getSessionStorage().clear(this.storageTextKey);
                    this.getSessionStorage().clear(this.storageAttachmentsKey);

                    this.notify('Posted', 'success');
                }, this);

                model.set('post', message);
                model.set('attachmentsIds', Espo.Utils.clone(this.seed.get('attachmentsIds') || []));
                model.set('parentId', this.model.id);
                model.set('parentType', this.model.name);

                this.notify('Posting...');
                model.save(null, {
                    error: function () {
                        this.$textarea.prop('disabled', false);
                    }.bind(this)
                });
            }.bind(this));
        },

        afterRender: function () {
            this.$postContainer = this.$el.find('.post-container');
            this.$postButton = this.$el.find('button.post');

            const storedText = this.getSessionStorage().get(this.storageTextKey);

            if (storedText && storedText.length) {
                this.seed.set(storedText);
            }

            this.controlPostButtonAvailability(storedText);

            const collection = this.collection;

            this.listenToOnce(collection, 'sync', function () {
                this.createView('list', 'comments:views/comments/record/list', {
                    el: this.options.el + ' > .list-container',
                    collection: collection,
                    model: this.model,
                }, function (view) {
                    view.render();
                });

                this.stopListening(this.model, 'all');
                this.stopListening(this.model, 'destroy');
                setTimeout(function () {
                    this.listenTo(this.model, 'all', function (event) {
                        if (!~['sync', 'after:relate'].indexOf(event)) return;
                        collection.fetchNew();
                    }, this);

                    this.listenTo(this.model, 'destroy', function () {
                        this.stopListening(this.model, 'all');
                    }, this);
                }.bind(this), 500);

            }, this);

            if (!this.defs.hidden) {
                collection.fetch();
            } else {
                this.once('show', function () {
                    collection.fetch();
                }, this);
            }

            const buildUserListUrl = function (term) {
                return 'User?orderBy=name&limit=7&q=' + term + '&' + $.param({'primaryFilter': 'active'});
            }.bind(this);

            this.$textarea.textcomplete([{
                match: /(^|\s)@(\w*)$/,
                index: 2,
                search: function (term, callback) {
                    if (term.length === 0) {
                        callback([]);
                        return;
                    }
                    $.ajax({
                        url: buildUserListUrl(term),
                    }).done(function (data) {
                        callback(data.list);
                    });
                },
                template: function (mention) {
                    return this.getHelper().escapeString(mention.name) + ' <span class="text-muted">@' + this.getHelper().escapeString(mention.userName) + '</span>';
                }.bind(this),
                replace: function (o) {
                    return '$1@' + o.userName + '';
                }
            }]);

            this.once('remove', function () {
                if (this.$textarea.length) {
                    this.$textarea.textcomplete('destroy');
                }
            }, this);

            const $a = this.$el.find('.buttons-panel a.stream-post-info');

            let message = this.getHelper().transfromMarkdownInlineText(
                    this.translate('infoMention', 'messages', 'Stream')
                ) + '<br><br>' +
                this.getHelper().transfromMarkdownInlineText(
                    this.translate('infoSyntax', 'messages', 'Stream') + ':'
                ) + '<br>';

            const syntaxItemList = [
                ['code', '`{text}`'],
                ['multilineCode', '```{text}```'],
                ['strongText', '**{text}**'],
                ['emphasizedText', '*{text}*'],
                ['deletedText', '~~{text}~~'],
                ['blockquote', '> {text}'],
                ['link', '[{text}](url)'],
            ];

            const messageItemList = [];

            syntaxItemList.forEach(function (item) {
                const text = this.translate(item[0], 'syntaxItems', 'Stream');
                const result = item[1].replace('{text}', text);
                messageItemList.push(result);
            }, this);

            message += '<ul>' + messageItemList.map(function (item) {
                return '<li>' + item + '</li>';
            }).join('') + '</ul>';


            $a.popover({
                placement: 'bottom',
                container: 'body',
                content: message,
                html: true
            }).on('shown.bs.popover', function () {
                $('body').off('click.popover-' + this.id);
                $('body').on('click.popover-' + this.id, function (e) {
                    if (e.target.classList.contains('popover-content')) return;
                    if ($(e.target).closest('.popover-content').get(0)) return;
                    if ($.contains($a.get(0), e.target)) return;
                    $('body').off('click.popover-' + this.id);
                    $a.popover('hide');
                    e.stopPropagation();
                }.bind(this));
            });

            $a.on('click', function () {
                $(this).popover('toggle');
            });

            this.on('remove', function () {
                if ($a) $a.popover('destroy');
                $('body').off('click.popover-' + this.id);
            }, this);

            this.createView('attachments', 'views/stream/fields/attachment-multiple', {
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
    });
});
