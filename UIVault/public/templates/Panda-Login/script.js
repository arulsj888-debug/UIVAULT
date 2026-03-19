// Raise form when password is focused
$('#password').focusin(function () {
  $('form').addClass('up');
});
$('#password').focusout(function () {
  $('form').removeClass('up');
});

// Panda eye follows mouse
$(document).on('mousemove', function (event) {
  var dw = $(document).width() / 15;
  var dh = $(document).height() / 15;
  var x = event.pageX / dw;
  var y = event.pageY / dh;
  $('.eye-ball').css({ width: x, height: y });
});

// Show invalid alert on login click
$('.btn').click(function () {
  $('form').addClass('wrong-entry');
  setTimeout(function () {
    $('form').removeClass('wrong-entry');
  }, 3000);
});
