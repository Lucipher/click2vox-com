function loadScript(url, callback)
{
  // Adding the script tag to the head as suggested before
  var head = document.getElementsByTagName('head')[0];
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = url;

  // Then bind the event to the callback function.
  // There are several events for cross browser compatibility.
  script.onreadystatechange = callback;
  script.onload = callback;

  // Fire the loading
  head.appendChild(script);
}

var check1Ready = (function() {
  loadScript("//cdnjs.cloudflare.com/ajax/libs/raty/2.7.0/jquery.raty.min.js", check2Ready);
});

var check2Ready = (function() {
  console.log("jQuery & Raty are loaded");

  $(document).ready(function () {
    $('#control').append(' \
      <audio id="audio-ringback-tone" preload="auto"> \
        <source src="https://upload.wikimedia.org/wikipedia/commons/c/cd/US_ringback_tone.ogg" type="audio/ogg"> \
      </audio> \
      <div class="vox-widget-wrapper hidden"> \
        <div class="vw-main"> \
          <div class="vw-header"> \
            <span class="vw-title" id="vw-title">Starting Call</span> \
            <span class="vw-animated-dots">.</span> \
            <span class="vw-animated-dots">.</span> \
            <span class="vw-animated-dots">.</span> \
            <div class="vw-actions"> \
              <a href="#" id="full-screen"><i class="vw-icon vx-icon-full-screen-off"></i></a> \
              <a href="#" id="close-screen"><i class="vw-icon vx-icon-close"></i></a> \
            </div> \
          </div> \
          <div id="vw-body" class="vw-body"> \
            <div id="vw-unable-to-acces-mic" class="vw-unable-to-acces-mic hidden"> \
              <p style="color: red;">Oops. It looks like we are unable to use your microphone.</p> \
              <p>Please enable microphone access in your browser to allow this call</p> \
            </div> \
            <div id="vw-in-call"> \
              <div id="vw-btn-group" class="vw-btn-group"> \
                <a href="#"> \
                  <i class="vw-icon vx-icon-mic"></i> \
                  <div id="microphone" class="int-sensor"> \
                    <em id="mic5"></em> \
                    <em id="mic4"></em> \
                    <em id="mic3"></em> \
                    <em id="mic2"></em> \
                    <em id="mic1"></em> \
                  </div> \
                </a> \
                <a href="#" class="hidden"> \
                  <i class="vw-icon vx-icon-vol"></i> \
                  <div id="volume" class="int-sensor"> \
                    <em id="vol5"></em> \
                    <em id="vol4"></em> \
                    <em id="vol3"></em> \
                    <em id="vol2"></em> \
                    <em id="vol1"></em> \
                  </div> \
                </a> \
                <a href="#" id="dialpad"><i class="vw-icon vx-icon-pad"></i></a> \
              </div> \
              <a href="#" id="vw-end-call" class="vw-end-call"><i class="vw-icon vx-icon-phone"></i>End Call</a> \
              <div id="vw-dialpad" class="vw-dialpad"> \
                <ul> \
                  <li class="vw-tl">1</li> \
                  <li>2</li> \
                  <li class="vw-tr">3</li> \
                  <li>4</li> \
                  <li>5</li> \
                  <li>6</li> \
                  <li>7</li> \
                  <li>8</li> \
                  <li>9</li> \
                  <li class="vw-bl">*</li> \
                  <li>0</li> \
                  <li class="vw-br">#</li> \
                </ul> \
              </div> \
            </div> \
            <div id="vw-rating" class="vw-rating hidden"> \
              <form name="rating"> \
                <div id="vw-rating-question" class="vw-question">How was the quality of your call?</div> \
                <div id="vw-rating-stars" class="vw-stars"></div> \
                <div id="vw-rating-message" class="vw-message">Any additional feedback? \
                  <input type="text" name="rating-message" id="rating-message" placeholder="Optional"" class="form-control"> \
                </div> \
                <div id="vw-rating-button" class="vw-button"> \
                  <button class="btn-style" id="send-rating"> \
                    <span>Send</span> \
                  </button> \
                </div> \
              </form> \
            </div> \
            <div id="vw-rating-after-message" class="vw-rating hidden"> \
              <p>Thank you for using our service</p> \
            </div> \
            <div id="vw-footer" class="vw-footer"> \
              <a href="https://voxbone.com" target="_blank">powered by:</a> \
            </div> \
          </div> \
        </div> \
      </div> \
    ');

    window.addEventListener('message', function(event) {
      // console.log(event.data);
      var message = event.data;

      switch(message.action) {
        case 'setMicVolume':
          $("#microphone em").removeClass();
          if (message.value > 0.01) $("#mic1").addClass('on');
          if (message.value > 0.05) $("#mic2").addClass('on');
          if (message.value > 0.10) $("#mic3").addClass('on');
          if (message.value > 0.20) $("#mic4").addClass('on');
          if (message.value > 0.30) $("#mic5").addClass('peak');
          break;
        case 'setCallCalling':
          playRingbackTone();
          $("#vw-title").text("Calling");
          break;
        case 'setCallFailed':
          stopRingbackTone();
          $("#vw-title").text("Call Failed: " + message.value);
          $(".vw-animated-dots").addClass('hidden');
          $("#vw-in-call").addClass('hidden');
          $("#vw-rating-after-message").removeClass('hidden');
          break;
        case 'setInCall':
          stopRingbackTone();
          $("#vw-title").text("In Call");
          $(".vw-animated-dots").removeClass('hidden');
          break;
        case 'setCallEnded':
          $("#vw-title").text("Call Ended");
          $(".vw-animated-dots").addClass('hidden');
          $("#vw-in-call").addClass('hidden');
          $("#vw-rating").removeClass('hidden');
          $(".vw-end-call").click();
          break;
        case 'openWidgetWithoutDialPad':
          $("#dialpad").addClass('hidden');
          $("#vw-title").text("Calling");
          $(".vw-animated-dots").removeClass('hidden');
          $(".vox-widget-wrapper").removeClass('hidden');
          $("#vw-in-call").removeClass('hidden');
          $(".vw-rating").addClass('hidden');
          $("#vw-unable-to-acces-mic").addClass('hidden');
          break;
        case 'openWidget':
          $("#vw-title").text("Calling");
          $(".vw-animated-dots").removeClass('hidden');
          $(".vox-widget-wrapper").removeClass('hidden');
          $("#vw-in-call").removeClass('hidden');
          $(".vw-rating").addClass('hidden');
          $("#vw-unable-to-acces-mic").addClass('hidden');
          break;
        case 'setCallFailedUserMedia':
          $("#vw-title").text("Call Failed");
          $(".vw-animated-dots").addClass('hidden');
          $("#vw-in-call").addClass('hidden');
          $("#vw-unable-to-acces-mic").removeClass('hidden');
          break;
      };
    });

    $('#send-rating').click(function(e) {
      e.preventDefault();

      var rate = $('#vw-rating-stars').raty('score');
      if (!rate) return;

      var comment = $('#rating-message').val();

      var data =  { rate: rate, comment: comment };
      var message = { action: 'rate', data: data };

      callAction(message);

      $("#vw-rating").addClass('hidden');
      $("#vw-rating-after-message").removeClass('hidden');
    });

    function stopRingbackTone(){
      $("#audio-ringback-tone").trigger('pause');
      $("#audio-ringback-tone").prop("currentTime",0);
    };

    function playRingbackTone(){
      $("#audio-ringback-tone").prop("currentTime",0);
      $("#audio-ringback-tone").trigger('play');
    };

    function is_iframe() {
      return $('#call_button_frame').length > 0;
    };

    function send_voxbone_interaction(message){
      if (!(typeof voxbone.WebRTC.rtcSession.isEstablished === "function") || voxbone.WebRTC.rtcSession.isEnded())
        return;

      switch(message) {
        case 'hang_up':
          voxbone.WebRTC.hangup();
          break;
        case 'microphone-mute':
          if (voxbone.WebRTC.isMuted) {
            voxbone.WebRTC.unmute();
          } else {
            voxbone.WebRTC.mute();
          }
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
        case '0':
        case '*':
        case '#':
          voxbone.WebRTC.sendDTMF(message);
          break;
      }
    };

    function callAction(message) {
      if (is_iframe()) {
        $('#call_button_frame')[0].contentWindow.postMessage(message, '*');
      } else {
        if (message.action && message.action == 'rate')
          console.log(message);
        else
          send_voxbone_interaction(message);
      };
    };

    function resetRating() {
      $('#vw-rating-stars').raty('score', 0);
      $('#rating-message').val('');
    };

    $('#vw-rating-stars').raty({ starType : 'i' });

    $('.vw-dialpad li').click(function(e) {
      e.preventDefault();
      callAction(this.textContent);
    });

    $(".vw-end-call").click(function(e) {
      e.preventDefault();
      resetRating();
      callAction('hang_up');
    });

    $("#close-screen i").click(function(e) {
      e.preventDefault();
      $(".vox-widget-wrapper").addClass('hidden');
      callAction('hang_up');
    });

    $("#full-screen i").click(function(e) {
      e.preventDefault();
      $("#vw-body").toggleClass('hidden');
      $(this).toggleClass('vx-icon-full-screen-on').toggleClass('vx-icon-full-screen-off');
    });

    $(".vw-icon.vx-icon-pad").click(function(e) {
      e.preventDefault();
      $("#dialpad").toggleClass('active');
      $(".vw-dialpad").toggleClass('active');
    });

    $(".vw-icon.vx-icon-mic").click(function(e) {
      e.preventDefault();
      $("#microphone em").toggleClass('on').toggleClass('off');
      callAction('microphone-mute');
    });

    $(".vw-icon.vx-icon-vol").click(function(e) {
      e.preventDefault();
      $("#volume em").toggleClass('on').toggleClass('off');
      callAction('volume-mute');
    });
  });
});

loadScript("//ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js", check1Ready);
