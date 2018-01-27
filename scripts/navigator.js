const {ipcRenderer} = require('electron');
const {session} = require('electron').remote;
const remote = require('electron').remote;
const settings = require('electron-settings');
const urlExists = require('url-exists');
const loadJsonFile = require('load-json-file');
const open = require('open');
var screen = require('electron').screen.getPrimaryDisplay().bounds;

var desktopuseragent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) UR/55.1.2883.71 Chrome/60.0.3112.101 Safari/-703607808.-361452744";
var mobileuseragent = "Mozilla/5.0 (Linux; Android 8.0; Pixel XL Build/LMY48B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/43.0.2357.65 Mobile Safari/537.36";

session.fromPartition('', { cache: false });

var newtabdefaulthomepage = "https://www.google.com";

var counter = 0;

// languages support
var lang = "";
var languages = "";
loadJsonFile('languages.json').then(json => {
	if(!settings.has('language')) {
		settings.set('language', 'EN');
	}
	lang = json[settings.get('language')];
	languages = Object.keys(json);
});

// adapt gui to lang
function guiInit() {
	$('#gotourl')[0].textContent = lang.gotourl;
	$('#openinbrowser')[0].textContent = lang.openinbrowser;
}

//defining vex js theme
vex.defaultOptions.className = 'vex-theme-plain';

// hover message
function sendMessage() {
	ipcRenderer.send('navHoverReq');
}

var webviews = [];

// how to display a page
function dispPage(url, homepage = 0) {
	$('.webview, #tabs .tab').removeClass('active');
	var w = $('<webview id="' + counter + '" src="' + url + '" class="webview active" preload="./scripts/interface.js" class="webview.active" useragent="' + mobileuseragent + '"></webview>').appendTo("#content")[0];
	if(!homepage) {
		$('#add-btn').before('<span class="tab sortable" id="' + counter + '" alt="' + url + '"></span>');
	}
	$('.webview:last, #tabs .tab:last').addClass('active');
	
	var c = counter;

	w.addEventListener('console-message', (e) => {
		if(e.message.startsWith('electron:')) {
			var json = e.message.replace(/electron:(.+)/, '$1');
			switch(json) {
				case "click":
					if($('#menu-top-right').next().hasClass('is-visible')) {
						$('#menu-top-right').trigger('click');
					}
					break;
				default:
					json = JSON.parse(json);
					switch(json.action) {
						case "blank":
							dispPage(json.url);
							break;
						case "Pageinfo":
							ModifyInfo(json.url, json.favicon, json.themeColor, c);
							break;
						default:
							break;
					}
					break;
			}
		}
	});

	// custom scrollbar
	w.addEventListener('dom-ready', function () {
		w.insertCSS('\
			::-webkit-scrollbar { \
				width: 5px; \
				height: 5px; \
				background-color: white; \
			} \
			\
			::-webkit-scrollbar-thumb { \
				-webkit-box-shadow: inset 0 0 6px rgba(0,0,0,.3); \
				background-color: #555; \
			} \
		  ');
	});
	
	w.addEventListener('error', (e) => {
		console.log("An error occured, please refresh or retry later");
	});

	var obj = {
		id: counter,
		active: true,
		webview: w
	}
	
	webviews.push(obj);

	for(var i = 0; i < webviews.length; i++) {
		if(webviews[i].id != counter) {
			webviews[i].active = false;
		}
	}

	counter++;
}

// how to add the tab to the bar
function ModifyInfo(url, favicon, themeColor, c) {
	if(c != 0) {
		// show favicon on tab
		if(favicon !== "") {
			var faviconurl = favicon;
			if(!favicon.indexOf("http") == 0) {
				faviconurl = url + favicon;
			}
			$(document).find('#tabs .tab#' + c).html('<img src="' + faviconurl + '" alt=" " />');
		} else {
			if(url !== "") {
				$(document).find('#tabs .tab#' + c).html('<img src="https://besticon-demo.herokuapp.com/icon?url=' + url + 'm&size=100" alt=" " />');
			}
		}
	
		// set themeColor as background color or reset it
		$(document).find('#tabs .tab#' + c).css("background-color", themeColor);
	}
}

// return active webview
function ActiveWebview() {
	for(var i = 0; i < webviews.length; i++) {
		if(webviews[i].active == true) {
			return webviews[i].webview;
		}
	}
	return null;
}

// how to add a new tab (with cutstom new tab URL)
function addTab() {
	if(settings.has('newtabhomepage')) {
		if(settings.get('newtabhomepage') !== '') {
			dispPage(settings.get('newtabhomepage'));
		} else {
			dispPage(newtabdefaulthomepage);
		}
	} else {
		dispPage(newtabdefaulthomepage);
	}
}

