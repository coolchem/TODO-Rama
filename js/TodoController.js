$r.package("main").Class("TodoController")(function(){

  var main = $r.package("main");
  var _view,_model;

  this.init = function(view,model){

      _view = view;
      _model = model;
      _model.initialize();
  }

  this.addTodoItem = function(event){

      event.stopImmediatePropagation();
      event.preventDefault();

      if(_view.newTodoInput[0].value !== "")
      {
          _model.addTodoItem(_view.newTodoInput[0].value);
          _view.newTodoInput[0].value = "";
          _view.validateState();
      }

  }

  this.removeTodoItem = function(event){

      _model.removeTodoItem(event.todoItem);
  }

  this.filterTodoItems = function(event){


      if(event.target === _view.filterCompleted[0])
      {
          _model.applyFilter("filterCompleted");
          window.location.hash = "#/completed";


      }
      else if(event.target === _view.filterActive[0])
      {
          _model.applyFilter("filterActive");
          window.location.hash = "#/active";
      }
      else
      {
          _model.applyFilter("");
          window.location.hash = "#/";
      }

      _view.validateState();
  }

  this.clearCompletedItems = function(event){

      _model.clearCompletedItems();
  }

  this.toggleAllItems = function(event){

     _model.toggleAllItems(event.target.checked);
  }

  this.toggleTodoItemStatus = function(event){

     console.log(event);
  }


});