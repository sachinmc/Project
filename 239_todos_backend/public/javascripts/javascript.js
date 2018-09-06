const todo = {
  current_section: {
    title: "All todos",
    data: 0,
  },
  updateTodoCount: function(count) {
    this.current_section.data = count;
    $('#items header dd').text(count);
  },
  submitForm: function() {
    event.preventDefault();
    console.log('from inside submit form', this.current_todo);
    if (this.current_todo !== undefined) {
      this.updateTodo();
    } else {
      this.addTodo();
    }
  },
  addTodo: function() {
    event.preventDefault();
    const self = this;
    let data = {
      title: $('#title').val(),
      day: $('#due_day').val(),
      month: $('#due_month').val(),
      year:$('#due_year').val(),
      description: $('textarea[name=description]').val(),
      completed: false,
    };
    $.ajax({
      url: 'http://localhost:4567/api/todos',
      method: 'POST',
      data: data,
      success: function(json) {
        self.updateTodoCount(self.current_section.data += 1);
        let $checked_item = $('tbody').find(':checked').eq(0);

        if ($checked_item.length > 0) {
          $checked_item.parents('tr').before(self.list_template({ selected: [json] }));
        } else {
          $('tbody').append(self.list_template({ selected: [json] }));
        }

        $('form').get(0).reset();
        self.hideForm();
      },
      error: function(jqxhr){
        alert(jqxhr.responseText + ", bad attributes.");
      },
    });
  },
  updateTodo: function() {
    const self = this;
    let completed = $('input[id=item_' + self.current_todo + ']').is(':checked');

    let data = {
      title: $('#title').val(),
      day: $('#due_day').val(),
      month: $('#due_month').val(),
      year:$('#due_year').val(),
      description: $('textarea[name=description]').val(),
      completed: completed,
    };

    $.ajax({
      url: 'http://localhost:4567/api/todos/' + self.current_todo,
      method: 'PUT',
      data: data,
      success: function(json) {
        let update_title_date = json.title + ' - ' + json.month + '/' + json.year;
        let $to_update = $('body').find('label[for=item_' + self.current_todo + ']');
        $to_update.text(update_title_date);
        $('form').get(0).reset();
        self.hideForm();
      },
      error: function(jqxhr) {
        alert(jqxhr.responseText + ", bad attributes.");
      },
    });
  },
  deleteTodo: function() {
    const self = this;
    let $target = $(event.target);
    let id = $target.parents('tr').attr('data-id');
    $.ajax({
      url: 'http://localhost:4567/api/todos/' + id,
      method: 'DELETE',
      success: function() {
        self.updateTodoCount(self.current_section.data -= 1);
        $target.parents('tr').remove();
      },
    });
  },
  displayForm: function() {
    event.preventDefault();
    let self = this;
    let $target = $(event.target);
    let $currentTarget = $(event.currentTarget);

    $('#form_modal').css({
      "display": "block",
      "top": "200px",
    }).show();
    $('#modal_layer').show();

    if ($currentTarget.is('label')) {
      self.current_todo = undefined;
      console.log('label for add new todo', self.current_todo);
    } else if ($target.is('label')) {
      self.current_todo = +$target.parents('tr').attr('data-id');
      this.fillForm(self.current_todo);
      console.log('label for update todo', self.current_todo);
    }
  },
  fillForm: function(id) {
    let todo;

    $.ajax({
      url: 'http://localhost:4567/api/todos',
      method: 'GET',
      dataType: 'json',
      success: function(json) {
        todo = json.filter(todoItem => todoItem.id === id);
        $('#title').val(todo[0].title);
        $('#due_day').val(todo[0].day);
        $('#due_month').val(todo[0].month);
        $('#due_year').val(todo[0].year);
        $('textarea[name=description]').val(todo[0].description);
      },
    });
  },
  hideForm: function() {
    $('form').get(0).reset();
    $('#form_modal').hide();
    $('#modal_layer').hide();
  },
  buildPage: function() {
    const self = this;
    const $items = $('body').find('#items');
    if ($items.length > 0) {
      $('body').find('#items').remove();
      $('body').append($items);
      return;
    }
    $('body').append(self.main_template({
      current_section: self.current_section,
    }));
    $.ajax({
      url: 'http://localhost:4567/api/todos',
      method: 'GET',
      dataType: 'json',
      success: function(json) {
        self.updateTodoCount(json.length);
        $('tbody').append(self.list_template({ selected: json }));
      },
    });
  },
  compileTemplates: function() {
    this.main_template = Handlebars.compile($('#main_template').html());
    this.list_template = Handlebars.compile($('#list_template').html());

    //Handlebars.registerHelper to split year

    Handlebars.registerPartial('all_todos_template', $('#all_todos_template').html());
    Handlebars.registerPartial('all_list_template', $('#all_list_template').html());
    Handlebars.registerPartial('completed_todos_template', $('#completed_todos_template').html());
    Handlebars.registerPartial('completed_list_template', $('#completed_list_template').html());
    Handlebars.registerPartial('title_template', $('#title_template').html());
    Handlebars.registerPartial('list_template', $('#list_template').html());
    Handlebars.registerPartial('item_partial', $('#item_partial').html());
  },
  markComplete: function() {
    event.preventDefault();
    const self = this;
    if (self.current_todo === undefined) {
      alert('Cannot mark as complete as item has not been created yet!');
    } else {
      $.ajax({
        url: 'http://localhost:4567/api/todos/' + self.current_todo,
        method: 'PUT',
        data: { completed: true },
        success: function() {
          $('input[id=item_' + self.current_todo + ']').prop('checked', true);
          let row = $('tr[data-id=' + self.current_todo + ']').remove();
          $('tbody').append(row);
          self.hideForm();

          //move completed items to the end of the array also
        },
        error: function(jqxhr) {
          alert(jqxhr.responseText);
        },
      });
    }
  },
  bindEvents: function() {
    $("label[for='new_item']").on('click', $.proxy(this.displayForm, this));
    $('tbody').on('click', 'td.list_item label', $.proxy(this.displayForm, this));
    $('input[type=submit]').on('click', $.proxy(this.submitForm, this));

    $('#modal_layer').on('click', this.hideForm);

    $('button[name=complete]').on('click', $.proxy(this.markComplete, this));
    $('tbody').on('click', 'td.delete', $.proxy(this.deleteTodo, this));


    //$('tbody').on('click', 'td.list_item', this.markComplete);
  },
  init: function() {
    this.current_todo;
    this.compileTemplates();
    this.buildPage();
    this.bindEvents();
  }
}

$($.proxy(todo.init, todo));
