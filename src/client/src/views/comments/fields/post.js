define('comments:views/comments/fields/post', 'views/note/fields/post', function (Dep) {
    return Dep.extend({
        fetch: function () {
            const data = {};
            data[this.name] = this.$element.val().trim();
            return data;
        },
    });
});