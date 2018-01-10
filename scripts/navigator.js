const {ipcRenderer} = require('electron');
const remote = require('electron').remote;

const Store = require('electron-store');
const store = new Store();

var counter = 0;

function addContent(store, name, content) {
	var n = '\n';
	if(store.get(name) === '') {
		n = '';
	}
	store.set(name, store.get(name) + n + content); 
}

store.set('beforehistory','');
store.set('afterhistory','');

function sendMessage() {
	ipcRenderer.send('navHoverReq');
}

function dispPage(url) {
	$('.webview, #tabs .tab').removeClass('active');
	$('.webview:last').after('<webview id="' + counter + '" src="' + url + '" class="webview active" preload="./scripts/links.js" class="webview.active" useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36"></webview>');
	$('#add-button').before('<span class="tab" id="' + counter + '" alt="' + url + '"></span>');
	$('.webview:last, #tabs .tab:last').addClass('active');

	var webview = $('.webview:last')[0];
	console.log(webview);
	
	webview.addEventListener('console-message', (e) => {
		if(e.message.startsWith('electron:')) {
			var json = e.message.replace(/electron:(.+)/, '$1');
			json = JSON.parse(json);
			console.log(json);
			switch(json.action) {
				case "blank":
					dispPage(json.url);
					break;
				case "faviconColor":
					changeColor(json.href, json.url);
					break;
				default:
					alert('JSON fail : ' + e.message);
					break;
			}
		}
	});

	counter++;
}

function changeColor(href, url) {
	getColors(href).then(colors => {
		$(document).find('#tabs .tab[alt="' + url + '"]').style.backgroundColor = colors[4].hex();
	});
}

$(document).ready(function(){
	dispPage('./pages/homepage.html');

	var webview = document.getElementsByClassName("webview");
	// modify status bar opacity on hover
	setInterval(sendMessage, 1000/60);
	ipcRenderer.on('navHoverMsg', function(event, arg){
		if(arg == 't') {
			$('body').addClass('hover');
		} else {
			$('body').removeClass('hover');
		}
	});
	$('#min-btn').on('click', function(e) {
		var window = remote.getCurrentWindow();
		window.minimize();
	});
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
	$('#undo-btn').on('click', function() {
		webview.goBack();
	});
	$('#redo-btn').on('click', function(){
		webview.goForward();
	});

	$(document).on('click', '.tab', ()=>{
		var id = $(this).attr('id');
		$('.webview, #tabs .tab').removeClass('active');
		$('.webview#' + id + ', #tabs .tab#' + id).addClass('active');
	});

	$('body').on('keydown', function(e){
		if(e.altKey && e.which == 37) {
			webview.goBack()
		}
		if(e.altKey && e.which == 39) {
			webview.goForward()
		}
		if(e.which == 27) {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			} else if (document.msExitFullscreen) {
				document.msExitFullscreen();
			} else if(document.webkitExitFullscreen) {
				document.webkitExitFullscreen();
			}
		}
	});
});