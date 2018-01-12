

(function (root, factory) {
  if (typeof exports === 'object') {

    factory(exports);
  } else if (typeof define === 'function' && define.amd) {

    define(['exports'], factory);
  } else {

    factory(root);
  }
} (this, function (exports) {

  var VERSION = '0.3.0';


  function WideArea(obj) {
    this._targetElement = obj;


    this._wideAreaId = 1;

    this._options = {
      wideAreaAttr: 'data-widearea',
      exitOnEsc: true,
      defaultColorScheme: 'light',
      closeIconLabel: 'Close WideArea',
      changeThemeIconLabel: 'Toggle Color Scheme',
      fullScreenIconLabel: 'WideArea Mode',
      autoSaveKeyPrefix: 'WDATA-'
    };

    _enable.call(this);
  }


  function _saveToStorage(id, value) {
    //save textarea data in localStorage
    localStorage.setItem(this._options.autoSaveKeyPrefix + id, value);
  }


  function _getFromStorage(id) {
    return localStorage.getItem(this._options.autoSaveKeyPrefix + id);
  }


  function _clearStorage(value) {

    var currentElement, id;
    if (typeof(value) == "string") {
      //with css selector
      currentElement = this._targetElement.querySelector(value);
      if (currentElement) {
        id = parseInt(currentElement.getAttribute("data-widearea-id"));
      }
    } else if (typeof(value) == "number") {
      //first, clear it from storage
      currentElement = this._targetElement.querySelector('textarea[data-widearea-id="' + value + '"]');
      id = value;
    } else if (typeof(value) == "object") {
      //with DOM
      currentElement = value;

      if (currentElement) {
        id = parseInt(currentElement.getAttribute("data-widearea-id"));
      }
    }

    //and then, clear the textarea
    if (currentElement && id) {
      currentElement.value = '';
      localStorage.removeItem(this._options.autoSaveKeyPrefix + id);
    }
  }


  function _enable() {
    var self = this,
    //select all textareas in the target element
    textAreaList = this._targetElement.querySelectorAll('textarea[' + this._options.wideAreaAttr + '=\'enable\']'),

    // don't make functions within a loop.
    fullscreenIconClickHandler = function() {
      _enableFullScreen.call(self, this);
    };

    //to hold all textareas in the page
    this._textareas = [];

    //then, change all textareas to widearea
    for (var i = textAreaList.length - 1; i >= 0; i--) {
      var currentTextArea = textAreaList[i];
      //create widearea wrapper element
      var wideAreaWrapper  = document.createElement('div'),
          wideAreaIcons    = document.createElement('div'),
          fullscreenIcon   = document.createElement('a');

      wideAreaWrapper.className = 'widearea-wrapper';
      wideAreaIcons.className   = 'widearea-icons';
      fullscreenIcon.className  = 'widearea-icon fullscreen';
      fullscreenIcon.title = this._options.fullScreenIconLabel;

      //hack!
      fullscreenIcon.href = 'javascript:void(0);';
      fullscreenIcon.draggable = false;

      //bind to click event
      fullscreenIcon.onclick = fullscreenIconClickHandler;

      //add widearea class to textarea
      currentTextArea.className = (currentTextArea.className + " widearea").replace(/^\s+|\s+$/g, "");

      //set wideArea id and increase the stepper
      currentTextArea.setAttribute("data-widearea-id", this._wideAreaId);
      wideAreaIcons.setAttribute("id", "widearea-" + this._wideAreaId);

      //Autosaving
      if (_getFromStorage.call(this, this._wideAreaId)) {
        currentTextArea.value = _getFromStorage.call(this, this._wideAreaId);
      }

      var onTextChanged = function () {
        _saveToStorage.call(self, this.getAttribute('data-widearea-id'), this.value);
      };
      //add textchange listener
      if (currentTextArea.addEventListener) {
        currentTextArea.addEventListener('input', onTextChanged, false);
      } else if (currentTextArea.attachEvent) { //IE hack
        currentTextArea.attachEvent('onpropertychange', onTextChanged);
      }

      //go to next wideArea
      ++this._wideAreaId;

      //set icons panel position
      _renewIconsPosition(currentTextArea, wideAreaIcons);

      //append all prepared div(s)
      wideAreaIcons.appendChild(fullscreenIcon);
      wideAreaWrapper.appendChild(wideAreaIcons);

      //and append it to the page
      document.body.appendChild(wideAreaWrapper);

      //add the textarea to internal variable
      this._textareas.push(currentTextArea);
    }

    //set a timer to re-calculate the position of textareas, I don't know whether this is a good approach or not
    this._timer = setInterval(function() {
      for (var i = self._textareas.length - 1; i >= 0; i--) {
        var currentTextArea = self._textareas[i];
        //get the related icon panel. Using `getElementById` for better performance
        var wideAreaIcons = document.getElementById("widearea-" + currentTextArea.getAttribute("data-widearea-id"));

        //get old position
        var oldPosition = _getOffset(wideAreaIcons);

        //get the new element's position
        var currentTextareaPosition = _getOffset(currentTextArea);

        //only set the new position of old positions changed
        if((oldPosition.left - currentTextareaPosition.width + 21) != currentTextareaPosition.left || oldPosition.top != currentTextareaPosition.top) {
          //set icons panel position
          _renewIconsPosition(currentTextArea, wideAreaIcons, currentTextareaPosition);
        }
      };
    }, 200);
  }


  function _renewIconsPosition(textarea, iconPanel, textAreaPosition) {
    var currentTextareaPosition = textAreaPosition || _getOffset(textarea);
    //set icon panel position
    iconPanel.style.left = currentTextareaPosition.left + currentTextareaPosition.width - 21 + "px";
    iconPanel.style.top  = currentTextareaPosition.top + "px";
  }


  function _getOffset(element) {
    var elementPosition = {};

    //set width
    elementPosition.width = element.offsetWidth;

    //set height
    elementPosition.height = element.offsetHeight;

    //calculate element top and left
    var _x = 0;
    var _y = 0;
    while(element && !isNaN(element.offsetLeft) && !isNaN(element.offsetTop)) {
      _x += element.offsetLeft;
      _y += element.offsetTop;
      element = element.offsetParent;
    }
    //set top
    elementPosition.top = _y;
    //set left
    elementPosition.left = _x;

    return elementPosition;
  }


  function _getPropValue (element, propName) {
    var propValue = '';
    if (element.currentStyle) { //IE
      propValue = element.currentStyle[propName];
    } else if (document.defaultView && document.defaultView.getComputedStyle) { //Others
      propValue = document.defaultView.getComputedStyle(element, null).getPropertyValue(propName);
    }

    //Prevent exception in IE
    if(propValue.toLowerCase) {
      return propValue.toLowerCase();
    } else {
      return propValue;
    }
  }


  function _enableFullScreen(link) {
    var self = this;

    //first of all, get the textarea id
    var wideAreaId = parseInt(link.parentNode.id.replace(/widearea\-/, ""));

    //I don't know whether is this correct or not, but I think it's not a bad way
    var targetTextarea = document.querySelector("textarea[data-widearea-id='" + wideAreaId + "']");

    //clone current textarea
    var currentTextArea = targetTextarea.cloneNode();

    //add proper css class names
    currentTextArea.className = ('widearea-fullscreen '   + targetTextarea.className).replace(/^\s+|\s+$/g, "");
    targetTextarea.className  = ('widearea-fullscreened ' + targetTextarea.className).replace(/^\s+|\s+$/g, "");

    var controlPanel = document.createElement('div');
    controlPanel.className = 'widearea-controlPanel';

    //create close icon
    var closeIcon = document.createElement('a');
    closeIcon.href = 'javascript:void(0);';
    closeIcon.className = 'widearea-icon close';
    closeIcon.title = this._options.closeIconLabel;
    closeIcon.onclick = function(){
      _disableFullScreen.call(self);
    };

    //disable dragging
    closeIcon.draggable = false;

    //create close icon
    var changeThemeIcon = document.createElement('a');
    changeThemeIcon.href = 'javascript:void(0);';
    changeThemeIcon.className = 'widearea-icon changeTheme';
    changeThemeIcon.title = this._options.changeThemeIconLabel;
    changeThemeIcon.onclick = function() {
      _toggleColorScheme.call(self);
    };

    //disable dragging
    changeThemeIcon.draggable = false;

    controlPanel.appendChild(closeIcon);
    controlPanel.appendChild(changeThemeIcon);

    //create overlay layer
    var overlayLayer = document.createElement('div');
    overlayLayer.className = 'widearea-overlayLayer ' + this._options.defaultColorScheme;

    //add controls to overlay layer
    overlayLayer.appendChild(currentTextArea);
    overlayLayer.appendChild(controlPanel);

    //finally add it to the body
    document.body.appendChild(overlayLayer);

    //set the focus to textarea
    currentTextArea.focus();

    //set the value of small textarea to fullscreen one
    currentTextArea.value = targetTextarea.value;

    var onTextChanged = function () {
      _saveToStorage.call(self, this.getAttribute('data-widearea-id'), this.value);
    };
    //add textchange listener
    if (currentTextArea.addEventListener) {
      currentTextArea.addEventListener('input', onTextChanged, false);
    } else if (currentTextArea.attachEvent) { //IE hack
      currentTextArea.attachEvent('onpropertychange', onTextChanged);
    }

    //bind to keydown event
    this._onKeyDown = function(e) {
      if (e.keyCode === 27 && self._options.exitOnEsc) {
        //escape key pressed
        _disableFullScreen.call(self);
      }
      if (e.keyCode == 9) {
        // tab key pressed
        e.preventDefault();
        var selectionStart = currentTextArea.selectionStart;
        currentTextArea.value = currentTextArea.value.substring(0, selectionStart) + "\t" + currentTextArea.value.substring(currentTextArea.selectionEnd);
        currentTextArea.selectionEnd = selectionStart + 1;
      }
    };
    if (window.addEventListener) {
      window.addEventListener('keydown', self._onKeyDown, true);
    } else if (document.attachEvent) { //IE
      document.attachEvent('onkeydown', self._onKeyDown);
    }
  }


  function _toggleColorScheme() {
    var overlayLayer  = document.querySelector(".widearea-overlayLayer");
    if(/dark/gi.test(overlayLayer.className)) {
      overlayLayer.className = overlayLayer.className.replace('dark', 'light');
    } else {
      overlayLayer.className = overlayLayer.className.replace('light', 'dark');
    }
  }


  function _disableFullScreen() {
    var smallTextArea = document.querySelector("textarea.widearea-fullscreened");
    var overlayLayer  = document.querySelector(".widearea-overlayLayer");
    var fullscreenTextArea = overlayLayer.querySelector("textarea");

    //change the focus
    smallTextArea.focus();

    //set fullscreen textarea to small one
    smallTextArea.value = fullscreenTextArea.value;

    //reset class for targeted text
    smallTextArea.className = smallTextArea.className.replace(/widearea-fullscreened/gi, "").replace(/^\s+|\s+$/g, "");

    //and then remove the overlay layer
    overlayLayer.parentNode.removeChild(overlayLayer);

    //clean listeners
    if (window.removeEventListener) {
      window.removeEventListener('keydown', this._onKeyDown, true);
    } else if (document.detachEvent) { //IE
      document.detachEvent('onkeydown', this._onKeyDown);
    }
  }


  function _mergeOptions(obj1, obj2) {
    var obj3 = {}, attrname;
    for (attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
  }

  var wideArea = function (selector) {
    if (typeof (selector) === 'string') {
      //select the target element with query selector
      var targetElement = document.querySelector(selector);

      if (targetElement) {
        return new WideArea(targetElement);
      } else {
        throw new Error('There is no element with given selector.');
      }
    } else {
      return new WideArea(document.body);
    }
  };


  wideArea.version = VERSION;

  //Prototype
  wideArea.fn = WideArea.prototype = {
    clone: function () {
      return new WideArea(this);
    },
    setOption: function(option, value) {
      this._options[option] = value;
      return this;
    },
    setOptions: function(options) {
      this._options = _mergeOptions(this._options, options);
      return this;
    },
    clearData: function(value) {
      _clearStorage.call(this, value);
      return this;
    }
  };

  exports.wideArea = wideArea;
  return wideArea;
}));
