// compile Handlebars
const main_template = Handlebars.compile($('#main_template').html());
const list_template = Handlebars.compile($('#list_template').html());

// register partials
Handlebars.registerPartial('all_todos_template', $('#all_todos_template').html());
Handlebars.registerPartial('all_list_template', $('#all_list_template').html());
Handlebars.registerPartial('completed_todos_template', $('#completed_todos_template').html());
Handlebars.registerPartial('completed_list_template', $('#completed_list_template').html());
Handlebars.registerPartial('title_template', $('#title_template').html());
Handlebars.registerPartial('list_template', $('#list_template').html());
Handlebars.registerPartial('item_partial', $('#item_partial').html());

// the main page object
const main_page_object = {
  displayModal: function() {
    event.preventDefault(); // prevents checking the rows
    const $currentTarget = $(event.currentTarget);
    const $target = $(event.target);
    const row_id = +$target.parents('tr').attr('data-id');
    $('#form_modal').css({
      "display": "block",
      "top": "200px",
    }).show();
    $('#modal_layer').show();
    if (!$currentTarget.is('label')) {
      modal_object.idStore = row_id;
      this.fillFormReq(row_id);
    } else {
      modal_object.idStore = null;
    }
  },
  hideModal: function() {
    $('form').get(0).reset();
    $('#form_modal').hide();
    $('#modal_layer').hide();
  },
  displayHeader: function() {
    const context = { current_section: this.current_section };
    $('body').append(main_template(context));
  },
  updateRows: function(json, $target, $checked) {
    if ('title' in json) {
      if ($('tr[data-id=' + json.id + ']').length) {
        $('tr[data-id=' + json.id + ']').remove();
      }
      $('tbody').append(list_template({ selected: [json] }));
    } else {
      this.markRow($target, $checked);
    }

    let $pending_todos =
      $('tbody').find('input[type=checkbox]:not(:checked)').parents('tr');
    let $completed_todos =
      $('tbody').find(':checked').parents('tr');

    $pending_todos = $pending_todos.remove();
    $completed_todos = $completed_todos.remove();

    $pending_todos = this.sortRowsById($pending_todos);
    $completed_todos = this.sortRowsById($completed_todos);

    $('tbody').prepend($pending_todos);
    $('tbody').append($completed_todos);
  },
  markRow: function($target, $checked) {
    if ($checked.length) {
      $target.children('input[type=checkbox]').prop('checked', false);
    } else {
      $target.children('input[type=checkbox]').prop('checked', true);
    }
  },
  sortRowsById: function($todos) {
    let todos = Array.prototype.slice.call($todos);
    todos.sort(function(a,b) {
      return +$(a).attr('data-id') - +$(b).attr('data-id');
    });
    return $(todos);
  },
  fillFormReq: function(id) {
    let todo;
    $.get('http://localhost:4567/api/todos', function(json) {
      todo = json.filter(todoItem => todoItem.id === id);
      $('#title').val(todo[0].title);
      $('#due_day').val(todo[0].day);
      $('#due_month').val(todo[0].month);
      $('#due_year').val(todo[0].year);
      $('textarea[name=description]').val(todo[0].description);
    },'json');
  },
  displayRowReq: function() {
    $.get('http://localhost:4567/api/todos', function(json) {
      const pending = json.filter(function(todo) {
        return todo.completed === false;
      });
      const completed = json.filter(function(todo) {
        return todo.completed === true;
      });
      $('tbody').append(list_template({ selected: pending }));
      $('tbody').append(list_template({ selected: completed }));
    },'json');
  },
  markRowReq: function() {
    event.preventDefault();
    let data;
    const self = this;
    const $target = $(event.target); //td.list-item
    if ($target.is('label')) { return; } // label click indicates form update
    const id = $target.parents('tr').attr('data-id');
    const $checked = $target.children(':checked');
    data = $checked.length > 0 ? { completed: false } : { completed: true };
    $.ajax({
      url: 'http://localhost:4567/api/todos/' + id,
      method: 'PUT',
      data: data,
      success: function() {
        self.updateRows({}, $target, $checked);
      },
    });
  },
  deleteRowReq: function() {
    event.preventDefault();
    const $target = $(event.target);
    const id = $target.parents('tr').attr('data-id');
    $.ajax({
      url: 'http://localhost:4567/api/todos/' + id,
      method: 'DELETE',
      success: function() {
        $target.parents('tr').remove();
      },
    });
  },
  bindEvents: function() {
    $('tbody').on('click', 'td.list_item', $.proxy(this.markRowReq, this));
    $('tbody').on('click', 'td.delete', $.proxy(this.deleteRowReq, this));

    $('label[for=new_item]').on('click', $.proxy(this.displayModal, this));
    $('tbody').on('click', 'td.list_item label', $.proxy(this.displayModal, this));
    $('#modal_layer').on('click', this.hideModal);
  },
  init: function() {
    this.current_section = {
      title: 'All Todos',
      data: 0,
    };
    this.displayHeader();
    this.displayRowReq();
    this.bindEvents();
  },
};

// the modal object
const modal_object = {
  submitModal: function() {
    event.preventDefault();
    if (this.idStore) {
      this.updateRowsReq();
    } else {
      this.addRowsReq();
    }
    main_page_object.hideModal();
  },
  addRowsReq: function() {
    const data = {
      title: $('#title').val(),
      day: $('#due_day').val(),
      month: $('#due_month').val(),
      year:$('#due_year').val(),
      description: $('textarea[name=description]').val(),
      completed: false,
    };
    console.log('add rows request');
    $.post('http://localhost:4567/api/todos', data, function(json) {
      main_page_object.updateRows(json, null, null);
    },'json');
  },
  updateRowsReq: function() {
    const self = this;
    const selector = 'tr[data-id=' + self.idStore + ']' + ' input';
    const status = $(selector).is(':checked');

    const data = {
      title: $('#title').val(),
      day: $('#due_day').val(),
      month: $('#due_month').val(),
      year:$('#due_year').val(),
      description: $('textarea[name=description]').val(),
      completed: status,
    };
    $.ajax({
      url: 'http://localhost:4567/api/todos/' + self.idStore,
      method: 'PUT',
      data: data,
      success: function(json) {
        main_page_object.updateRows(json, null, null);
      }
    });
  },
  markCompleteReq: function() {
    event.preventDefault();
    const self = this;
    if (!self.idStore) {
      confirm('Cannot mark as complete as item has not been created yet!');
      return;
    }
    $.ajax({
      url: 'http://localhost:4567/api/todos/' + self.idStore,
      method: 'PUT',
      data: { completed: true },
      success: function(json) {
        main_page_object.updateRows(json, null, null);
      }
    });
    main_page_object.hideModal();
  },
  bindEvents: function() {
    $('input[type=submit]').on('click', $.proxy(this.submitModal, this));
    $('button[name=complete]').on('click', $.proxy(this.markCompleteReq, this));
  },
  init: function() {
    this.idStore; // set by main page object
    this.bindEvents();
  },
}

// the all_todos_sidebar object

// the completed_sidebar object

main_page_object.init();
modal_object.init();
