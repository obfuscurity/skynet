! function () {

  var cache = null;
  var highlighted = null;
  var mode  = 1;
  var modes = {
    'NONE':   1,
    'BROWSE': 2,
    'CREATE': 3
  };

  var enableDetails = false,
      escapeLock = false;


  var updateClock = function () {
    var display = $('#userinfo strong'),
        time    = new Date(),
        hour    = time.getHours(),
        minutes = time.getMinutes(),
        ampm    = (hour < 12) ? 'am' : 'pm';
    if (hour > 12) { hour = hour - 12; }
    if (minutes < 10) { minutes = '0' + minutes; }
    display.text(hour + ':' + minutes + ' ' + ampm);
  };


  // Display Updates =========================================================


  // Builds a status indicator
  var buildProgressBar = function (progress) {
    var bar = $('<div class="progressbar"><div></div></div>');
    bar.find('div').css('width', progress + '%');
    return bar;
  };
  
  // Builds a monitor row
  var buildJobRow = function (data) {
    var job = $('<tr></tr>'),
        td  = $('<td></td>'),
        bar = td.append(buildProgressBar(data.progress));
    job.append('<td>' + data.id + '</td>')
       .append(bar)
       .append('<td>' + data.progress + '</td>')
       .append('<td>' + data.type + '</td>');
    if (mode == modes.BROWSE && highlighted == data.id) {
      job.addClass('highlight');
    }
    return job;
  };
  
  // Sets up job status polling
  var poll = function () {
    $.ajax({
      url:      '/data.html',
      type:     'GET',
      dataType: 'json',
      error:    function (xhr, err) {
        console.log(err);
      },
      success:  function (rsp) {
        cache = rsp;

        // NOTE: We're assuming there's only ever a single job
        var data  = cache[0]['workers'],
            tbody = $('tbody').empty();

        $('#total strong').text(data.length);
        
        for (var i = 0, len = data.length; i < len; i++) {
          tbody.append(buildJobRow(data[i]));
        }
      }
    });
  };


  // Builds a worker display
  var buildWorkerInfo = function (id) {
    var win  = $('#worker').empty(),
        data = cache[0]['workers']
        dl   = $('<dl></dl>'),
        wrkr = null,
        list = {
          'id': 'Worker ID',
          'uuid': 'UUID',
          'type': 'Type',
          'created_at': 'Created',
          'updated_at': 'Updated'
        };

    // Find worker details
    for (var i = 0, len = data.length; i < len; i++) {
      if (data[i]['id'] == highlighted) {
        wrkr = data[i];
        break;
      }
    }

    // Update details
    for (var i in list) {
      dl.append('<dt>' + list[i] + ':</dt>');
      dl.append('<dd>' + wrkr[i] + '</dd>');
    }
    win.append(dl);
    win.show();
  };


  // Enables data input display
  var buildInputForm = function () {
    var form = $('#input');
  };


  // Keyboard Listeners ======================================================


  // Escape - No mode
  $(document).bind('keydown', 'esc', function () {
    if (escapeLock) { return; }
    if (mode == modes.BROWSE && enableDetails == true) {
      enableDetails = false;
      $('#worker').hide();
      escapeLock = true;
      setTimeout(function () { escapeLock = false; }, 50);
    } else {
      mode = modes.NONE;
      $('#monitor table tbody tr.highlight').removeClass('highlight');
    }
  });


  // F5 - Browse mode
  $(document).bind('keydown', 'f5', function () {
    mode = modes.BROWSE;
    if (highlighted == null) {
      var h = $($('#monitor table tbody tr')[0]);
      console.log(highlighted = h.find('td:first').text());
      h.addClass('highlight');
    }
  });


  // UP
  $(document).bind('keydown', 'up', function () {
    if (mode == modes.BROWSE) {
      var tr = $('#monitor tr.highlight');
      if (tr.prev().length > 0) {
        tr.removeClass('highlight');
        tr.prev().addClass('highlight');
        highlighted = tr.prev().find('td:first').text();
        if (enableDetails == true) {
          buildWorkerInfo(highlighted);
        }
      }
    }
  });


  // DOWN
  $(document).bind('keydown', 'down', function () {
    if (mode == modes.BROWSE) {
      var tr = $('#monitor tr.highlight');
      if (tr.next().length > 0) {
        tr.removeClass('highlight');
        tr.next().addClass('highlight');
        highlighted = tr.next().find('td:first').text();
        if (enableDetails == true) {
          buildWorkerInfo(highlighted);
        }
      }
    }
  });


  // Return
  $(document).bind('keydown', 'return', function () {
    if (mode == modes.BROWSE) {
      enableDetails = true;
      buildWorkerInfo(highlighted);
    }
  });



  // Application Startup =====================================================
  
  
  // Swimoff
  $(document).ready(function () {
    poll();
    updateClock();
    var polling = setInterval(poll, 2000);
    var clock   = setInterval(updateClock, 10000);
    //var polling = setTimeout(poll, 200);
  });

}();