$r.package("main").Class("TodoListItemRendererEvent").extends("Event")(function () {


    this.init = function (type,todoItem) {

        this.super.init(type, true, true);
        this.todoItem = todoItem;

    };

})

$r.package("main").TodoListItemRendererEvent.TODO_ITEM_DELETED = "TODO_ITEM_DELETED";