Events = new Mongo.Collection('events');

function createEvent(start, end, title, info, id) {
    title = typeof title !== 'undefined' ? title : '';
    info = typeof info !== 'undefined' ? info : '';
    id = typeof id !== 'undefined' ? id : '';
    return {
        start: start,
        end: end,
        title: title,
        info: info,
        _id: id
    }
}

function revert() {
    currEvent = null;
    currEventDep.changed();
    addEventMode = addEventModes.BASE;
    editMode = editModes.NOT_EDITING;
    deleteMode = deleteModes.NOT_DELETING;
    addEventModeDep.changed();
    currEventDep.changed();
    deleteModeDep.changed();    
}

var addEventModes = {
  BASE: 'initial state',
  ADD_START: 'waiting for start date',
  ADD_END: 'waiting for end date',
  ADD_TITLE: 'waiting for a title'
}

var editModes = {
  EDITING: 'editing',
  NOT_EDITING: 'not editing'
}

var deleteModes = {
  DELETING: 'deleting',
  NOT_DELETING: 'not deleting'
}

var addEventMode = addEventModes.BASE;
var addEventModeDep = new Tracker.Dependency;

var startDate = '';
var endDate = '';
var eventDescription = '';
var currEvent = null;
var currEventDep = new Tracker.Dependency;
var editMode = editModes.NOT_EDITING;
var editModeDep = new Tracker.Dependency;
var deleteMode = deleteModes.NOT_DELETING;
var deleteModeDep = new Tracker.Dependency;
var eventList = [];
var noEndDate = 'No end specified';

function range(start, end) {
  var list = [];
  for(var i = start; i <= end; i++) {
    list.push({num: i, selected: false});
  }
  return list;
}

function refetch() {
    eventList = Events.find({}).fetch();
    $("#myCalendar").fullCalendar('removeEvents');
    $("#myCalendar").fullCalendar('addEventSource', eventList);
}

function isAdmin() {
    return Meteor.user() && Meteor.users.findOne( { _id: Meteor.userId() }).admin;
}

Template.calendar.rendered = function(){
    Meteor.subscribe("events", function() {
        eventList = Events.find({}).fetch();
        $("#myCalendar").fullCalendar({
            header: {
                left: 'prev,next today',
                center: 'title',
                right: 'month,agendaWeek,agendaDay'
            },
            dayClick: function(date, jsEvent, view) {
                if(!isAdmin()) {
                  return;
                }
                var currentDate = new Date();
                currentDate = currentDate.getFullYear() + '-' + (currentDate.getMonth() + 1) + '-' + currentDate.getDate();

                switch(addEventMode) {
                  case addEventModes.ADD_START:
                    if (date.format() >= currentDate) {
                        startDate = date.format();
                        addEventMode = addEventModes.ADD_END;
                        addEventModeDep.changed();
                    } else {
                        alert("Your event cannot start before today!");
                    }
                    break;
                  case addEventModes.ADD_END:
                    endDate = date.format();
                    if (endDate >= startDate) {
                        currEvent = createEvent($.fullCalendar.moment(startDate), $.fullCalendar.moment(endDate));
                        currEventDep.changed();
                        addEventMode = addEventModes.ADD_TITLE;
                        addEventModeDep.changed();
                        editMode = editModes.EDITING;
                        editModeDep.changed();
                    } else {
                        alert("Your event cannot end before it starts!");
                        endDate = '';
                    }
                    break;
                  default:
                    return;
                }
            },
            defaultDate: new Date(),
            defaultView: 'month',
            editable: true,
            events: function (start, end, timezone, callback) {
                callback(Events.find({}).fetch());
            },
            eventRender: function (event, element) {
                element.attr('href', 'javascript:void(0);');
                element.click(function () {
                    if (event.end === null) {
                      event.end = event.start;
                    }
                    currEvent = event;
                    currEventDep.changed();
                });
            },
            timezone: "local"
        });
    });
}

