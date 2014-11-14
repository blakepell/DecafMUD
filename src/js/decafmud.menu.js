(function (DecafMUD) {

var MI_NAME    = 0,
    MI_CSS_ID  = 1,
    MI_TOOLTIP = 2,
    MI_SUBMENU = 3,
    SMI_NAME    = 0,
    SMI_ID      = 1,
    SMI_HANDLER = 2;

BasicMenu = function (decaf_)
{
  var submenu_id = 0;

  /*
   * To add a new menu or menu item, just add it in the following variable.
   * The format is: [name of the menu item, css id, tool tip, list of
   * submenu items, each followed by the function to be executed as a
   * unbound variable.
   */
  this.entries = [
    [ 'File', 'menu_file', 'Used for (re-)connecting.', [
      'Reconnect', submenu_id++, this.reconnect ]
    ],
    [ 'Log', 'menu_log', 'Create a log file for this session.', [
      'HTML log', submenu_id++, this.showHtmlLog,
      'Plain Text Log', submenu_id++, this.showTextLog ]
    ],
    [ 'Options', 'menu_options', 'Change DecafMud Options', [
      'Font (Size)', submenu_id++, this.changeFontSize,
      'Macros', submenu_id++, this.configureMacros,
      'Flush History', submenu_id++, this.flushHistory ]
    ],
    [ 'Help', 'menu_help', 'Get help with Discworld and Client problems.', [
      'Client Features', submenu_id++, this.showClientFeaturesHelp,
      'About', submenu_id++, this.showAboutBox ]
    ]
  ];

  this.open_menu = -1;
  this.decaf = decaf_;
};

/**
 * =======================================
 * Functionality for generating the menus.
 * =======================================
 */
BasicMenu.prototype.build_menu = function(id) {
  var toolbar_menus = this.entries;
  var ret = toolbar_menus[id][MI_NAME] + "<ul id=\"sub" +
            toolbar_menus[id][MI_CSS_ID] + "\" class=\"submenu\">";
  for (j = 0; j < toolbar_menus[id][MI_SUBMENU].length; j+=3) {
    ret += "<li><a href=\"#\" "
      + "id=\"decafmud_submenu_"+toolbar_menus[id][MI_SUBMENU][j+1]+"\">"
      + toolbar_menus[id][MI_SUBMENU][j] + "</a></li>";
  }
  ret += "</ul>";
  return ret;
}

/**
 * This function tells decafmud.interface.discworld.js which menus it
 * should put on the screen.
 */
BasicMenu.prototype.get_menus = function() {
  var toolbar_menus = this.entries;
  var ret = new Array();
  for (i = 0; i < toolbar_menus.length; i++) {
    ret.push(toolbar_menus[i][MI_CSS_ID]);
    ret.push(this.build_menu(i));
    ret.push(toolbar_menus[i][MI_TOOLTIP]);
  }
  return ret;
}

BasicMenu.prototype.addMenuEvents = function() {
  var submenu, element, i, j;
  for (i = 0; i < this.entries.length; ++i) {
    submenu = this.entries[i][MI_SUBMENU];
    for (j = 0; j < submenu.length; j+=3) {
      if (typeof submenu[j + SMI_HANDLER] != 'function') {
        console.error('Invalid handler for submenu ' + submenu[j + SMI_NAME]);
      }
      else {
        element = document.querySelector( '#decafmud_submenu_' + submenu[j + SMI_ID]);
        element.addEventListener('click', submenu[j + SMI_HANDLER].bind(this));
      }
    }
  }
}

/**
 * ================================================
 * Functionality for opening and closing the menus.
 * ================================================
 */
BasicMenu.prototype.close_menus = function() {
  var toolbar_menus = this.entries;
  for (i = 0; i < toolbar_menus.length; i++) {
    var menuname = "sub" + toolbar_menus[i][MI_CSS_ID];
    document.getElementById(menuname).style.visibility = 'hidden';
  }
  this.open_menu = -1;
  this.decaf.ui.input.focus();
}

BasicMenu.prototype.toggleMenu = function(index) {
  var toolbar_menus = this.entries;
  var menuid = "sub" + toolbar_menus[index][MI_CSS_ID];
  if (this.open_menu == index) {
    document.getElementById(menuid).style.visibility = 'hidden';
    this.open_menu = -1;
    this.decaf.ui.input.focus();
  }
  else {
    this.close_menus();
    document.getElementById(menuid).style.visibility = 'visible';
    this.open_menu = index;
  }
}

/**
 * ============================================
 * Functionality for the individual menu items.
 * ============================================
 */

BasicMenu.prototype.reconnect = function() {
  this.decaf.reconnect();
}

BasicMenu.prototype.menu_log = function(style) {
  var popup = this.showPopup();
  var textarea = this.popup_textarea("editor", 70);

  // get the log file
  var txt = document.getElementById("mud-display").innerHTML;
  if (style == "plain") {
    txt = txt.replace(/\n/g, ' ');
    txt = txt.replace(/<br>/g, '\n');
    txt = txt.replace(/<.*?>/g, '');
    txt = txt.replace(/&nbsp;/g, ' ');
    txt = txt.replace(/\&lt;/g, '<');
    txt = txt.replace(/\&gt;/g, '>');
  }
  else {
    var currentTime = new Date();
    txt = "<html><head><title>Discworld " + currentTime.getDate() +
      "/" + currentTime.getMonth() + "/" + currentTime.getFullYear()+
      "</title>\n<link rel=\"stylesheet\" href=\"mud-colors.css\" "+
      "type=\"text/css\" />\n</head><body>\n" + txt +
      "</body></html>";
  }
  textarea.value = txt;
  
  // add an explanation
  add_element(popup, "p", "To log, copy the text from this area to "+
    "a text file (on most systems you can copy by clicking in the " +
    "field, then ctrl+a, ctrl+c).");
  if (style == "html") add_element(popup, "p", "The css-file used "+
    "for the colours can be downloaded <a href=\"mud-colors.css\">"+
    "here</a>.");

  // and end with a closing button
  var btns = button_line(popup);
  add_close_button(btns);
}

BasicMenu.prototype.showHtmlLog = function() {
  this.menu_log('html');
}

BasicMenu.prototype.showTextLog = function() {
  this.menu_log('plain');
}

BasicMenu.prototype.changeFontSize = function() {
  var pop = this.popup_textdiv(this.showPopup());
  add_element(pop, "h2", "Change fonts.");
  var frm = document.createElement("form");
  frm.name = "formfonts";
  pop.appendChild(frm);
  add_element(frm, "p", "Font Size: "+
    "<input name=\"txtfontsize\" type=\"text\" size=5 value=\"" +
    get_fontsize() + "\">");
  add_element(frm, "p", "(Select a value between 50 and 500 - the "+
    "default size is 100.)");
  add_element(frm, "p", "Font Family: "+
    "<input name=\"txtfontfamily\" type=\"text\" size=20 value=\"\">");
  add_element(frm, "p", "(Select a font that is supported by your "+
    "browser, or leave empty for the current font.)");
  var savebtn = document.createElement("a");
  savebtn.className = "fakebutton";
  savebtn.href = "#";
  savebtn.innerHTML = "<big>Save</big>";
  frm.appendChild(savebtn);
  savebtn.addEventListener('click', this.applyFontChange.bind(this));
  add_element(frm, "span", "&nbsp;&nbsp;&nbsp;");
  var closebtn = document.createElement("a");
  closebtn.className = "fakebutton";
  closebtn.href = "#";
  closebtn.innerHTML = "<big>Cancel</big>";
  frm.appendChild(closebtn);
  closebtn.addEventListener('click', this.closePopup.bind(this));
}

BasicMenu.prototype.applyFontChange = function() {
  var k = parseInt(document.formfonts.txtfontsize.value);
  if (k < 50 || k > 500) {
    alert("Please select a size between 50 and 500.");
    return;
  }

  set_fontsize(k);
  var s = document.formfonts.txtfontfamily.value;
  if (s != "")
    decaf.ui.el_display.style.fontFamily = "'" + s + "', Consolas, "+
          "Courier, 'Courier New', 'Andale Mono', Monaco, monospace";
  this.closePopup();
  decaf.ui.display.scroll();
  decaf.ui.input.focus();
}

BasicMenu.prototype.configureMacros = function() {
  var pop = this.popup_textdiv(this.showPopup());

  add_element(pop, "p", "Decafmud supports both F-key macro's "+
    "(you need to use the mud's alias system to use them, for "+
    "example <tt>alias f1 score</tt>), and numpad navigation (you "+
    "need to turn numlock on for this to work).");
  var frm = document.createElement("form");
  frm.name = "formmacros";
  pop.appendChild(frm);
  add_element(frm, "p", "<input type=\"checkbox\" name=\"cfkey\" " +
    (fkeymacros ? "checked" : "") + "/>Enable f-key macros.");
  add_element(frm, "p", "<input type=\"checkbox\" name=\"cnumpad\" "+
    (numpadwalking ? "checked" : "") + "/>Enable numpad navigation.");
  var savebtn = document.createElement("a");
  savebtn.className = "fakebutton";
  savebtn.href = "#";
  savebtn.innerHTML = "<big>Save</big>";
  frm.appendChild(savebtn);
  savebtn.addEventListener('click', this.applyMacrosChange.bind(this));
  add_element(frm, "span", "&nbsp;&nbsp;&nbsp;");
  var closebtn = document.createElement("a");
  closebtn.className = "fakebutton";
  closebtn.href = "#";
  closebtn.innerHTML = "<big>Cancel</big>";
  frm.appendChild(closebtn);
  closebtn.addEventListener('click', this.closePopup.bind(this));
}

BasicMenu.prototype.flushHistory = function() {
  document.getElementById("mud-display").innerHTML = "";
}

BasicMenu.prototype.applyMacrosChange = function() {
  var fkey = document.formmacros.cfkey.checked;
  var nump = document.formmacros.cnumpad.checked;
  toggle_fkeys(fkey);
  toggle_numpad(nump);
  this.closePopup();
}

BasicMenu.prototype.showClientFeaturesHelp = function() {
  // create the popup
  var pop = this.popup_textdiv(this.showPopup());
  // show the necessary help
  var el;
  add_element(pop, "h2", "Client Features");
  add_element(pop, "p", "Decafmud is a basic mud client tailored "+
    "to Discworld, with just a few features.");
  el = document.createElement("ul");
  pop.appendChild(el);
  add_element(el, "li", "To send multiple commands at once, separate "+
    "them by putting ;; in between.<br>For example: "+
    "<tt>look;;score</tt>");
  add_element(el, "li", "You can browse your previous commands with "+
    "the up and down arrow keys.");
  add_element(el, "li", "The F1, F2, ... keys send the commands f1, "+
    "f2, ... to the mud.  You can use Discworld's alias system to "+
    "attach commands to this, for example \"alias f1 score\".  Use "+
    "\"help alias\" when logged in to the mud for more information.");
  add_element(el, "li", "You can use the numpad for quick "+
    "navigation.  Make sure you have the numlock key on for it to "+
    "work.");
  add_element(el, "li", "To create a log file from your current "+
    "session, use the Log menu.  Unfortunately it is not possible "+
    "(due to browers' security restrictions) to automatically save "+
    "a file to your computer, so you will have to copy it to a text "+
    "editor yourself.");
  add_element(pop, "h3", "Other Mud Clients");
  add_element(pop, "p", "If you want more features, or DecafMud "+
    "does not work for you, you can play Discworld from any mud "+
    "client.  Searching the web for \"mud client\" should bring up "+
    "several options, or you can try "+
    "<a href=\"http://discworld.atuin.net/lpc/external/java/newtelnet/"+
    "java_client.shtml\">the java client</a>, or "+
    "<a href=\"http://sourceforge.net/projects/coldbeer/files/\">Coldbeer</a>"+
    ", both aimed at Discworld.  To connect to discworld from another "+
    "client, connect to discworld.atuin.net on port 4242 or 23.");
  // add end with a closing button
  add_close_button(button_line(pop));
}

BasicMenu.prototype.showAboutBox = function() {
  this.decaf.about();
}

/**
 * ===============================================
 * Functionality to open and close a popup window.
 * ===============================================
 */

BasicMenu.prototype.showPopup = function() {
  // if we already have a popup, clear it
  if (this.popup != null) {
    while (this.popup.children.length > 0) { 
      this.popup.removeChild(this.popup.children.item(1));
    }    
  }

  // otherwise create it
  this.popup = document.createElement("div");

  // get data about the screen size
  var w = this.decaf.ui.maxPopupWidth();
  var h = this.decaf.ui.maxPopupHeight();
  var t = this.decaf.ui.verticalPopupOffset();
  var l = this.decaf.ui.horizontalPopupOffset();

  l += w * 2 / 10;
  w = w * 6 / 10;
  h = h * 7 / 10;

  this.popup.style.width = w + "px";
  this.popup.style.height = h + "px";
  this.popup.style.top = t + "px";
  this.popup.style.left = l + "px";
  this.popup.className = 'decafmud window';
  this.popup.id = "popup";
  this.decaf.ui.container.insertBefore(this.popup, this.decaf.ui.el_display);

  // create the draggable header
  this.popupheader = document.createElement("div");
  this.popupheader.style.width = w + "px";
  this.popupheader.style.height = "25px";
  this.popupheader.style.top = "0px";
  this.popupheader.className = 'decafmud window-header';
  this.popupheader.id = "popupheader";
  this.popup.appendChild(this.popupheader);
  this.headerdrag = new dragObject("popup", "popupheader");

  // create a close button
  var x = document.createElement('button');
  x.innerHTML = '<big>X</big>';
  x.className = 'closebutton';
  x.onclick = this.closePopup.bind(this);
  this.popup.appendChild(x);

  return this.popup;
}

BasicMenu.prototype.closePopup = function() {
  this.headerdrag.StopListening(true);
  this.popup.parentNode.removeChild(this.popup);
  this.popup = undefined;
  this.popupheader = undefined;
}

var add_element = function(inside, kind, innerhtml) {
  var el = document.createElement(kind);
  el.innerHTML = innerhtml;
  inside.appendChild(el);
  return el;
}

var button_line = function(par) {
  var buttonline = document.createElement("p");
  buttonline.style.textAlign = "center";
  par.appendChild(buttonline);
  return buttonline;
}

var add_close_button = function(parentob) {
  var closebtn = document.createElement('a');
  closebtn.className = "fakebutton";
  closebtn.href = 'javascript:close_popup();';
  closebtn.innerHTML = '<big>Close</big>';
  parentob.appendChild(closebtn);
}

BasicMenu.prototype.popup_header = function(text) {
  var p = document.createElement("p");
  p.innerHTML = text;
  p.style.marginLeft = "5px";
  p.style.marginRight = "5px";
  p.style.marginBottom = "0px";
  p.style.fontSize = "150%";
  p.className = "headertext";
  this.popup.appendChild(p);
}

BasicMenu.prototype.popup_textarea = function(name, adjust) {
  var w = this.decaf.ui.maxPopupWidth() * 6 / 10 - 15;
  var h = this.decaf.ui.maxPopupHeight() * 7 / 10 - 100 - adjust;
  var textarea = document.createElement("textarea");
  textarea.id = name;
  textarea.cols = 80;
  textarea.rows = 20;
  textarea.style.width = w + "px";
  textarea.style.height = h + "px";
  textarea.style.margin = "5px";
  this.popup.appendChild(textarea);
  return textarea;
}

BasicMenu.prototype.popup_textdiv = function() {
  var w = this.decaf.ui.maxPopupWidth() * 6 / 10 - 10;
  var h = this.decaf.ui.maxPopupHeight() * 7 / 10 - 60;
  var div = document.createElement("div");
  div.style.width = w + "px";
  div.style.height = h + "px";
  div.style.margin = "5px";
  div.style.overflowY = "auto";
  this.popup.appendChild(div);
  return div;
}

// Expose this to DecafMUD
DecafMUD.plugins.Menu.basic = BasicMenu;
})(DecafMUD);
