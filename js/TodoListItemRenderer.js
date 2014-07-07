$r.package("main").Class("TodoListItemRenderer").extends("ListItemRenderer")(function(){

    var main = $r.package("main")

    //binding functions
    var handleCompletedCheckboxClicked = this.bind(handleCompletedCheckboxClickedFn);
    var setCurrentState = this.bind(setCurrentStateFn);
    var handleRemoveTodoItem = this.bind(handleRemoveTodoItemFn);
    var handleCompletedStatusChanged = this.bind(handleCompletedStatusChangedFn);
    var handleDoubleClick = this.bind(handleDoubleClickFn);
    var handleMouseDownAnywhere = this.bind(handleMouseDownAnywhereFn);
    var handleEnterOnEditing = this.bind(handleEnterOnEditingFn);
    var handleDescriptionChange = this.bind(handleDescriptionChangeFn);
    var removeEditingState = this.bind(removeEditingStateFn);

    this.descriptionLabel = null;
    this.completedCheckbox = null;
    this.editingInput = null;
    this.removeButton = null;

    this.skinParts = [{id:"descriptionLabel",required:true},
        {id:"completedCheckbox",required:true},
        {id:"removeButton",required:true},
        {id:"editingInput",required:true}]

    this.init = function () {
        this.super.init();
        this.skinClass = "main.TodoListItemRendererSkin";
        this.addEventListener("dblclick", handleDoubleClick);
        window.addEventListener("mousedown", handleMouseDownAnywhere);
    };


    this.set("data", function(value){

        if(value !== null)
        {
            this.super.data = value;
         if(this.descriptionLabel)
            this.descriptionLabel.textContent = value.description;

            if(this.completedCheckbox)
                this.completedCheckbox[0].checked = value.completed;
            setCurrentState();

            value.observe("completed", handleCompletedStatusChanged)

        }
    })

    function handleCompletedStatusChangedFn(){
        setCurrentState();
        this.completedCheckbox[0].checked = this.data.completed
    }

    this.partAdded = function(partName, instance){
        this.super.partAdded(partName, instance);
        if(instance === this.descriptionLabel)
        {
            if(this.data)
                this.descriptionLabel.textContent = this.data.description;
        }

        if(instance === this.completedCheckbox)
        {
            this.completedCheckbox.addEventListener("click", handleCompletedCheckboxClicked);

            if(this.data)
                this.completedCheckbox[0].checked = this.data.completed;
        }

        if(instance === this.removeButton)
        {
            this.removeButton.addEventListener("click", handleRemoveTodoItem);
        }

        if(instance === this.editingInput)
        {
            this.editingInput.addEventListener("keydown", handleEnterOnEditing);
            this.editingInput.addEventListener("blur", handleDescriptionChange);
        }
    }

    function handleEnterOnEditingFn(event){
        if(event.keyCode === 13)
        {
            removeEditingState();
        }

    }

    function handleMouseDownAnywhereFn(event){

        if(event.target !== this.editingInput[0] && this.currentState === "editing")
        {
            removeEditingState();
        }

    }

    function removeEditingStateFn(){
        this.editingInput[0].blur();
        setCurrentState(false)

    }

    function handleDoubleClickFn(event){

        setCurrentState(true);
        this.editingInput[0].value = this.data.description;
        this.editingInput[0].focus();
    }

    function handleDescriptionChangeFn(event){
        this.data.description = this.editingInput[0].value;
        this.descriptionLabel.textContent = this.data.description;

    }

    function handleRemoveTodoItemFn(event){

        var removeEvent = new  main.TodoListItemRendererEvent(main.TodoListItemRendererEvent.TODO_ITEM_DELETED, this.data);
        this.dispatchEvent(removeEvent);
    }


    function handleCompletedCheckboxClickedFn(event){

        this.data.completed = event.target.checked;


    }

    function setCurrentStateFn(editing){
      if(this.data)
      {
          if(!editing)
          {
              if(this.data.completed)
              {
                  this.currentState = "completed"
              }
              else
              {
                  this.currentState = null;
              }
          }
          else
          {
              this.currentState = "editing"
          }

      }

    }


});