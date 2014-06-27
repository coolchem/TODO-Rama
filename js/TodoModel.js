$r.package("main").Class("TodoModel").extends("Model")(function () {

    var main = $r.package("main");

    var items,localStorage, removeEditingState;

    var staticTodoList = new $r.ArrayList();
    var activeTodoList = new $r.ArrayList();

    var _currentFilter = "";

    this.noOfActiveItems = 0;
    this.noOfCompletedItems = 0;

    this.init = function () {
        this.super.init();
        localStorage = window.localStorage;
        if (localStorage) {
            items = JSON.parse(localStorage.getItem('todos-rama')) || [];
        }
    }

    this.initialize = function(){


        for (var i=0; i< items.length ; i ++)
        {
            var item = items[i];
            if(item.completed === false)
            {
                this.noOfActiveItems += 1;
            }
            else
            {
                this.noOfCompletedItems += 1;
            }
            staticTodoList.addItem(new main.TodoItem(items[i]));
            activeTodoList.addItem(new main.TodoItem(items[i]));
        }

        staticTodoList.addEventListener($r.CollectionEvent.COLLECTION_CHANGE, handleTodoListChange);
    }

    this.addTodoItem = function(description){

        activeTodoList.addItem(createTodoItem(description));
        staticTodoList.addItem(createTodoItem(description));

    }

    this.removeTodoItem = function(){


    }

    this.applyFilter = function (filterType) {

        if (filterType !== _currentFilter) {
            var newArray = [];
            _currentFilter = filterType;

            for (var i = 0; i < staticTodoList.length; i++) {
                var todoItem = staticTodoList.getItemAt(i);

                if(filterType !== "")
                {
                    if (_currentFilter === "filterActive" && todoItem.completed === false) {
                        newArray.push(todoItem);
                    }
                    else if (_currentFilter === "filterCompleted" && todoItem.completed === true) {
                        newArray.push(todoItem);
                    }
                }
                else {
                    newArray.push(todoItem)
                }

            }

            activeTodoList.source = newArray;
        }

    };

    this.get("todoList", function () {

        return activeTodoList;
    });


    function calculateNumberOfActiveAndCompletedItems(){


    }

    function handleTodoListChange(event) {

        if (localStorage)
            localStorage.setItem('todos-rama', JSON.stringify(staticTodoList.source.map(getSimpleTodoItem)));
    }

    function getSimpleTodoItem(item){
        return item.sourceItem;

    }
    function createTodoItem(description){
        return new main.TodoItem({
            description:description,
            completed:false
        });
    }

});
