$r.package("main").Class("TodoModel").extends("Model")(function () {

    var main = $r.package("main");

    var items,localStorage, removeEditingState;

    var activeTodoList = new $r.Collection();

    var _currentFilter = "";

    this.noOfActiveItems = 0;
    this.noOfCompletedItems = 0;
    this.noOfTodoItems = 0;

    var handleTodoItemCompletedStatusChanged = this.bind(handleTodoItemCompletedStatusChangedFn);
    var createTodoItem = this.bind(createTodoItemFn);
    var removeTodoItem = this.bind(removeTodoItemFn);

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
            makeItemObservable(item);
            if(item.completed === false)
            {
                this.noOfActiveItems += 1;
            }
            else
            {
                this.noOfCompletedItems += 1;
            }
        }

        activeTodoList.source = items;
        this.noOfTodoItems = activeTodoList.length;
    }

    this.addTodoItem = function(description){

        createTodoItem(activeTodoList,description);
        updateLocalStorage();

    }

    this.removeTodoItem = function(item){

      if(item !== null && item !== undefined)
      {
          if(activeTodoList.getItemIndex(item) !== -1)
          {
              activeTodoList.removeItem(item);
          }
      }

        if(item.completed === true)
        {
            this.noOfCompletedItems -= 1;
        }
        else
        {
            this.noOfActiveItems -= 1;
        }

        updateLocalStorage()
    }

    this.clearCompletedItems = function(){

        for (var i = activeTodoList.length - 1; i >= 0; i -= 1) {

            var item = activeTodoList.source[i];
            if(item.completed === true)
            {
                activeTodoList.removeItem(item);
            }
        }

        this.noOfActiveItems = activeTodoList.length;
        this.noOfCompletedItems = 0;
        updateLocalStorage()
    }

    this.toggleAllItems = function(value){

        activeTodoList.forEach(function(todoItem){

            todoItem.completed = value;

        }, this)

        if(value === true)
            this.noOfCompletedItems = activeTodoList.length;
        else
            this.noOfActiveItems = activeTodoList.length;

        updateLocalStorage()
    }

    var allTodoItems = null;
    this.applyFilter = function (filterType)
    {
        if (filterType !== _currentFilter) {
            var newArray = [];
            _currentFilter = filterType;

            if(filterType !== "")
            {
                if(allTodoItems === null)
                    allTodoItems = activeTodoList.source;

                var newArray = [];

                $r.forEach(allTodoItems, function(todoItem){

                    if (_currentFilter === "filterActive" && todoItem.completed === false) {
                        newArray.push(todoItem);
                    }
                    else if (_currentFilter === "filterCompleted" && todoItem.completed === true) {
                        newArray.push(todoItem);
                    }
                })

                activeTodoList.source = newArray;
            }
            else {

                activeTodoList.source = items;
                allTodoItems = null;
            }
        }
    };

    this.get("todoList", function () {

        return activeTodoList;
    });

    function makeItemObservable(item){
        $r.Observable(item);
        item.observe("completed", handleTodoItemCompletedStatusChanged);
        item.observe("description", handleTodoItemDescriptionChanged);

    }
    function addTodoItemToList(list, todoItem)
    {
        makeItemObservable(todoItem);
        list.addItem(todoItem);

    }

    function removeTodoItemFn(item){
        if(item !== null && item !== undefined)
        {
            if(activeTodoList.getItemIndex(item) !== -1)
            {
                activeTodoList.removeItem(item);
            }
        }

        if(item.completed === true)
        {
            this.noOfCompletedItems -= 1;
        }
        else
        {
            this.noOfActiveItems -= 1;
        }

        updateLocalStorage()

    }

    function createTodoItemFn(list,description){

        var todoItem = {
            description:description,
            completed:false
        };
        addTodoItemToList(list,todoItem);
        this.noOfActiveItems += 1;
    }

    function handleTodoItemDescriptionChanged(item,oldValue, newValue){

       if(!item.description || item.description === "")
       {
           removeTodoItem(item);
       }
       else
       {
           updateLocalStorage();
       }

    }

    function handleTodoItemCompletedStatusChangedFn(item,oldValue, newValue){

       if(oldValue === false)
       {
           this.noOfActiveItems -= 1;
           this.noOfCompletedItems += 1;
       }
       else
       {
           this.noOfActiveItems += 1;
           this.noOfCompletedItems -= 1;
       }

        updateLocalStorage();
    }

    function updateLocalStorage(){

        if (localStorage)
            localStorage.setItem('todos-rama', JSON.stringify(items));

    }

});
