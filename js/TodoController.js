$r.package("main").Class("TodoController")(function(){

  var main = $r.package("main");
  var _view,_model;

  this.init = function(view,model){

      _view = view;
      _model = model;

      //adding event listener for change in checkbox of individual item.
      _view.addEventListener("completedCheckBoxClicked", this.toggleTodoItemStatus)

      _model.initialize();
  }

  this.addTodoItem = function(event){

      event.stopImmediatePropagation();
      event.preventDefault();

      if(_view.newTodoInput[0].value !== "")
      {
          _model.addTodoItem(_view.newTodoInput[0].value);
          if(_view.currentState === "")
          {
              _view.currentState = "hastodoitems";
          }

          _view.newTodoInput[0].value = "";
      }

  }

  this.filterTodoItems = function(event){


      if(event.target === _view.filterCompleted[0])
      {
          _model.applyFilter("filterCompleted");
          _view.filterCompleted.setAttribute("class", "selected");
          _view.filterAll.setAttribute("class", "");
          _view.filterActive.setAttribute("class", "");
      }
      else if(event.target === _view.filterActive[0])
      {
          _model.applyFilter("filterActive");
          _view.filterCompleted.setAttribute("class", "");
          _view.filterAll.setAttribute("class", "");
          _view.filterActive.setAttribute("class", "selected");
      }
      else
      {
          _model.applyFilter("");
          _view.filterCompleted.setAttribute("class", "");
          _view.filterAll.setAttribute("class", "selected");
          _view.filterActive.setAttribute("class", "");
      }
  }

  this.clearCompletedItems = function(event){


  }

  this.toggleTodoItemStatus = function(event){


  }


});