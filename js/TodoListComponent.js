$r.package("main").Class("TodoListComponent").extends("DataGroup")(function(){

    this.init = function () {
        this.super.init();
        this[0] = document.createElement("ul");

    };


});