Template.calendar.events({
    "click #addToggle": function(e) {
        e.preventDefault();
        if (isAdmin()) {
            switch(addEventMode) {
              case addEventModes.BASE:
                addEventMode = addEventModes.ADD_START;
                addEventModeDep.changed();
                break;
              default:
                revert();
                break;
            }
        }
    },

    "click #edit": function(e) {
        e.preventDefault();
        if (isAdmin()) {
            editMode = editModes.EDITING;
            editModeDep.changed();
        }
    },

    "click #delete": function(e) {
        e.preventDefault();
        if (isAdmin()) {
            deleteMode = deleteModes.DELETING;
            deleteModeDep.changed();
        }
    },

    "click #confirm": function(e) {
        if (isAdmin()) {
            if (editMode === editModes.EDITING) {
                var desc = $('#editDesc').val();
                var start = $('#sMonth').val() + " " + $('#sDay').val() + " " +
                            $('#sYear').val() + " " + $('#sHour').val() + " " +
                            $('#sMinute').val() + " " + $('#sAM').val();
                var end = $('#eMonth').val() + " " + $('#eDay').val() + " " +
                          $('#eYear').val() + " " + $('#eHour').val() + " " +
                          $('#eMinute').val() + " " + $('#eAM').val();
                var eventDescription = $('#editEventDescription').val();
                var modEvent = {
                    _id: currEvent._id,
                    start: $.fullCalendar.moment(start, "M D YYYY h m A").toISOString(),
                    end: $.fullCalendar.moment(end, "M D YYYY h m A").toISOString(),
                    info: eventDescription,
                    title: desc
                };
                Meteor.call('updateEvent', modEvent, function (err, success) {
                    if (err) {
                        console.err('failed to edit event');
                        console.err(err);
                        alert('Failed to edit event');
                    } else {
                        console.log('event editted');
                        $("#myCalendar").fullCalendar('refetchEvents');
                        revert();
                    }
                });
            } else if (deleteMode === deleteModes.DELETING) {
                Meteor.call('deleteEvent', currEvent._id, function (err, success) {
                    if (err) {
                        console.log('Failed to delete event');
                        console.log(err);
                        alert('Failed to delete event')
                    } else {
                        console.log('Event deleted');
                        $("#myCalendar").fullCalendar('refetchEvents');
                        revert();                    
                    }
                });
            }
        }
    }, 

    "click #cancel, click #closebox, click #close, click .modal-overlay": function(e) {
        revert();
    }
});

Template.calendar.helpers({
    is_admin: function() {
        return isAdmin();
    },

    add_text: function() {
        addEventModeDep.depend();
        switch (addEventMode) {
          case addEventModes.BASE:
            return 'Add Event'
          case addEventModes.ADD_START:
            return 'Select a start date (Click here to Cancel)'
          case addEventModes.ADD_END:
            return 'Pick an end date (Click here to cancel)'
          case addEventModes.ADD_TITLE:
            return 'Add details to your event!'
          default:
            console.err('inconsistent addEventMode state');
            return 'Add Event?'
        }
    },
    confirmationButtons: function() {
      deleteModeDep.depend();
      editModeDep.depend();
      var deleting = deleteMode === deleteModes.DELETING;
      var editing = editMode === editModes.EDITING;
      return deleting || editing;
    },
    currEvent: function() {
      currEventDep.depend();
      if (currEvent === null) {
        return null;
      }
      return {
        title: currEvent.title,
        startDate: currEvent.start.format('MMMM Do, YYYY'),
        startTime: currEvent.start.format('hh:mm A'),
        endDate: currEvent.end.format('MMMM Do, YYYY'),
        endTime: currEvent.end.format('hh:mm A'),
        description: currEvent.info
      }
    },
    deleting: function() {
      deleteModeDep.depend();
      return deleteMode === deleteModes.DELETING;
    },
    editing: function() {
      editModeDep.depend();
      return editMode === editModes.EDITING;
    },
    showModal: function() {
      currEventDep.depend();
      return currEvent !== null;
    },
    startDate: function() {
      currEventDep.depend();
      return generateDates(currEvent.start);
    },
    startTime: function() {
      currEventDep.depend();
      return generateTimes(currEvent.start);
    },
    endDate: function() {
      currEventDep.depend();
      return generateDates(currEvent.end);
    },
    endTime: function() {
      currEventDep.depend();
      return generateTimes(currEvent.end);
    }
});

function generateDates(activeMoment) {
    var currentYear = (new Date()).getFullYear();
    var dates = [
        { type: 'Year', items: range(currentYear, currentYear+5) },
        { type: 'Month', items: range(1, 12) },
        { type: 'Day', items: range(1, 31) }
    ]
    dates[0].items = dates[0].items.map(function(item) {
      if(item.num == activeMoment.format('YYYY')) { item.selected = true; }
      return item;
    })
    dates[1].items = dates[1].items.map(function(item) {
      if(item.num == activeMoment.format('M')) { item.selected = true; }
      return item;
    })
    dates[2].items = dates[2].items.map(function(item) {
      if(item.num == activeMoment.format('D')) { item.selected = true; }
      return item;
    })
    return dates
}

function generateTimes(activeMoment) {
    var times = [
        { type: 'Hour', items: range(1, 12) },
        { type: 'Minute', items: range(0, 59) },
        { type: 'AM', items: [{num: 'AM', selected: false}, {num: 'PM', selected: false}] }
    ]
    times[0].items = times[0].items.map(function(item) {
      if(item.num == activeMoment.format('h')) { item.selected = true; }
      return item;
    })
    times[1].items = times[1].items.map(function(item) {
      if(item.num == activeMoment.format('m')) { item.selected = true; }
      return item;
    })
    times[2].items = times[2].items.map(function(item) {
      if(item.num == activeMoment.format('a')) { item.selected = true; }
      return item;
    })
    return times
}