// how to close a tab
function closeTab(id) {
	if(id != 0) {
		vex.dialog.confirm({
			message: lang.confirmdelete,
			buttons: [
				$.extend({}, vex.dialog.buttons.YES, { text: lang.yes }),
				$.extend({}, vex.dialog.buttons.NO, { text: lang.no })
			],
			callback: function (confirmed) {
				if(confirmed) {
		
					// remove element from array
					for(var i = 0; i < webviews.length; i++) {
						if(webviews[i].id == id) {
							webviews.splice(i, 1);

							$(document).find('.tab.sortable#' + id).prev().trigger('click');

							//remove tab and webview
							$(document).find('.webview#' + id + ', .tab.sortable#' + id).remove();

							return true;
						}
					}
				}
			}
		});
	}
	return false;
}

// how to go to an url
function goToUrl() {
	var id = ActiveWebview().id;
	var yestext = lang.opennewtab;
	var inhomepage = false;
	if(!parseInt(id)) { inhomepage = true; }
	if(!inhomepage) { yestext = lang.go; }

	var value = "";
	if(!inhomepage) { value = ActiveWebview().src }

	vex.dialog.open({
		message: lang.gotourl + ' :',
		input: '<input name="url" type="text" placeholder="URL" required value="' + value + '" />',
		buttons: [
			$.extend({}, vex.dialog.buttons.YES, { text: yestext }),
			$.extend({}, vex.dialog.buttons.NO, { text: lang.cancel })
		],
		callback: function (data) {
			if (data) {
				var url = data.url;
				if(!/^https?:\/\//i.test(url)) {
					url = 'http://' + url;
				}
				urlExists(url, function(err, exists) {
					if(exists) {
						if(parseInt(id)) {
							ActiveWebview().loadURL(url);
						} else {
							dispPage(url);
						}
						return true;
					} else {
						vex.dialog.alert(lang.cantaccessurl);
						return false;
					}
				});
			}
		}
	});

	return false;
}

// how to switch beetween tabs
function switchToTab(id) {
	for(var i = 0; i < webviews.length; i++) {
		webviews[i].active = false;
		if(webviews[i].id == id) {
			webviews[i].active = true;
		}
	}

	$(document).find('.webview, #tabs .tab').removeClass('active');
	$(document).find('.webview#' + id + ', #tabs .tab#' + id).addClass('active');
}

// how to trigger switch beetween tabs
function goToTab(idorname) {
	var id = ActiveWebview().id;
	switch (idorname) {
		case "previous":
			if($('.tab.active').prev().length) {
				$('.tab.active').prev().trigger('click');
			}
			break;
		case "next":
		if($('.tab.active').next().length) {
			if($('.tab.active').next().attr('id') != 'add-btn') {
				$('.tab.active').next().trigger('click');
			}
		}
		default:
			$('.tab#' + idorname).trigger('click');
			break;
	}
}

// how to move the window to preset positions
function setPosition(name = "") {
	var offsetX, offsetY;

	var width = 440;
	var height = 260;
	var margin = 20;
	
	switch (name) {
		case "topleft":
			offsetX = margin;
			offsetY = margin;
			break;
		case "topright":
			offsetX = screen.width - width - margin;
			offsetY = margin;
			break;
		case "bottomleft":
			offsetX = margin;
			offsetY = screen.height - height - margin;
			break;
		case "bottomright":
			offsetX = screen.width - width - margin;
			offsetY = screen.height - height - margin;
			break;
		default:
			width = 800;
			height = 600;
			offsetX = (screen.width - width) / 2;
			offsetY = (screen.height - height) / 2;
			break;
	}
	remote.getCurrentWindow().setSize(width, height);
	remote.getCurrentWindow().setPosition(offsetX, offsetY);
}

// how to switch beetween useragents
function changeUserAgent(useragent) {
	var u;
	switch(useragent) {
		case "desktop":
			u = desktopuseragent;
			break;
		case "mobile":
			u = mobileuseragent;
			break;
	}
	ActiveWebview().setUserAgent(u);
	$('#reload-btn').trigger('click');
}

// how to open external links in browser
function openInBrowser() {
	var src = ActiveWebview().src;
	open(src);
}

// the settings menu
function openSettings() {
	var homepage = "";
	if(settings.has('newtabhomepage')) { homepage = settings.get('newtabhomepage')}

	var options = "";
	for(var i = 0; i < languages.length; i++) {
		var selected = "";
		if(settings.get('language') == languages[i]) { selected = "selected"}

		options = options + "<option " + selected + ">" + languages[i] + "</option>";
	}
	
	vex.dialog.open({
		message: lang.settings,
		input: [
			'<div class="vex-group">',
				'<label for="newtabpage">' + lang.newtaburl + '</label>',
				'<input type="text" name="newtabpage" id="newtabpage" value="' + homepage + '" placeholder="' + lang.defaulturl + ' : ' + newtabdefaulthomepage + '" />',
			'</div>',
			'<div class="vex-group">',
				'<label for="language">' + lang.language + '</label>',
				'<select id="language" name="language">',
					options,
				'</select>',
				'<div class="note important">' + lang.reboot + '</div>',
			'</div>',
		].join(''),
		callback: function (data) {
			if (data) {
				if(data.newtabpage != undefined) {
					settings.set('newtabhomepage', data.newtabpage.trim());
				} else {
					settings.delete('newtabhomepage');
				}
				if(data.language != undefined) {
					settings.set('language', data.language.trim());
				}
			}
		}
	})
}

