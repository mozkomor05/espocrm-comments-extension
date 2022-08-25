{{#unless noEdit}}
    <div class="pull-right right-container">
        {{{right}}}
    </div>
{{/unless}}

<div class="stream-head-container">
    <div class="pull-left">
        {{{avatar}}}
    </div>

    <div class="stream-head-text-container">
        <span class="text-muted message">{{{message}}}</span>
    </div>
</div>

<div class="stream-post-container">
    <span class="cell cell-post">{{{post}}}</span>
</div>

{{#if showAttachments}}
    <div class="stream-attachments-container">
        <span class="cell cell-attachments">{{{attachments}}}</span>
    </div>
{{/if}}

<div class="comment-footer">
    <div class="stream-date-container">
        <span class="text-muted small">{{{createdAt}}}</span>
    </div>

    {{#if allowThreadLoading}}
        <div class="comment-load-replies-container">
        <span class="cell cell-load-replies">
            <a class="action comment-load-replies-link" href="javascript:" data-action="loadReplies">
                <span class="fas fa-comment-dots"></span> {{translate 'Load whole thread' scope='Comments'}}
            </a>
        </span>
        </div>
    {{/if}}
</div>

<div class="form-group comment-post-container {{#if postDisabled}}hidden{{/if}}" data-id="{{model.id}}">
    <div class="comment-textarea-container" data-id="{{model.id}}">{{{postField}}}</div>
    <div class="buttons-comment-panel margin hide floated-row clearfix" data-id="{{model.id}}">
        <div>
            <button class="btn btn-primary comment-post action" data-action="postReply"
                    data-id="{{model.id}}">{{translate
                    'Post'}}</button>
        </div>
        <div class="attachments-container">
            {{{attachmentsView}}}
        </div>
    </div>
</div>

{{#if childrenComments.length}}
    <div class="comment-children-container">
        {{#each childrenComments}}
            <div class="commentChild" style="margin-left:20px; margin-bottom: 20px; margin-top: 20px;"
                 data-id="{{./this}}">
                {{{var this ../this}}}
            </div>
        {{/each}}
    </div>
{{/if}}