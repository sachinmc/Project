$(function() {
  const todo_main = {

  updateTodoCount: function(count) {
    this.current_section.data = count;
    $('#items header dd').text(count);
  },
  updateSideBarCount: function(pending, completed) {
    $('#all_header').find('dd').text(pending);
    $('#all_done_header').find('dd').text(completed);
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

    if (isNaN(Number(data.day))) {
      data.day = '01';
    }

    if (isNaN(Number(data.month))) {
      data.month = '00';
    }

    if (isNaN(Number(data.year))) {
      data.year = '0000';
    }

    $.ajax({
      url: 'http://localhost:4567/api/todos',
      method: 'POST',
      data: data,
      success: function(json) {
        //self.updateTodoCount(self.current_section.data += 1);
        $.get('http://localhost:4567/api/todos', function(data) {
          self.todos = data;
          self.generateLists(data);
          self.renderSideBar();
          let completed = data.filter(todo => (todo.completed === true));
          self.updateSideBarCount(data.length, completed.length);
          self.displayAllTodoPage();
        }, 'json');

        let $checked_item = $('tbody').find(':checked').eq(0);

        // no due date
        json.ndd = 'No Due Date';
        //
        let data = self.truncateYear([json]);


        if ($checked_item.length > 0) {
          $checked_item.parents('tr').before(self.list_template({ selected: data }));
        } else {
          $('tbody').append(self.list_template({ selected: data }));
        }

        $('form').get(0).reset();
        self.hideForm();
      },
      error: function(jqxhr){
        alert(jqxhr.responseText + ", bad attributes.");
      },
    });
  },
  truncateYear: function(data) {
    return data.map(function(todo) {
      let obj = Object.create(todo);
      obj.year = obj.year.substring(2);
      return obj;
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

    if (data.day === null || isNaN(Number(data.day))) {
      data.day = '01';
    }

    if (data.month === null || isNaN(Number(data.month))) {
      data.month = '00';
    }

    if (data.year === null || isNaN(Number(data.year))) {
      data.year = '0000';
    }

    $.ajax({
      url: 'http://localhost:4567/api/todos/' + self.current_todo,
      method: 'PUT',
      data: data,
      success: function(json) {
        /*
        let update_title_date;
        let date;
        if (json.month === '00'|| json.year === '0000') {
          update_title_date = json.title + ' - ' + 'No Due Date';
          date = 'No Due Date';
        } else {
          update_title_date = json.title + ' - ' + json.month + '/' + json.year.substring(2);
          date = json.month + '/' + json.year.substring(2);
        }
        */

        $.get('http://localhost:4567/api/todos', function(data) {
          self.todos = data;
          self.generateLists(data);
          self.renderSideBar();
          let completed = data.filter(todo => (todo.completed === true));
          self.updateSideBarCount(data.length, completed.length);
          self.displayAllTodoPage();
        }, 'json');

        //let $to_update = $('body').find('label[for=item_' + self.current_todo + ']');
        //$to_update.text(update_title_date);

        $('form').get(0).reset();

        //self.buildPage();
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
        $target.parents('tr').remove();
        self.todos = self.todos.filter(function(todo) {
          return todo.id !== +id;
        });

        let completed = self.todos.filter(function(todo) {
          return todo.completed === true;
        });

        self.updateTodoCount(self.current_section.data -= 1);
        self.updateSideBarCount(self.todos.length, completed.length);

        self.generateLists(self.todos);
        self.renderSideBar();
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
  modalMarkComplete: function() {
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
          //$('tr[data-id=' + self.current_todo + ']').remove();

          $.get('http://localhost:4567/api/todos', function(data) {
            self.todos = data;
            // no due date
            self.todos = self.todos.map(function(todo_obj) {
              if (todo_obj.month === '00' || todo_obj.year === '0000') {
                todo_obj.ndd = 'No Due Date';
              }
              return todo_obj;
            });
            //
            self.generateLists(self.todos);
            self.renderSideBar();
            let completed = data.filter(todo => (todo.completed === true));
            self.updateSideBarCount(data.length, completed.length);

            if (self.current_section.title !== 'All Todos') {
              if (self.current_section.title === 'Completed' ||
                  self.sideBarState === 1) {
                // do nothing
              } else {
                $('tbody').children().remove();
                /*
                let todos = self.todos.filter(function(todo) {
                  let monthYear = todo.month + '/' + todo.year.substring(2);
                  return monthYear === self.current_section.title;
                });
                */

                // no due date
                let todos;
                if (self.current_section.title === 'No Due Date') {
                  todos = self.todos.filter(function(todo) {
                    let monthYear = todo.month + '/' + todo.year.substring(2);
                    return todo.ndd === 'No Due Date';
                  });
                } else {
                  todos = self.todos.filter(function(todo) {
                    let monthYear = todo.month + '/' + todo.year.substring(2);
                    return monthYear === self.current_section.title;
                  });
                }
                //

                $('tbody').append(self.list_template({
                  selected: self.truncateYear(todos)
                }));

                let $checked = $('tbody').find('tr input:checked').parents('tr');
                $('tbody').find('tr input:checked').parents('tr').remove();
                if ($checked.length) {
                  $('tbody').append($checked);
                }
              }

            } else {
              $('tr[data-id=' + self.current_todo + ']').remove();
              self.sortCompletedItems();
            }
          }, 'json');


          self.hideForm();
        },
        error: function(jqxhr) {
          alert(jqxhr.responseText);
        },
      });
    }
  },
  renderItems: function() {
    const self = this;
    $.ajax({
      url: 'http://localhost:4567/api/todos',
      method: 'GET',
      dataType: 'json',
      success: function(json) {
          //self.updateTodoCount(json.length);
          $('tbody').find('tr').remove();
          let completed = json.filter(function(todo) {
            return todo.completed === true;
          });
          completed = completed.sort(function(a, b) {
            return a.id - b.id;
          });

          let pending = json.filter(function(todo) {
            return todo.completed === false;
          });

          completed = completed.map(function(todo_obj) {
            if (todo_obj.month === '00' || todo_obj.year === '0000') {
              todo_obj.ndd = 'No Due Date';
            }
            return todo_obj;
          });

          pending = pending.map(function(todo_obj) {
            if (todo_obj.month === '00' || todo_obj.year === '0000') {
              todo_obj.ndd = 'No Due Date';
            }
            return todo_obj;
          });
          $('tbody').append(self.list_template({ selected: self.truncateYear(pending) }));
          $('tbody').append(self.list_template({ selected: self.truncateYear(completed) }));

          let completed_ids = completed.map(function(todo) {
            return todo.id;
          });

          completed_ids.forEach(function(todo_id) {
            $('input[id=item_' + todo_id + ']').prop('checked', true);
          });
      },
    });
  },
  markPending: function($target) {
    const self = this;
    $.ajax({
      url: 'http://localhost:4567/api/todos/' + self.current_todo,
      method: 'PUT',
      data: { completed: false },
      success: function() {
        $target.children('input').prop('checked', false);

        if (self.current_section.title !== 'All Todos') {
          // do nothing
          if (self.sideBarState === 0) {
            let $checked = $('tbody').find('tr input:checked').parents('tr');
            $('tbody').find('tr input:checked').parents('tr').remove();
            if ($checked.length) {
              $('tbody').append($checked);
            }
          }

          if (self.current_section.title !== 'Completed' &&
              self.sideBarState === 1) {
            $target.parents('tr').remove();
            self.current_section.data -= 1;
            self.renderHeader();
          }
        } else {
          self.renderItems();
        }

        $.get('http://localhost:4567/api/todos', function(data) {
          self.todos = data;
          // no due date
          self.todos = self.todos.map(function(todo_obj) {
            if (todo_obj.month === '00' || todo_obj.year === '0000') {
              todo_obj.ndd = 'No Due Date';
            }
            return todo_obj;
          });
          //
          self.generateLists(self.todos);
          self.renderSideBar();
          let completed = data.filter(todo => (todo.completed === true));
          self.updateSideBarCount(data.length, completed.length);

          if (self.current_section.title === 'Completed') {
            $target.parents('tr').remove();
            self.current_section.data = completed.length;
            self.renderHeader();
          }

        }, 'json');
      },
      error: function(jqxhr) {
        alert(jqxhr.responseText);
      },
    });
  },
  markComplete: function() {
    event.preventDefault();

    const self = this;
    let $target = $(event.target);

    if (!$target.is('label')) {
      self.current_todo = +$target.parents('tr').attr('data-id');

      if ($target.children('input').is(':checked')) {
        self.markPending($target);
      } else {
        self.modalMarkComplete();
      }
    }

  },
  sortCompletedItems: function() {
    const self = this;
    $.get('http://localhost:4567/api/todos', function(data){
      // no due date
      data = data.map(function(todo_obj) {
        if (todo_obj.month === '00' || todo_obj.year === '0000') {
          todo_obj.ndd = 'No Due Date';
        }
        return todo_obj;
      });
      //
      let completed = data.filter(function(todo) {
        return todo.completed === true;
      });

      let completed_ids = completed.map(function(todo) {
        return todo.id;
      });

      $('tbody').find('tr input:checked').parents('tr').remove();
      $('tbody').append(self.list_template({ selected: self.truncateYear(completed) }));

      completed_ids.forEach(function(todo_id) {
        $('input[id=item_' + todo_id + ']').prop('checked', true);
      });
    }, 'json');
  },
  generateLists: function(data) {
    const self = this;
    let year;
    let month;
    let monYr = [];
    let doneMonYr = [];

    //reset
    self.todos_by_date = {};
    self.done_todos_by_date = {};

    data.forEach(function(item) {
      day = item.day;
      month = item.month;
      year = item.year;
      monYr.push(month + '/' + day + '/' + year);
      if (item.completed === true) {
        doneMonYr.push(month + '/' + day + '/' + year);
      }
    });

    //debugger;

    let filterMonYr = monYr.filter(function(date) {
      return !/^00|00$/.test(date);
    });

    let filterDoneMonYr = doneMonYr.filter(function(date) {
      return !/^00|00$/.test(date);
    });

    let ndd_count = monYr.length - filterMonYr.length;
    if (ndd_count) {
      self.todos_by_date['No Due Date'] = [];
      for (let i = 0; i < ndd_count; i += 1) {
        self.todos_by_date['No Due Date'].push(1);
      }
    }

    let ndd_count_done = doneMonYr.length - filterDoneMonYr.length;
    if (ndd_count_done) {
      self.done_todos_by_date['No Due Date'] = [];
      for (let i = 0; i < ndd_count_done; i += 1) {
        self.done_todos_by_date['No Due Date'].push(1);
      }
    }



    monYr = self.sortSideBarList(filterMonYr);
    doneMonYr = self.sortSideBarList(filterDoneMonYr);

    //debugger;

    for (let i = 0; i < monYr.length; i += 1) {
      if (self.todos_by_date.hasOwnProperty(monYr[i])) {
        self.todos_by_date[monYr[i]].push(1);
      } else {
        self.todos_by_date[monYr[i]] = [];
        self.todos_by_date[monYr[i]].push(1);
      }
    }

    for (let i = 0; i < doneMonYr.length; i += 1) {
      if (self.done_todos_by_date.hasOwnProperty(doneMonYr[i])) {
        self.done_todos_by_date[doneMonYr[i]].push(1);
      } else {
        self.done_todos_by_date[doneMonYr[i]] = [];
        self.done_todos_by_date[doneMonYr[i]].push(1);
      }
    }
  },
  sortSideBarList: function(dates) {
    dates = dates.map(date => (new Date(date)));
    dates.sort(function(a, b) {
      return a - b;
    });
    return dates.map(function(date) {
      let month = String(date.getMonth() + 1);
      let year = String(date.getFullYear());
      if (month.length < 2) { month = '0' + month; }
      year = year.substring(2);
      return month + '/' + year;
    });
  },
  renderSideBar: function() {
    const self = this;
    //reset
    $('#all_lists').children().remove();
    $('#completed_lists').children().remove();
    //render
    $('#all_lists').append(self.all_list_template({ todos_by_date: self.todos_by_date }));
    $('#completed_lists').append(self.completed_list_template({ done_todos_by_date: self.done_todos_by_date }));
  },
  buildPage: function() {
    const self = this;
    //$('tbody').children().remove();

    $.ajax({
      url: 'http://localhost:4567/api/todos',
      method: 'GET',
      dataType: 'json',
      success: function(json) {
        let completed = json.filter(function(todo) {
          return todo.completed === true;
        });
        self.todos = json; // all todos template - sidebar, for length
        self.done = completed; // completed todos template -sidebar, for length

        $('body').append(self.main_template({
          //current_section: self.current_section,
          todos: self.todos,
          done: self.done,
        }));

        // no due date
        json = json.map(function(todo_obj) {
          if (todo_obj.month === '00' || todo_obj.year === '0000') {
            todo_obj.ndd = 'No Due Date';
          }
          return todo_obj;
        });
        //

        self.generateLists(json);

        self.renderSideBar();

        $('#all_todos header').toggleClass('active');

        self.bindEvents();

        $.ajax({
          url: 'http://localhost:4567/api/todos',
          method: 'GET',
          dataType: 'json',
          success: function(json) {
            self.current_section.title = 'All Todos';
            self.current_section.data = json.length;
            //self.updateTodoCount(json.length);
            self.renderHeader();

            let pending = json.filter(function(todo) {
              return todo.completed === false;
            });

            let completed = json.filter(function(todo) {
              return todo.completed === true;
            });
            completed = completed.sort(function(a, b) {
              return a.id - b.id;
            });

            // no due date
            pending = pending.map(function(todo_obj) {
              if (todo_obj.month === '00' || todo_obj.year === '0000') {
                todo_obj.ndd = 'No Due Date';
              }
              return todo_obj;
            });
            //

            // no due date
            completed = completed.map(function(todo_obj) {
              if (todo_obj.month === '00' || todo_obj.year === '0000') {
                todo_obj.ndd = 'No Due Date';
              }
              return todo_obj;
            });
            //

            // build items on main page
            $('tbody').append(self.list_template({ selected: self.truncateYear(pending) }));
            $('tbody').append(self.list_template({ selected: self.truncateYear(completed) }));
          },
        });
      },
    });

  },
  compileTemplates: function() {
    this.main_template = Handlebars.compile($('#main_template').html());
    this.list_template = Handlebars.compile($('#list_template').html());
    this.all_list_template = Handlebars.compile($('#all_list_template').html());
    this.completed_list_template = Handlebars.compile($('#completed_list_template').html());
    //Handlebars.registerHelper to split year

    Handlebars.registerPartial('all_todos_template', $('#all_todos_template').html());
    Handlebars.registerPartial('all_list_template', $('#all_list_template').html());
    Handlebars.registerPartial('completed_todos_template', $('#completed_todos_template').html());
    Handlebars.registerPartial('completed_list_template', $('#completed_list_template').html());
    Handlebars.registerPartial('title_template', $('#title_template').html());
    Handlebars.registerPartial('list_template', $('#list_template').html());
    Handlebars.registerPartial('item_partial', $('#item_partial').html());
  },
  displayListPage: function() {
    event.preventDefault();
    const self = this;
    self.sideBarState = 0;

    let $target = $(event.target);
    $target = $target.parents('dl');

    $('body').find('.active').toggleClass('active');
    $target.toggleClass('active');

    self.current_section.title = $target.attr('data-title');
    self.current_section.data = $target.attr('data-total');

    self.renderHeader();

    // remove current children from tbody
    // add new children to tbody by comparing the month / year
    $('tbody').children().remove();
    // no due date
    let todos;
    if (self.current_section.title === 'No Due Date') {
      todos = self.todos.filter(function(todo) {
        let monthYear = todo.month + '/' + todo.year.substring(2);
        return todo.ndd === 'No Due Date';
      });
    } else {
      todos = self.todos.filter(function(todo) {
        let monthYear = todo.month + '/' + todo.year.substring(2);
        return monthYear === self.current_section.title;
      });
    }

    $('tbody').append(self.list_template({ selected: self.truncateYear(todos) }));

    let $checked = $('tbody').find('tr input:checked').parents('tr');
    $('tbody').find('tr input:checked').parents('tr').remove();
    if ($checked.length) {
      $('tbody').append($checked);
    }
  },
  renderHeader: function() {
    const self = this;

    $('#items header time').text(self.current_section.title);
    $('#items header dd').text(self.current_section.data);
  },
  displayAllTodoPage: function() {
    const self = this;
    self.sideBarState = 0;

    $('body').find('.active').toggleClass('active');
    $('#all_todos header').toggleClass('active');

    self.current_section.title = 'All Todos';
    self.current_section.data = self.todos.length;
    self.renderHeader();

    $('tbody').children().remove();

    // no due date
    self.todos = self.todos.map(function(todo_obj) {
      if (todo_obj.month === '00' || todo_obj.year === '0000') {
        todo_obj.ndd = 'No Due Date';
      }
      return todo_obj;
    });
    //
    $('tbody').append(self.list_template({ selected: self.truncateYear(self.todos) }));

    let completed = self.todos.filter(todo => (todo.completed === true));
    let completed_ids = completed.map(todo => (todo.id));

    completed_ids.forEach(function(todo_id) {
      $('input[id=item_' + todo_id + ']').prop('checked', true);
    });

    self.sortCompletedItems();

  },
  displayCompletedTodoPage: function() {
    const self = this;
    self.sideBarState = 1;

    $('body').find('.active').toggleClass('active');
    $('#completed_todos header').toggleClass('active');


    self.current_section.title = 'Completed';
    let completed = self.todos.filter(todo => (todo.completed === true));
    self.current_section.data = completed.length;
    self.renderHeader();

    $('tbody').children().remove();
    $('tbody').append(self.list_template({ selected: self.truncateYear(completed) }));

    let completed_ids = completed.map(todo => (todo.id));

    completed_ids.forEach(function(todo_id) {
      $('input[id=item_' + todo_id + ']').prop('checked', true);
    });
  },
  displayCompletedListPage: function() {
    event.preventDefault();
    const self = this;
    self.sideBarState = 1;

    let $target = $(event.target);
    $target = $target.parents('dl');

    $('body').find('.active').toggleClass('active');
    $target.toggleClass('active');

    self.current_section.title = $target.attr('data-title');
    self.current_section.data = $target.attr('data-total');

    self.renderHeader();

    $('tbody').children().remove();
    /*
    let todos = self.todos.filter(function(todo) {
      let monthYear = todo.month + '/' + todo.year.substring(2);
      return monthYear === self.current_section.title;
    });
    */
    // no due date
    let todos;
    if (self.current_section.title === 'No Due Date') {
      todos = self.todos.filter(function(todo) {
        let monthYear = todo.month + '/' + todo.year.substring(2);
        return todo.ndd === 'No Due Date';
      });
    } else {
      todos = self.todos.filter(function(todo) {
        let monthYear = todo.month + '/' + todo.year.substring(2);
        return monthYear === self.current_section.title;
      });
    }
    //
    let completed = todos.filter(todo => (todo.completed === true));

    $('tbody').append(self.list_template({ selected: self.truncateYear(completed) }));
  },
  bindEvents: function() {
    $("label[for='new_item']").on('click', $.proxy(this.displayForm, this));
    $('tbody').on('click', 'td.list_item', $.proxy(this.markComplete, this));
    $('tbody').on('click', 'td.list_item label', $.proxy(this.displayForm, this));
    $('input[type=submit]').on('click', $.proxy(this.submitForm, this));

    $('#modal_layer').on('click', this.hideForm);

    $('button[name=complete]').on('click', $.proxy(this.modalMarkComplete, this));

    $('tbody').on('click', 'td.delete', $.proxy(this.deleteTodo, this));

    $('#all_todos').on('click', $.proxy(this.displayAllTodoPage, this));
    $('#all_lists').on('click', $.proxy(this.displayListPage, this));

    $('#completed_todos').on('click', $.proxy(this.displayCompletedTodoPage, this));
    $('#completed_lists').on('click', $.proxy(this.displayCompletedListPage, this));

  },
  init: function() {
    this.current_todo;
    this.todos;
    this.done;
    this.todos_by_date = {};
    this.done_todos_by_date = {};
    this.current_section = { title: "All todos", data: 0 };
    this.sideBarState = 0;

    this.compileTemplates();
    this.buildPage();
    //this.bindEvents();
  }
 }

 todo_main.init();
})
