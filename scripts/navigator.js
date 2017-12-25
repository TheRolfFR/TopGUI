const {ipcRenderer} = require('electron');
const remote = require('electron').remote;

const Store = require('electron-store');
const store = new Store();

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
	if(url == 'aot://home') {
		$('#content').load('pages/homepage.html');
	} else {
		$('#content').load(url);
	}
	$('#content').attr('alt', url);
}

$(document).ready(function(){
	var webview = document.getElementById("foo");
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
		var window = remote.getCurrentWindow();
		window.close(); 
	});
	$('#undo-btn').on('click', function() {
		webview.goBack();
	});
	$('#redo-btn').on('click', function(){
		webview.goForward();
	});

	page = $('#content').attr('alt');
	dispPage(page);

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