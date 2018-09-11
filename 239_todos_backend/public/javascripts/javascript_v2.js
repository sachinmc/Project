// compile Handlebars
const main_template = Handlebars.compile($('#main_template').html());
const title_template = Handlebars.compile($('#title_template').html());
const list_template = Handlebars.compile($('#list_template').html());
const all_todos_template = Handlebars.compile($('#all_todos_template').html());
const all_list_template = Handlebars.compile($('#all_list_template').html());
const completed_todos_template = Handlebars.compile($('#completed_todos_template').html());
const completed_list_template = Handlebars.compile($('#completed_list_template').html());

// register partials
Handlebars.registerPartial('all_todos_template', $('#all_todos_template').html());
Handlebars.registerPartial('all_list_template', $('#all_list_template').html());
Handlebars.registerPartial('completed_todos_template', $('#completed_todos_template').html());
Handlebars.registerPartial('completed_list_template', $('#completed_list_template').html());
Handlebars.registerPartial('title_template', $('#title_template').html());
Handlebars.registerPartial('list_template', $('#list_template').html());
Handlebars.registerPartial('item_partial', $('#item_partial').html());

// current_section object, keeps track of current section
const current_section = {
  title: 'All Todos',
  data: 0,
  current_bar: 'todo',
  displayPage: function() {
    const context = {
      current_section: current_section,
      todos: [],
      done: [],
     };
    $('body').append(main_template(context));
  },
  init: function() {
    this.displayPage();
  }
}
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
  updateHeader: function(title, count) {
    current_section.title = title || current_section.title;
    current_section.data = count;

    $('#items header').children().remove();
    $('#items header').append(title_template({
      current_section: current_section,
    }));
  },
  formatYear: function(json) {
    return json.map(function(todo) {
      todo.year = todo.year.substring(2);
      return todo;
    });
  },
  updateRows: function(json, $target, $checked) {
    if ('title' in json) {
      json = this.formatYear([json])[0];
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
    const self = this;
    $.get('http://localhost:4567/api/todos', function(json) {
      json = self.formatYear(json);

      $('#items tbody').children().remove();

      if (current_section.title === 'All Todos') {
        let completed = json.filter(todo => (todo.completed === true));
        self.updateHeader(null, json.length);
        all_todos_sidebar.updateHeader(json);
        completed_sidebar.updateHeader(completed);
      } else { // clicking on the list
        json = json.filter(function(todo) {
          return todo.month + '/' + todo.year === current_section.title;
        });
        self.updateHeader(null, json.length);
      }

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
  completedRowReq: function() {
    const self = this;
    $.get('http://localhost:4567/api/todos', function(json) {
      json = self.formatYear(json);

      $('#items tbody').children().remove();

      let completed = json.filter(function(todo) {
        return todo.completed === true;
      });

      if (current_section.title === 'Completed') {
        self.updateHeader(null, completed.length);
        completed_sidebar.updateHeader(completed);
        $('tbody').append(list_template({ selected: completed }));
      } else { // clicking on the list
        completed = completed.filter(function(todo) {
          return todo.month + '/' + todo.year === current_section.title;
        });
        self.updateHeader(null, completed.length);
        $('tbody').append(list_template({ selected: completed }));
      }
    },'json');
  },
  markRowReq: function() {
    event.preventDefault();

    let data;
    const self = this;
    const $target = $(event.target); //td.list-item

    if ($target.is('label')) { return; } // label click (on row link) for display Modal

    const id = $target.parents('tr').attr('data-id');
    const $checked = $target.children(':checked');
    data = $checked.length > 0 ? { completed: false } : { completed: true };

    $.ajax({
      url: 'http://localhost:4567/api/todos/' + id,
      method: 'PUT',
      data: data,
      success: function(json) {
        self.updateRows({}, $target, $checked);
        completed_sidebar.displayAllListsReq();
        if (current_section.current_bar === 'completed') {
          self.completedRowReq();
        }
      },
    });
  },
  deleteRowReq: function() {
    event.preventDefault();
    const self = this;
    const $target = $(event.target);
    const id = $target.parents('tr').attr('data-id');
    $.ajax({
      url: 'http://localhost:4567/api/todos/' + id,
      method: 'DELETE',
      success: function() {
        $target.parents('tr').remove();
        current_section.data -= 1
        self.updateHeader(null, current_section.data);
        all_todos_sidebar.displayAllListsReq();
        completed_sidebar.displayAllListsReq();
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
      main_page_object.updateHeader('All Todos', null); // go back to main page
      main_page_object.displayRowReq(); // go back to main page
      all_todos_sidebar.displayAllListsReq();
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
        main_page_object.displayRowReq();
        all_todos_sidebar.displayAllListsReq();
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
const all_todos_sidebar = {
  updateHeader: function(todos) {
    $('#all_todos').children().remove();
    $('#all_todos').append(all_todos_template({
      todos: todos,
    }));
  },
  displayAllLists: function() {
    $('#all_lists').children().remove();
    $('#all_lists').append(all_list_template({
      todos_by_date: this.todos_by_date,
    }));
  },
  displayAllListsReq: function() {
    const self = this;
    let dates;
    $.get('http://localhost:4567/api/todos', function(data) {
      dates = data.map(function(todo) {
        return todo.month + '/' + todo.day + '/' + todo.year;
      });
      self.updateHeader(data);
      self.processSideBar(dates);
    });
  },
  sortDates: function(dates) {
    dates = dates.map(date => (new Date(date)));
    dates.sort(function(a, b) {
      return a - b;
    });
    return dates; // array of Date objects
  },
  formatDates: function(dates) {
    return dates.map(function(date) {
      let month = String(date.getMonth() + 1);
      let year = String(date.getFullYear());
      if (month.length < 2) { month = '0' + month; };
      year = year.substring(2);
      return month + '/' + year;
    });
  },
  buildTodosObj: function(dates) {
    // reset todos_by_date
    this.todos_by_date = {};
    for (let i = 0; i < dates.length; i += 1) {
      if (this.todos_by_date.hasOwnProperty(dates[i])) {
        this.todos_by_date[dates[i]].push(1);
      } else {
        this.todos_by_date[dates[i]] = [1];
      }
    }
  },
  processSideBar: function(dates) {
    let sorted_dates = this.sortDates(dates); // sorted date objects
    let formatted_dates = this.formatDates(sorted_dates);
    this.buildTodosObj(formatted_dates);
    this.displayAllLists();
  },
  navigate: function() {
    event.preventDefault();
    current_section.current_bar = 'todo';

    let data_title;
    let data_total;
    const $target = $(event.target).closest('dl');
    const $targetHeader = $(event.currentTarget);

    if ($targetHeader.is('#all_todos')) {
      data_title = $targetHeader.children('header').attr('data-title');
      data_total = $targetHeader.children('header').attr('data-total');
    } else if (!$target.is('dl')) { // correction for CSS outside click
      return;
    } else {
      data_title = $target.attr('data-title');
      data_total = $target.attr('data-total');
    }

    main_page_object.updateHeader(data_title, data_total);
    main_page_object.displayRowReq();
  },
  bindEvents: function() {
    $('#all_lists').on('click', this.navigate);
    $('#all_todos').on('click', this.navigate);
  },
  init: function() {
    this.todos_by_date = {}; // {'06/19':[], '03/20':[] ...}
    this.displayAllListsReq();
    this.bindEvents();
  },
}
// the completed_sidebar object
const completed_sidebar = {
  updateHeader: function(done) {
    $('#completed_todos').children().remove();
    $('#completed_todos').append(completed_todos_template({
      done: done,
    }));
  },
  displayCompletedLists: function() {
    $('#completed_lists').children().remove();
    $('#completed_lists').append(completed_list_template({
      done_todos_by_date: this.done_todos_by_date,
    }));
  },
  displayAllListsReq: function() {
    const self = this;
    let dates;
    $.get('http://localhost:4567/api/todos', function(data) {
      data = data.filter(function(todo) {
        return todo.completed === true;
      });
      dates = data.map(function(todo) {
        return todo.month + '/' + todo.day + '/' + todo.year;
      });
      self.updateHeader(data);
      self.processSideBar(dates);
    });
  },
  sortDates: function(dates) {
    dates = dates.map(date => (new Date(date)));
    dates.sort(function(a, b) {
      return a - b;
    });
    return dates; // array of Date objects
  },
  formatDates: function(dates) {
    return dates.map(function(date) {
      let month = String(date.getMonth() + 1);
      let year = String(date.getFullYear());
      if (month.length < 2) { month = '0' + month; };
      year = year.substring(2);
      return month + '/' + year;
    });
  },
  buildDoneTodosObj: function(dates) {
    // reset done_todos_by_date
    this.done_todos_by_date = {};
    for (let i = 0; i < dates.length; i += 1) {
      if (this.done_todos_by_date.hasOwnProperty(dates[i])) {
        this.done_todos_by_date[dates[i]].push(1);
      } else {
        this.done_todos_by_date[dates[i]] = [1];
      }
    }
  },
  processSideBar: function(dates) {
    let sorted_dates = this.sortDates(dates); // sorted date objects
    let formatted_dates = this.formatDates(sorted_dates);
    this.buildDoneTodosObj(formatted_dates);
    this.displayCompletedLists();
  },
  navigate: function() {
    event.preventDefault();
    current_section.current_bar = 'completed';
    let data_title;
    let data_total;
    const $target = $(event.target).closest('dl');
    const $targetHeader = $(event.currentTarget);

    if ($targetHeader.is('#completed_todos')) {
      data_title = $targetHeader.children('header').attr('data-title');
      data_total = $targetHeader.children('header').attr('data-total');
    } else if (!$target.is('dl')) { // correction for CSS outside click
      return;
    } else {
      data_title = $target.attr('data-title');
      data_total = $target.attr('data-total');
    }

    main_page_object.updateHeader(data_title, data_total);
    main_page_object.completedRowReq();
  },
  bindEvents: function() {
    $('#completed_lists').on('click', this.navigate);
    $('#completed_todos').on('click', this.navigate);
  },
  init: function() {
    this.done_todos_by_date = {};
    this.displayAllListsReq();
    this.bindEvents();
  },
}
// initialization
current_section.init();
main_page_object.init();
modal_object.init();
all_todos_sidebar.init();
completed_sidebar.init();
