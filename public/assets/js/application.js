// natebeaty js
// nate@clixel.com
/*jshint latedef:false*/

//=include "../bower_components/jquery/dist/jquery.js"
//=include "../bower_components/jquery.fitvids/jquery.fitvids.js"
//=include "../bower_components/velocity/velocity.min.js"
//=include "../bower_components/imagesloaded/imagesloaded.pkgd.min.js"
//=include "../bower_components/masonry/dist/masonry.pkgd.js"
//=include "../bower_components/history.js/scripts/bundled/html5/jquery.history.js"

var Nb = (function($) {

  var breakpoint_small = false,
      breakpoint_medium = false,
      breakpoint_large = false,
      breakpoint_array = [480,1000,1200],
      History = window.History,
      State,
      root_url = History.getRootUrl(),
      relative_url,
      original_url,
      section_in,
      page_cache = {};

  function _init() {
    $('#stache').velocity({ fill: '#eee' });

    // Fit them vids!
    $('main').fitVids();

    // natehead clicks
    $(document).on('click', '#natehead', function(e) {
      _showNav();
    });

    // keyboard support
    $(document).keyup(function(e) {
      // esc
      if (e.keyCode === 27) {
        _showNav();
      }
    });

    // primary nav
    $('nav.main a').hover(function() {
      var bg = $(this).css('background-color');
      var hex = _rgb2hex(bg);
      if (hex) {
        $('#stache').stop().velocity({ fill: hex });
      }
    }).on('click', function(e) {
      e.preventDefault();
      if (State.url==this.href) {
        _getSectionVar();
        _showPage();
      } else {
        History.pushState({}, '', this.href);
      }
    });

    _initBigClicky();
    _initComics();

    // Init state
    State = History.getState();
    relative_url = '/' + State.url.replace(root_url,'');
    original_url = State.url;

    // Cache any pages already loaded
    $('section[data-page]').each(function() {
      // page_cache[encodeURIComponent(State.url)] = $.parseHTML(response);
      page_cache[encodeURIComponent(History.getRootUrl().replace(/\/$/,'') + $(this).attr('data-page'))] = $(this).prop('outerHTML');
    });

    _getSectionVar();
    _initStateHandling();
    setTimeout(_showPage, 200);

  } // end init()

  function _getSectionVar() {
    var s = relative_url.match(/^\/(\w+)\/?/);
    section_in = (s) ? s[1] : 'home';
  }

  // Bind to state changes and handle back/forward
  function _initStateHandling() {
    $(window).bind('statechange',function(){
      State = History.getState();
      relative_url = '/' + State.url.replace(root_url,'');
      _getSectionVar();

      if (State.data.ignore_change) {
        return;
      }

      // if (State.url !== original_url && relative_url.match(/^\/(comics)\//)) {
      if (State.url == root_url) {
        $('body').attr('class', '');
      } else {
        if (page_cache[encodeURIComponent(State.url)]) {
          _updatePage();
        } else {
          _loadPage();
        }
      }


      // } else if (relative_url.match(/^\/collection\//)) {

      //   _showCollection();

      // } else {

      //   // URL isn't handled as a modal
      //   if (State.url !== original_url) {
      //     // Just load URL if isn't original_url
      //     location.href = State.url;
      //   } else {
      //     // ..otherwise just hide all modals
      //     _hideModal();
      //     _hideCollection();
      //     _hideImageModal();
      //   }

      // }

    });
  }
  // Comics
  function _initComics() {
  }

  // Show active page bucket
  function _showPage() {
    if (section_in != 'home') {
      $('body').attr('class','in-section active-' + section_in);
    }
    // page specifics
    if (section_in == 'comics') {
    }
    // Refit them vids!
    $('main').fitVids();
    $('.masonryme:not(.inited)').masonry({
      itemSelector: 'article'
    }).on('layoutComplete', function(){
      $(this).addClass('inited');
    });
    $('.masonryme').imagesLoaded(function() {
      $('.masonryme').masonry('layout');
    });

    _scrollBody($('body'), 250, 0);
  }

  // Load AJAX content
  function _loadPage() {
    $.ajax({
      url: State.url,
      method: 'get',
      dataType: 'html',
      success: function(response) {
        // page_cache[encodeURIComponent(State.url)] = $.parseHTML(response);
        page_cache[encodeURIComponent(State.url)] = response;
        _updatePage();
      }
    });
  }

  // Update modal with cached content for current URL and show it
  function _updatePage() {
    // Has page been loaded?
    if ($('[data-page="' + relative_url + '"]').length) {
      // Replace if so
      $('[data-page="' + relative_url + '"]').prop('outerHTML', page_cache[encodeURIComponent(State.url)]);
    } else {
      // Otherwise append to <main>
      $('main').append(page_cache[encodeURIComponent(State.url)]);
    }
    // _trackPage();
    _showPage();
    // $page.fitVids();
    _updateTitle();
  }

  // Function to update document title after state change
  function _updateTitle() {
    var title;
    title = $('[data-page-title]').first().attr('data-page-title');

    if (title === '') {
      title = 'Nate Beaty';
    } else {
      title = title + ' – Nate Beaty';
    }
    // this bit also borrowed from Ajaxify
    document.title = title;
    try {
      document.getElementsByTagName('title')[0].innerHTML = document.title.replace('<','&lt;').replace('>','&gt;').replace(' & ',' &amp; ');
    } catch (Exception) {}
  }

  function _showNav() {
    History.pushState({}, '', root_url);
  }

  // Called in quick succession as window is resized
  function _resize() {
    screenWidth = document.documentElement.clientWidth;
    breakpoint_small = (screenWidth > breakpoint_array[0]);
    breakpoint_medium = (screenWidth > breakpoint_array[1]);
    breakpoint_large = (screenWidth > breakpoint_array[2]);
  }

  // Scroll to location in body or container element
  function _scrollBody(element, duration, delay, offset, container) {
    element.velocity('scroll', {
      duration: duration,
      delay: delay,
      offset: (typeof offset !== 'undefined' ? offset : 0),
      container: (typeof container !== 'undefined' ? container : null)
    }, 'easeOutSine');
  }

  // Larger clicker areas ftw (w/ support for target and ctrl/cmd+click)
  function _initBigClicky() {
    $(document).on('click', '.bigclicky', function(e) {
      if (!$(e.target).is('a')) {
        e.preventDefault();
        var link = $(this).find('h1:first a,h2:first a');
        if (link.length) {
          if (e.metaKey || link.attr('target')) {
            window.open(link[0].href);
          } else {
            History.pushState({}, '', link[0].href);
          }
        }
      }
    });
  }

  function _rgb2hex(rgb) {
    rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (rgb == null) {
      return false;
    }
    function hex(x) {
      return ('0' + parseInt(x).toString(16)).slice(-2);
    }
    return '#' + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
  }

  // Track AJAX pages in Analytics
  function _trackPage() {
    if (typeof ga !== 'undefined') {
      ga('send', 'pageview', location.pathname);
    }
  }

  // Track events in Analytics
  function _trackEvent(category, action) {
    if (typeof ga !== 'undefined') {
      ga('send', 'event', category, action);
    }
  }

  // Public functions
  return {
    init: _init,
    resize: _resize
  };

})(jQuery);

// Fire up the mothership
jQuery(document).ready(Nb.init);

// Zig-zag the mothership
jQuery(window).resize(Nb.resize);
