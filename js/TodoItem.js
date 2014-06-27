$r.package("main").Class("TodoItem").extends("EventDispatcher")(function () {

    var _description,_completed,_sourceItem;

    this.get("sourceItem", function(){

        return _sourceItem
    });

    this.get("description", function(){

        return _description
    });
    this.set("description", function(value){

        _description = value;
        this.dispatchEvent(new $r.Event("descriptionChanged"));
    })

    this.get("completed", function(){

        return _completed
    });
    this.set("completed", function(value){

        _completed = value;
        this.dispatchEvent(new $r.Event("completedChanged"));
    })

    this.init = function (item) {

        this.super.init();
        if(item)
        {
            _sourceItem = item;
            this.description = item.description;
            this.completed = item.completed;
        }
    }

});