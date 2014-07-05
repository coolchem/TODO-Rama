$r.package("main").Class("TodoListItemRenderer").extends("Component")(function(){

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

    var _data;
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

    this.get("data", function(){
        return _data;
    })

    this.set("data", function(value){

        _data = value;
        if(_data)
        {
         if(this.descriptionLabel)
            this.descriptionLabel.textContent = _data.description;

            if(this.completedCheckbox)
                this.completedCheckbox[0].checked = _data.completed;
            setCurrentState();

            _data.observe("completed", handleCompletedStatusChanged)

        }
    })

    function handleCompletedStatusChangedFn(){
        setCurrentState();
        this.completedCheckbox[0].checked = _data.completed
    }

    this.partAdded = function(partName, instance){
        this.super.partAdded(partName, instance);
        if(instance === this.descriptionLabel)
        {
            if(_data)
                this.descriptionLabel.textContent = _data.description;
        }

        if(instance === this.completedCheckbox)
        {
            this.completedCheckbox.addEventListener("click", handleCompletedCheckboxClicked);

            if(_data)
                this.completedCheckbox[0].checked = _data.completed;
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
        this.editingInput[0].value = _data.description;
        this.editingInput[0].focus();
    }

    function handleDescriptionChangeFn(event){
        _data.description = this.editingInput[0].value;
        this.descriptionLabel.textContent = _data.description;

    }

    function handleRemoveTodoItemFn(event){

        var removeEvent = new  main.TodoListItemRendererEvent(main.TodoListItemRendererEvent.TODO_ITEM_DELETED, _data);
        this.dispatchEvent(removeEvent);
    }


    function handleCompletedCheckboxClickedFn(event){

       _data.completed = event.target.checked;


    }

    function setCurrentStateFn(editing){
      if(_data)
      {
          if(!editing)
          {
              if(_data.completed)
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