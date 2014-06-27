
$r.package("main");

$r.package("main").skins(
        {skinClass:'AppSkin', skinURL:"skins/appSkin.html"},
        {skinClass:'TodoListItemRendererSkin', skinURL:"skins/todoListItemRendererSkin.html"}
);

$r.Application('todoApp', function()
{
    var main = $r.package("main");
    var noOfActiveItems = 0,noOfCompletedItems = 0,todoModel,todoController;

    var setAppState = this.bind(setAppStateFn);
    var setTodoCountContent = this.bind(setTodoCountContentFn);
    var handleCompletedItemsChanged = this.bind(handleCompletedItemsChangedFn);
    this.init = function()
    {
        //Calling the init on the super class is a must, one of the limitations of the framework.
        this.super.init();

        //setting the ski class  for the App.Notice the use of qualified classname that is "packageName.className"
        this.skinClass = "main.AppSkin";

        //now initializing the model and controller
        todoModel =  new main.TodoModel();
        todoModel.observe("noOfActiveItems", handleActiveItemsChanged)
        todoModel.observe("noOfCompletedItems", handleCompletedItemsChanged);

        todoController =  new main.TodoController(this, todoModel);
        //adding event listener to the model so the view can react to the changes in the model


        setAppState();

    }

    this.newTodoInput = null;
    this.filterAll = null;
    this.filterActive = null;
    this.filterActive = null;
    this.clearCompletedBtn = null;
    this.todoCount = null;
    this.todoCountValue = null;

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
        }

        if(partName === "todo-list")
        {
            instance.dataProvider = todoModel.todoList;
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
    }

    function setAppStateFn(){


        if(todoModel.todoList.length > 0)
        {
            this.currentState = "hastodoitems";
        }
    }


    function handleActiveItemsChanged(){

        noOfActiveItems = todoModel.noOfActiveItems;
        setTodoCountContent();
    }

    function handleCompletedItemsChangedFn(){

        noOfCompletedItems = todoModel.noOfCompletedItems;

        if(this.clearCompletedBtn)
        {
            if(noOfCompletedItems.length > 0)
            {
                this.clearCompletedBtn.display = "";
                this.clearCompletedBtn.textContent = "Clear completed(" + noOfCompletedItems + ")";
            }
            else
            {
                this.clearCompletedBtn.display = "none";
            }
        }
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



});

