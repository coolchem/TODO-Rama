
$r.package("main");

$r.package("main").skins(
        {skinClass:'AppSkin', skinURL:"skins/appSkin.html"},
        {skinClass:'TodoListItemRendererSkin', skinURL:"skins/todoListItemRendererSkin.html"}
);

$r.Application('todoApp', function()
{
    var main = $r.package("main");
    var noOfActiveItems = 0,
            noOfCompletedItems = 0,todoModel,todoController,
    locationHashChanged = this.bind(locationHashChangedFn);

    var setTodoCountContent = this.bind(setTodoCountContentFn);
    var handleCompletedItemsChanged = this.bind(handleCompletedItemsChangedFn);



    this.set("noOfActiveItems", function(value){

        noOfActiveItems = value;
        setTodoCountContent();
    })


    this.init = function()
    {
        //Calling the init on the super class is a must, one of the limitations of the framework.
        this.super.init();

        //setting the ski class  for the App.Notice the use of qualified classname that is "packageName.className"
        this.skinClass = "main.AppSkin";

        //now initializing the model and controller
        todoModel =  new main.TodoModel();

        todoModel.bindProperty("noOfActiveItems").with("noOfActiveItems",this);
        todoModel.observe("noOfCompletedItems", handleCompletedItemsChanged);

        todoController =  new main.TodoController(this, todoModel);

        if(window.location.hash === "" || window.location.hash === null || window.location.hash === undefined)
        {
            window.location.hash = "#/"
        }

        this.validateState();

        window.onhashchange = locationHashChanged;

    }

    this.newTodoInput = null;
    this.filterAll = null;
    this.filterActive = null;
    this.filterActive = null;
    this.clearCompletedBtn = null;
    this.todoCount = null;
    this.todoCountValue = null;
    this.toggleAll = null;

    this.skinParts = [{id:'todo-form', required:true},
        {id:'new-todo', required:true},
        {id:'toggle-all', required:true},
        {id:'todo-list', required:true},
        {id:'todoCount', required:true},
        {id:'todoCountValue', required:true},
        {id:'filterAll', required:true},
        {id:'filterActive', required:true},
        {id:'filterCompleted', required:true},
        {id:'clear-completed', required:true}];

    this.partAdded = function(partName, instance){
        this.super.partAdded(partName, instance);

        if(partName === "todo-form")
        {
            instance.addEventListener("submit", todoController.addTodoItem)
        }

        if(partName === "new-todo")
        {
            this.newTodoInput = instance;
            this.newTodoInput.focus();
        }

        if(partName === "todo-list")
        {
            instance.dataProvider = todoModel.todoList;
            instance.addEventListener(main.TodoListItemRendererEvent.TODO_ITEM_DELETED, todoController.removeTodoItem)
        }

        if(instance === this.filterAll || instance === this.filterActive || instance === this.filterCompleted)
        {
            instance.addEventListener("click", todoController.filterTodoItems);
        }

        if(instance === this.todoCount)
        {
            setTodoCountContent()
        }

        if(instance === this.todoCountValue)
        {
            setTodoCountContent();
        }

        if(partName === "clear-completed")
        {
            this.clearCompletedBtn = instance;
            this.clearCompletedBtn.addEventListener("click", todoController.clearCompletedItems);
            handleCompletedItemsChanged();
        }

        if(partName === "toggle-all")
        {
            this.toggleAll = instance;
            this.toggleAll.addEventListener("click", todoController.toggleAllItems)

        }
    }

    this.getCurrentState = function(){


        switch(window.location.hash)
        {
            case "#/" :
            {
                return "all"
            }

            case "#/active" :
            {
                return "active"
            }

            case "#/completed" :
            {
                return "completed"
            }

        }

        if(this.newTodoInput)
            this.newTodoInput.focus();

        return "";
    }


    function handleActiveItemsChanged(){

        noOfActiveItems = todoModel.noOfActiveItems;
        setTodoCountContent();
    }

    function handleCompletedItemsChangedFn(){

        noOfCompletedItems = todoModel.noOfCompletedItems;

        if(this.clearCompletedBtn)
        {
            if(noOfCompletedItems > 0)
            {
                this.clearCompletedBtn.display = "";
                this.clearCompletedBtn.textContent = "Clear completed(" + noOfCompletedItems + ")";
            }
            else
            {
                this.clearCompletedBtn.display = "none";
            }
        }

        if(this.toggleAll)
        {
            if(todoModel.todoList.length > 0 && todoModel.noOfCompletedItems === todoModel.todoList.length)
                this.toggleAll[0].checked = true;
            else
                this.toggleAll[0].checked = false;
        }

        this.validateState();
    }

    function setTodoCountContentFn(){

        if(this.todoCount && this.todoCountValue)
        {
            var remainingCount = ""
            if(noOfActiveItems > 1)
            {
                remainingCount = " items left";
            }
            else
            {
                remainingCount = " item left";
            }

            this.todoCountValue.textContent = todoModel.noOfActiveItems;
            this.todoCount.textContent = remainingCount;
        }
    }

    function locationHashChangedFn(){
       this.validateState();
    }



});

