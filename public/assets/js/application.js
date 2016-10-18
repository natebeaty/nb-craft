// natebeaty js
// nate@clixel.com
/*jshint latedef:false*/

//=include "../bower_components/jquery/dist/jquery.js"
//=include "../bower_components/jquery.fitvids/jquery.fitvids.js"
//=include "../bower_components/velocity/velocity.min.js"
//=include "../bower_components/imagesloaded/imagesloaded.pkgd.min.js"
//=include "../bower_components/masonry/dist/masonry.pkgd.js"
//=include "../bower_components/history.js/scripts/bundled/html5/jquery.history.js"
//=include "../bower_components/vanilla-lazyload/dist/lazyload.min.js"
//=include "../bower_components/fastclick/lib/fastclick.js"

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
      scroll_to_top = false,
      page_cache = {};

  function _init() {
    $('html').addClass('loaded');

    // Fastclick
    FastClick.attach(document.body);

    // Fit them vids!
    $('main').fitVids();

    // natehead clicks
    $(document).on('click', '#natehead', function(e) {
      e.preventDefault();
      _showNav();
    });

    // keyboard support
    $(document).keyup(function(e) {
      // esc
      if (e.keyCode === 27) {
        _showNav();
      }
    });

    // colorize the stache on hover on non-touch clients
    if (!Modernizr.touchevents) {
      $('nav.main a').hover(function() {
        // Magical color-changing moustache
        _colorStache(this);
      });
    }
    $('h1.title').on('click', function(e) {
      e.stopPropagation();
      e.preventDefault();
      $('#natehead').toggleClass('dizzy');
    })

    // main nav click: scroll page up or push URL into history
    $('nav.main a').on('click', function(e) {
      e.preventDefault();
      _colorStache(this);
      $('#natehead').removeClass('dizzy');
      if (State.url==this.href) {
        // If clicking nav header when in a section, just scroll to top
        _scrollBody($('body'), 250, 0);
      } else {
        // Otherwise push page to History
        History.pushState({}, '', this.href);
      }
    });

    // X close/back button
    $('.x').on('click', function(e) {
      e.preventDefault();
      // if we're on a single page, go back to section_in landing (e.g. /comics)
      if ($('main .is-single').length) {
        History.pushState({}, '', '/' + section_in);
      } else {
        // If we're on a landing page, go to the homepage
        _showNav();
      }
    });

    // user-content linking internally
    $(document).on('click', '.user-content a', function(e) {
      var href = this.href;
      // if not external, push to history
      if (!_isExternal(href)) {
        e.preventDefault();
        History.pushState({}, '', href);
      } else {
        return true;
      }
    });

    // Init state
    State = History.getState();
    relative_url = '/' + State.url.replace(root_url,'');
    original_url = State.url;

    // Cache any pages already loaded
    $('section[data-page]').each(function() {
      // page_cache[encodeURIComponent(State.url)] = $.parseHTML(response);
      page_cache[encodeURIComponent(History.getRootUrl().replace(/\/$/,'') + $(this).attr('data-page'))] = $(this).prop('outerHTML');
    });

    _initBigClicky();
    _initPagination();
    _getSectionVar();
    _initStateHandling();
    setTimeout(_showPage, 150);

    $('#stache').velocity({ fill: '#93604b' });

  } // end init()

  // Totally useful stache colors
  function _colorStache(el) {
    var bg = $(el).css('background-color');
    var hex = _rgb2hex(bg);
    if (hex) {
      $('#stache').stop().velocity({ fill: hex });
    }
  }

  // Set section_in var for various logic, denotes primary section being shown
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

      if (State.url == root_url) {
        $('body').attr('class', '');
      } else {
        if (page_cache[encodeURIComponent(State.url)]) {
          _updatePage();
        } else {
          scroll_to_top = true;
          _loadPage();
        }
      }

    });
  }

  // Load AJAX content
  function _loadPage() {
    $.ajax({
      url: State.url,
      method: 'get',
      dataType: 'html',
      success: function(response) {
        page_cache[encodeURIComponent(State.url)] = response;
        _updatePage();
      }
    });
  }

  // Update modal with cached content for current URL and show it
  function _updatePage() {
    $('main').removeClass('loaded');
    $('main').html(page_cache[encodeURIComponent(State.url)]);

    _trackPage();
    _showPage();
    _updateTitle();
  }

  // Show active page bucket
  function _showPage() {
    // Add section class to body
    if (section_in != 'home') {
      $('body').attr('class','in-section active-' + section_in);
    }
    // Add is-single class?
    $('body').toggleClass('active-single', $('article.is-single').length>0);

    // Refit them vids!
    $('main').fitVids();

    // Reinit masonry
    $('.masonryme:not(.inited)').masonry({
      itemSelector: 'article',
      gutter: 10
    }).on('layoutComplete', function(){
      $(this).addClass('inited');
    });
    $('.masonryme').each(function() {
      var $this = $(this);
      $this.imagesLoaded(function() {
        $this.addClass('images-loaded').masonry('layout');
      });
    });

    // loading new page, scroll body to top
    if (scroll_to_top) {
      _scrollBody($('body'), 250, 0);
      scroll_to_top = false;
    }

    var myLazyLoad = new LazyLoad({
        // show_while_loading: false
    });

    // Add loaded class to init page transition animations
    setTimeout(function() {
      $('main').addClass('loaded');
    }, 150);

    // Scroll to top of page (this can be annoying to lose your scroll location...)
    // _scrollBody($('body'), 250, 0);
  }

  // Function to update document title after state change
  function _updateTitle() {
    var title = '';
    if ($('[data-page-title]').length) {
      title = $('[data-page-title]').first().attr('data-page-title');
    }

    if (title == '') {
      title = 'Nate Beaty';
    } else {
      title = title + ' – Nate Beaty';
    }
    // Snippet from Ajaxify to update title
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
    $(document).on('click', '.bigclicky, .journal-list article h1, .journal-list.archives li a', function(e) {
      e.preventDefault();
      var link = $(e.target).is('a') ? $(e.target) : $(this).find('h1:first a,h2:first a,a');
      if (link.length) {
        if (e.metaKey || link.attr('target')) {
          window.open(link[0].href);
        } else {
          History.pushState({}, '', link[0].href);
        }
      }
    });
  }

  function _initPagination() {
    $(document).on('click', '.pagination a', function(e) {
      e.preventDefault();
      History.pushState({}, '', this.href);
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

  // External URL?
  function _isExternal(url) {
    var domain = function(url) {
      return url.replace('http://','').replace('https://','').split('/')[0];
    };
    return domain(location.href) !== domain(url);
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
