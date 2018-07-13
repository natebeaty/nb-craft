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
//=include "../bower_components/jquery-touchswipe/jquery.touchSwipe.js"

var Nb = (function($) {

  var History = window.History,
      State,
      root_url = History.getRootUrl(),
      relative_url,
      section_in,
      scroll_to_top = false,
      page_cache = {},
      lazyloader,
      cart,
      searching = false,
      checking_out = false,
      search_timer,
      eggs = ['dizzy', 'jab', 'pow', 'wizard'],
      egg_at = 0;

  function _init() {
    // Localstorage cart
    cart = localStorage.getItem('Nb.cart') ? JSON.parse(localStorage.getItem('Nb.cart')) : [];
    $('.cart').toggleClass('cart-active', cart.length>0);

    // Fit them vids!
    $('main').fitVids();

    // Trigger lazyload
    lazyloader = new LazyLoad({
      threshold: 1000,
      callback_load: function(el) {
        // Add class to wrap to remove loading display
        $(el).parents('.ratiowrap:first').addClass('loaded');
        var h = $(el).attr('height');
        if (h>0) {
          $(el).parents('.ratiowrap:first').css({'padding-bottom':'','max-height': h + 'px'});
        }
      }
    });

    // Keyboard nerds rejoice!
    $(document).keydown(function(e) {
      // Esc
      if (e.keyCode === 27) {
        // Trigger X click to close search/cart/checkout/go back/go home
        $('.x').trigger('click');
      }

      if (!searching && !checking_out) {
        if (!e.metaKey && !e.shiftKey && e.keyCode === 191) {
          e.preventDefault();
          // Pressing forward-slash opens search
          _showSearch();

        } else if (!e.metaKey && e.keyCode === 37) {
          // Left arrow key triggers previous post
          if (section_in != 'home' && $('.pagination a[rel=previous]').length) {
            $('.pagination a[rel=previous]').trigger('click');
          }

        } else if (!e.metaKey && e.keyCode === 39) {
          // Right arrow key triggers previous post
          if (section_in != 'home' && $('.pagination a[rel=next]').length) {
            $('.pagination a[rel=next]').trigger('click');
          }

        } else if (!e.metaKey && !e.shiftKey && e.keyCode >= 48 && e.keyCode <= 90) {
          // Pressing any letter starts searching ... annoying?
          _showSearch();
        }
      }

      // Pressing enter when searching opens the active link
      if (searching) {
        if (e.keyCode === 13) {
          if ($('.search .results a.active').length) {
            $('.search .results a.active').trigger('click');
          }
        }
        if (e.keyCode === 40 || e.keyCode === 38) {
          // Arrow up and down to change active link in search results
          if ($('.search .results').length) {
            e.preventDefault();
            var $active = $('.search .results a.active').removeClass('active');
            var $next;
            if (e.keyCode===40) {
              $next = $active.next('a').length ? $active.next('a') : $active;
            } else {
              $next = $active.prev('a').length ? $active.prev('a') : $active;
            }
            $next.addClass('active');

            // Scroll results if active is above/below the .results fold
            var st = $('.search .results').scrollTop();
            if ($next.position().top > $('.search .results').height() - 100) {
              $('.search .results').scrollTop(st + $next.position().top - $('.search .results').height() + 100);
            } else if ($next.position().top < 0) {
              $('.search .results').scrollTop(st + $next.position().top);
            }
          }
        }
      }
    });

    // Search submit does nothing
    $('.search').on('submit', function(e) {
      e.preventDefault();
    });

    // Clicking on search result pushes to state
    $(document).on('click', '.search .results a', function(e) {
      if (!e.metaKey) {
        e.preventDefault();
        _hideSearch();
        History.pushState({}, '', $(this).attr('href'));
      }
    });

    // Update search results on keyup of search field
    $('input[name=s]').on('keyup', function(e) {
      if (!(e.keyCode>36 && e.keyCode<41) && e.keyCode!==13) {
        _checkSearch();
      }
    });

    // Colorize the stache on hover on non-touch clients
    if (!Modernizr.touchevents) {
      $('nav.main a').hover(function() {
        _colorStache(this);
      });
    }

    // Natehead clicks
    $(document).on('click', '#natehead,h1.title', function(e) {
      e.preventDefault();
      if (document.body.className==='') {
        var easter = eggs[egg_at];
        $('#natehead').addClass(easter);
        egg_at = (egg_at === eggs.length - 1) ? 0 : egg_at + 1;
        setTimeout(function() {
          $('#natehead').removeClass(easter);
        }, 2000);
      } else {
        _showNav();
      }
    });

    // Main nav click: scroll page up or push URL into history
    $('nav.main a').on('click', function(e) {
      e.preventDefault();
      _colorStache(this);
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
      if (checking_out) {
        // Hide checkout if open
        _hideCheckout();
        _hideCart();
      } else if (searching) {
        // Hide search if open
        _hideSearch();
      } else if ($('body').hasClass('active-cart')) {
        // Hide cart if open
        _hideCart();
      } else if ($('main .is-single').length) {
        // If we're on a single page, go back to section_in landing (e.g. /comics)
        History.pushState({}, '', '/' + section_in);
      } else {
        // If we're on a landing page, go to the homepage
        _showNav();
      }
    });

    // Search button
    $('.s').on('click', function(e) {
      e.preventDefault();
      _showSearch();
    });

    // User-content linking internally
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

    // Cache any pages already loaded
    $('section[data-page]').each(function() {
      // page_cache[encodeURIComponent(State.url)] = $.parseHTML(response);
      page_cache[encodeURIComponent(History.getRootUrl().replace(/\/$/,'') + $(this).attr('data-page'))] = $(this).prop('outerHTML');
    });

    _initCart();
    _initBigClicky();
    _initPagination();
    _getSectionVar();
    _initStateHandling();
    setTimeout(_showPage, 150);

    $('#stache').velocity({ fill: '#3F2004' });

  } // end init()

  // Open the search man!
  function _showSearch() {
    searching = true;
    $('input[name=s]')[0].focus();
    _checkSearch();
  }

  // Clear the search man!
  function _hideSearch() {
    if (searching) {
      searching = false;
      $('input[name=s]').val('')[0].blur();
      $('.search .results').empty();
      _checkSearch();
    }
  }

  // Clear the checkout man!
  function _hideCheckout() {
    if (checking_out) {
      checking_out = false;
      $('body').removeClass('checking-out');
    }
  }

  // Check if searching, set timeout to show search results if so
  function _checkSearch() {
    $('body').toggleClass('searching', searching);
    if (searching) {
      $('input[name=s]')[0].focus();
      if (search_timer) {
        clearTimeout(search_timer);
      }
      search_timer = setTimeout(_searchSearch, 250);
    }
  }

  // Actually execute search
  function _searchSearch() {
    var s = $('input[name=s]').val();
    var bait = new RegExp('^' + s.toLowerCase(), 'i');
    $('.search .results').empty();
    if (s !== '') {
      // Search main nav sections
      $('nav.main a').each(function() {
        if($(this).text().match(bait)) {
          $(this).clone().appendTo('.search .results');
        }
      });

      // Search Craft entries
      $.ajax('/search?q=' + s,{
        dataType: 'json'
      }).done(function(data){
        $.each( data.entries, function( i, entry ) {
          $('<a>').attr('href', entry.url).text(entry.title).appendTo('.search .results');
        });
        $('.search .results a:first').addClass('active');
      }).fail(function(xhr, status, error){
          console.log('FAIL: ' + status + ' Error: ' + error);
      });
    }
  }

  // Add item to cart
  function _addToCart(product) {
    var exists = $.grep(cart, function(obj) {
      return obj.title === product.title;
    });
    if (!exists.length) {
      cart.push(product);
    } else {
      exists[0].quantity +=1;
    }
    _saveCart();
    _showCart();
  }
  // Remove item from cart
  function _removeFromCart(id) {
    if (cart[id]) {
      if (cart[id].quantity > 1) {
        cart[id].quantity +=-1;
      } else {
        cart.splice(id,1);
      }
    }
    _saveCart();
    _showCart();
  }
  // Save cart if localStorage
  function _saveCart() {
    if (Modernizr.localstorage) {
      localStorage.setItem('Nb.cart', JSON.stringify(cart));
    }
  }
  // Hide/show cart functions
  function _hideCart() {
    _hideCheckout();
    $('body').removeClass('active-cart');
  }
  function _showCart() {
    var cost = 0,
        total = 0;
    $('.cart-items,.cart-total').empty();
    // Loop through cart items and build rudimentary HTML cart
    if (cart.length) {
      $('.cart').addClass('cart-active').removeClass('loading');
      for (var i = cart.length - 1; i >= 0; i--) {
        cost = cart[i].quantity * parseFloat(cart[i].price);
        $('<li data-id="' + i + '">' + cart[i].title + ' x ' + cart[i].quantity + ': $' + cost + '</li>').appendTo('.cart-items');
        total += cost;
      }
      $('.cart-total').text('Total: $' + total);

      // Triggers showing of cart, along with handling of $('.x') to close cart
      setTimeout(function() {
        $('body').addClass('active-cart');
      }, 50);
    } else {
      _hideCart();
      setTimeout(function() {
        $('.cart').removeClass('cart-active');
      }, 150);
    }
  }

  // Build PayPal form and submit checkout
  function _checkoutCart() {
    var $form = $('form.cart-wrap');
    for(var i = 0; i < cart.length; ++i) {
      $("<input type='hidden' name='quantity_" + (i+1) + "' value='" + cart[i].quantity + "'>" +
        "<input type='hidden' name='item_name_" + (i+1) + "' value='" + cart[i].title + "'>" +
        "<input type='hidden' name='item_number_" + (i+1) + "' value='nb-" + cart[i].id + "'>" +
        "<input type='hidden' name='amount_" + (i+1) + "' value='" + cart[i].price + "'>")
      .appendTo($form);
    }
    // PayPal so goddamn slow
    $('.cart').addClass('loading');
    setTimeout(function() {
      $form.submit();
    }, 150);
  }

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

      if (State.url == root_url) {
        // Remove any active-* body classes to return to main nav
        $('body').attr('class', '');
        _updateTitle();
      } else {
        // Page cached?
        if (page_cache[encodeURIComponent(State.url)]) {
          _updatePage();
        } else {
          // If not, scroll to top and load the page
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
        console.log('foo',response);
        page_cache[encodeURIComponent(State.url)] = response;
        _updatePage();
      }
    });
  }

  // Update page with cached content for current URL, track it, show it
  function _updatePage() {
    $('main').removeClass('loaded');
    $('main').html(page_cache[encodeURIComponent(State.url)]);

    _trackPage();
    _showPage();
    _updateTitle();
  }

  // Show active page
  function _showPage() {
    // Hide cart
    _hideCart();

    // Add section class to body
    if ($('.four-oh-four').length) {
      $('body').attr('class','in-section active-404');
    } else if (section_in != 'home') {
      $('body').attr('class','in-section active-' + section_in);
    }

    // Add is-single class?
    $('body').toggleClass('active-single', $('article.is-single').length>0);

    // Refit them vids!
    $('main').fitVids();

    // Re-init masonry
    $('.masonryme:not(.inited)').masonry({
      itemSelector: 'article',
      gutter: 10
    }).on('layoutComplete', function(){
      $(this).addClass('inited');
    });

    // Loading new page, scroll body to top
    if (scroll_to_top) {
      _scrollBody($('body'), 250, 0);
      scroll_to_top = false;
    }
    $('.lazy[width]:not(.wrapped):not(.loaded)').each(function() {
      var w = this.getAttribute('width');
      var h = this.getAttribute('height');
      if (h>0 && w>0) {
        var ratio = h / w * 100;
        $(this).wrap('<div class="ratiowrap" style="padding-bottom:' + ratio + '%;max-width:' + w + 'px;"></div>');
      }
    });

    // Re-init lazyload
    lazyloader.update();

    // Add loaded class to init page transition animations
    setTimeout(function() {
      $('main').addClass('loaded');
    }, 150);

  }

  // Function to update document title after state change
  function _updateTitle() {
    var title = '';
    if (State.url != root_url && $('[data-page-title]').length) {
      title = $('[data-page-title]').first().attr('data-page-title');
    }
    if (title == '') {
      title = 'Nate Beaty’s Head in the Clouds';
    } else {
      title = title + ' – Nate Beaty';
    }

    // Snippet from Ajaxify to update title tag
    document.title = title;
    try {
      document.getElementsByTagName('title')[0].innerHTML = document.title.replace('<','&lt;').replace('>','&gt;').replace(' & ',' &amp; ');
    } catch (Exception) {}
  }

  // Go home
  function _showNav() {
    History.pushState({}, '', root_url);
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
    // Also shoving in general ajax link hijacking here — todo: move this to its own function for all content links
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

  // Janky li'l cart
  function _initCart() {
    // braintree.setup(client_id, "custom", {
    //   paypal: {
    //     container: "paypal-container",
    //   },
    //   onPaymentMethodReceived: function (obj) {
    //     console.log(obj, obj.nonce);
    //   }
    // });
    // SEO-useless
    $('<button class="checkout">Checkout</button><button>Clear</button>').insertBefore('#paypal-container');
    // Toggle cart overlay
    $(document).on('click', '.cart .icon', function() {
      if ($('body').hasClass('active-cart')) {
        _hideCart();
      } else {
        _showCart();
      }
    });
    // Swipe up to close cart on mobile
    $('.cart-wrap').swipe({
      swipeUp:function(event, direction, distance, duration, fingerCount) {
        if ($('body').hasClass('active-cart')) {
          _hideCart();
        }
      },
      threshold: 10
    });
    // Clicking on line items
    $(document).on('click', '.cart li', function() {
      _removeFromCart($(this).attr('data-id'));
    });
    // Buy buttons
    $(document).on('click', 'a.buy', function() {
      _addToCart({ title: $(this).attr('data-title'), price: $(this).attr('data-price'), 'quantity': 1, id: $(this).attr('data-id') });
    });
    // Cart actions
    $(document).on('click', '.cart button', function(e) {
      e.preventDefault();
      if ($(this).text() === 'Clear') {
        cart = [];
        _saveCart();
        _showCart();
      } else if ($(this).text() === 'Checkout') {
        // Build PayPal fields and submit form
        _checkoutCart();
        // checking_out = true;
        // $('body').addClass('checking-out');
      }
    });
  }

  // Ajaxify pagination links
  function _initPagination() {
    $(document).on('click', '.pagination a', function(e) {
      e.preventDefault();
      History.pushState({}, '', this.href);
    });
  }

  // Silly function to convert RGB -> hex
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
    init: _init
  };

})(jQuery);

// Fire up the mothership
jQuery(document).ready(Nb.init);
