$r.package("main").Class("TodoListItemRenderer").extends("Component")(function(){

    var _data;
    this.descriptionLabel = null;
    this.completedCheckbox = null;
    this.editingInput = null;

    this.skinParts = [{id:"descriptionLabel",required:true},
        {id:"completedCheckbox",required:true},
        {id:"removeButton",required:true},
        {id:"editingInput",required:true}]

    this.init = function () {
        this.super.init();
        this.skinClass = "main.TodoListItemRendererSkin";
    };

    this.get("data", function(){
        return _data;
    })

    this.set("data", function(value){

        _data = value;
        if(_data)
        {
          if(_data.completed)
          {
              this.currentState = "completed"
          }

         if(this.descriptionLabel)
            this.descriptionLabel.textContent = _data.description;

            setCurrentState(this);

        }
    })

    this.partAdded = function(partName, instance){
        this.super.partAdded(partName, instance);
        if(instance === this.descriptionLabel)
        {
            if(_data)
                this.descriptionLabel.textContent = _data.description;
        }
    }

    function setCurrentState(_this,editing){
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
                  this.currentState = "";
              }
          }
          else
          {
              this.currentState = "editing"
          }

      }

    }


});