$(document).ready(function(){
	//display homepage
	dispPage('http://therolf.fr/topgui/', 1);

	//init languages parameters for TopGUI GUI
	var interval = setInterval(guiInit, 200);
	setTimeout(function(){
		clearInterval(interval);
	}, 2000);

	// modify status bar opacity on hover
	setInterval(sendMessage, 1000/60);

	// get message firm remote if topgui is hovered
	ipcRenderer.on('navHoverMsg', function(event, arg){
		if(arg == 't') {
			$('body').addClass('hover');
		} else {
			$('body').removeClass('hover');
		}
	});


	// minimize window
	$('#min-btn').on('click', function(e) {
		var window = remote.getCurrentWindow();
		window.minimize();
	});
	// close window
	$('#close-btn').on('click', function(e) {
		var tabs = $('#tabs .tab').length;
		if(length <= 1) {
			var window = remote.getCurrentWindow();
			window.close(); 
		} else {
			console.log(length);
			var tab = $('#tabs .tab.active');
			var id = tab.attr('id');

			tab.remove();
			$('.webview#' + id).remove();
		}
	});

	//go back
	$('#undo-btn').on('click', function() {
		ActiveWebview().goBack();
	});

	//go forward
	$('#redo-btn').on('click', function(){
		ActiveWebview().goForward();
	});

	// add tab
	$("#add-btn").on('click', function(){
		addTab();
	})

	// reload tab
	$('#reload-btn').on('click', function(){
		ActiveWebview().reload();
	});

	// move to top right
	$('.pin-btn').on('click', function(){
		setPosition($(this).attr('id'));
	});

	// go to url
	$('#gotourl').on('click', goToUrl);

	// modify useragent
	$('.useragent').on('click', function(){
		var useragent = $(this).attr('id');
		changeUserAgent(useragent);
	});

	// open settings
	$('#opensettings').on('click', openSettings);

	// open in browser
	$('#openinbrowser').on('click', openInBrowser);

	// switch beetween tabs
	$(document).on('click', '.tab', function() {
		var id = $(this).attr('id');
		switchToTab(id);
	});

	$(document).on('contextmenu', '.tab.sortable', function(e) {
		e.preventDefault();
		var id = $(this).attr('id');

		closeTab(id);
	});

	// shortcuts
	$('body').on('keydown', function(e){
		// go back
		if(e.altKey && e.which == 37) {
			ActiveWebview().goBack()
		}

		// go forward
		if(e.altKey && e.which == 39) {
			ActiveWebview().goForward()
		}

		// exit fullscreen
		if(e.which == 27) {
			ActiveWebview().executeJavaScript('document.webkitExitFullscreen()');
		}

		// open dev tools

		// open TopGUI dev tools
		if(e.shiftKey && e.which == 123) {

			remote.getCurrentWindow().toggleDevTools();
		}
		// open webview dev tools (the page dev tools)
		if((!e.shiftKey) && e.which == 123) {
			if(ActiveWebview().isDevToolsOpened()) {
				ActiveWebview().closeDevTools();
			} else {
				ActiveWebview().openDevTools();
			}
		}
		
		// delete tab
		if(e.ctrlKey && e.which == 87) {
			// delete tab
			var id = ActiveWebview().id;
			closeTab(id);
		}

		// add a new tab
		if(e.ctrlKey && e.which ==  84) {
			addTab();
		}

		// refresh tab
		if(e.which == 116) {
			ActiveWebview().reload();
		}

		// switch between tabs
		if(e.ctrlKey && e.which < 58 && e.which > 48) {
			var rank = parseInt(String.fromCharCode(e.which) - 1);
			console.log(rank);
			if(rank < webviews.length) {
				var id = $('#tabs .tab:nth-child(' + (rank+1) + ')').attr('id');
				console.log(id);
				switchToTab(id);
			}
		}

		//switch between sliding tabs
		if(e.ctrlKey && (!e.shiftKey) && e.which == 9) {
			goToTab('next');
		}
		if(e.ctrlKey && e.shiftKey && e.which == 9) {
			goToTab('previous');
		}

		// go to url
		if(e.ctrlKey && e.which == 79) {
			goToUrl();
		}
	});
});