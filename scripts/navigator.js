const {ipcRenderer} = require('electron');
const {session} = require('electron').remote;
const remote = require('electron').remote;
const settings = require('electron-settings');
const urlExists = require('url-exists');
const loadJsonFile = require('load-json-file');
const isDev = require('electron-is-dev');
const open = require('open');
let screen = remote.screen.getPrimaryDisplay().bounds;

let desktopuseragent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) UR/55.1.2883.71 Chrome/60.0.3112.101 Safari/-703607808.-361452744";
let mobileuseragent = "Mozilla/5.0 (Linux; Android 8.0; Pixel XL Build/LMY48B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/43.0.2357.65 Mobile Safari/537.36";

if(isDev)
	session.fromPartition('', { cache: false });

const newtabdefaulthomepage = "https://www.google.com";

// languages support
let lang = "";
let languages = "";
loadJsonFile('resources/languages.json').then(json => {
	if(!settings.has('language')) {
		settings.set('language', 'EN');
	}
	lang = json[settings.get('language')];
	languages = Object.keys(json);
});

//defining vex js theme
vex.defaultOptions.className = 'vex-theme-plain';

const urlToFaviconURL = url => { return `https://api.faviconkit.com/${url}/32` }

let v;

$(document).ready(function() {
	// switch beetween tabs
	$(document).on('click', '.tab', function() {
		let id = $(this).attr('id');
		v.switchToTab(id);
	});

	$(document).on('contextmenu', '.tab.sortable', function(e) {
		e.preventDefault();
		let id = $(this).attr('id');

		v.closeTab(id);
	});

	// shortcuts
	$('body').on('keydown', function(e){
		// go back
		if(e.altKey && e.which == 37) {
			v.activeWebview.goBack()
		}

		// go forward
		if(e.altKey && e.which == 39) {
			v.activeWebview.goForward()
		}

		// exit fullscreen
		if(e.which == 27) {
			v.activeWebview.executeJavaScript('document.webkitExitFullscreen()');
		}

		// open dev tools

		// open TopGUI dev tools
		if(e.shiftKey && e.which == 123) {
			remote.getCurrentWindow().toggleDevTools();
		}
		// open webview dev tools (the page dev tools)
		if((!e.shiftKey) && e.which == 123) {
			if(v.activeWebview.isDevToolsOpened()) {
				v.activeWebview.closeDevTools();
			} else {
				v.activeWebview.openDevTools();
			}
		}
		
		// delete tab
		if(e.ctrlKey && e.which == 87) {
			// delete tab
			let id = v.activeWebview.id;
			v.closeTab(id);
		}

		// add a new tab
		if(e.ctrlKey && e.which ==  84) {
			v.addTab();
		}

		// refresh tab
		if(e.which == 116) {
			v.activeWebview.reload();
		}

		// switch between tabs
		if(e.ctrlKey && e.which < 58 && e.which > 48) {
			let rank = parseInt(String.fromCharCode(e.which) - 1);
			if(rank < v.webviews.length) {
				let id = $('#tabs .tab:nth-child(' + (rank+1) + ')').attr('id');
				v.switchToTab(id);
			}
		}

		//switch between sliding tabs
		if(e.ctrlKey && (!e.shiftKey) && e.which == 9) {
			v.goToTab('next');
		}
		if(e.ctrlKey && e.shiftKey && e.which == 9) {
			v.goToTab('previous');
		}

		// go to url
		if(e.ctrlKey && e.which == 79) {
			v.goToUrl();
		}
	});
});

document.addEventListener('DOMContentLoaded', function (){
	v = new Vue({
		el: '#navigator',
		data: {
			counter: 0,
			webviews:  []
		},
		computed: {
			activeWebview: function() {
				let result = null;

				let i = 0;
				while(i < this.webviews.length && !result) {
					if(this.webviews[i].active == true) {
						return this.webviews[i].webview;
					}

					++i;
				}
				
				return result;
			}
		},
		methods: {
			addView: function (props, homepage = false) {
				let newprops = Object.assign({
					closable: true,
					movable: true,
					styles: {},
					imgsrc: urlToFaviconURL(new URL(props.url).host)
				}, props)
				this.webviews.push(newprops)

				this.dispPage(props.url, homepage)
			},
			addTab: function () {
				if(settings.has('newtabhomepage')) {
					if(settings.get('newtabhomepage') !== '') {
						this.dispPage(settings.get('newtabhomepage'));
					} else {
						this.dispPage(newtabdefaulthomepage);
					}
				} else {
					this.dispPage(newtabdefaulthomepage);
				}
			},
			changeUserAgent: function(useragent) {
				let u;
				switch(useragent) {
					case "desktop":
						u = desktopuseragent;
						break;
					case "mobile":
						u = mobileuseragent;
						break;
				}
				
				if(this.activeWebview) {
					this.activeWebview.setUserAgent(u);
					this.activeWebview.reload();
				}
			},
			closeTab: function(id) {
				let that = this;
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
								for(let i = 0; i < that.webviews.length; i++) {
									if(that.webviews[i].id == id) {
										that.webviews.splice(i, 1);
			
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
			},
			currentTabReload: function() {
				console.log(this.activeWebview);
				this.activeWebview.reload();
			},
			currentTabGoBack: function() {
				this.activeWebview.goBack();
			},
			currentTabGoForward: function() {
				this.activeWebview.goForward()
			},
			dispPage: function(url, homepage = false) {
				$('.webview, #tabs .tab').removeClass('active');
				let w = $('<webview id="' + this.counter + '" src="' + url + '" class="webview active" preload="./scripts/interface.js" class="webview.active" useragent="' + mobileuseragent + '"></webview>').appendTo("#content")[0];
				if(!homepage) {
					$('#add-btn').before('<span class="tab sortable" id="' + this.counter + '" alt="' + url + '"></span>');
				}
				$('.webview:last, #tabs .tab:last').addClass('active');
				
				let c = this.counter;
			
				w.addEventListener('console-message', (e) => {
					if(e.message.startsWith('electron:')) {
						let json = e.message.replace(/electron:(.+)/, '$1');
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
										this.dispPage(json.url);
										break;
									case "Pageinfo":
										this.modifyInfo(json.url, json.favicon, json.themeColor, c);
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
			
				let obj = {
					id: this.counter,
					active: true,
					webview: w
				}
				
				this.webviews.push(obj);
			
				for(let i = 0; i < this.webviews.length; i++) {
					if(this.webviews[i].id != this.counter) {
						this.webviews[i].active = false;
					}
				}
			
				this.counter++;
			},
			goToUrl: function() {
				const that = this;

				let id = this.activeWebview.id;
				let yestext = lang.opennewtab;
				let inhomepage = false;
				if(!parseInt(id)) { inhomepage = true; }
				if(!inhomepage) { yestext = lang.go; }
			
				let value = "";
				if(!inhomepage) { value = this.activeWebview.src }
			
				vex.dialog.open({
					message: lang.gotourl + ' :',
					input: '<input name="url" type="text" placeholder="URL" required value="' + value + '" />',
					buttons: [
						$.extend({}, vex.dialog.buttons.YES, { text: yestext }),
						$.extend({}, vex.dialog.buttons.NO, { text: lang.cancel })
					],
					callback: function (data) {
						if (data) {
							let url = data.url;
							if(!/^https?:\/\//i.test(url)) {
								url = 'http://' + url;
							}
							urlExists(url, function(err, exists) {
								if(exists) {
									if(parseInt(id)) {
										that.activeWebview.loadURL(url);
									} else {
										that.dispPage(url);
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
			},
			goToTab: function(idorname) {
				let id = this.activeWebview.id;
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
			},
			guiInit: function() {
				$('#gotourl')[0].textContent = lang.gotourl;
				$('#openinbrowser')[0].textContent = lang.openinbrowser;
			},
			openInBrowser: function() {
				if(this.activeWebview) {
					let src = this.activeWebview.src;
					open(src);
				}
			},
			openSettings: function() {
				let homepage = "";
				if(settings.has('newtabhomepage')) { homepage = settings.get('newtabhomepage')}
			
				let options = "";
				for(let i = 0; i < languages.length; i++) {
					let selected = "";
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
			},
			modifyInfo: function(url, favicon, themeColor, c) {
				if(c != 0) {
					// show favicon on tab
					if(favicon !== "") {
						let faviconurl = favicon;
						if(!favicon.indexOf("http") == 0) {
							faviconurl = url + favicon;
						}
						$(document).find('#tabs .tab#' + c).html('<img src="' + faviconurl + '" alt=" " />');
					} else {
						if(url !== "") {
							$(document).find('#tabs .tab#' + c).html('<img src="' + urlToFaviconURL(new URL(url).host) + '" alt=" " />');
						}
					}
				
					// set themeColor as background color or reset it
					$(document).find('#tabs .tab#' + c).css("background-color", themeColor);
				}
			},
			navigatorClose: function() {
				console.log('nyaaaa')
				let tabs = $('#tabs .tab').length;
				if(length <= 1) {
					let window = remote.getCurrentWindow();
					window.close(); 
				} else {
					console.log(length);
					let tab = $('#tabs .tab.active');
					let id = tab.attr('id');

					tab.remove();
					$('.webview#' + id).remove();
				}
			},
			navigatorMinimize: function() {
				let window = remote.getCurrentWindow();
				window.minimize();
			},
			sendMessage: function() {
				ipcRenderer.send('navHoverReq');
			},
			setPosition: function(name = "") {
				let offsetX, offsetY;
			
				let width = 440;
				let height = 260;
				let margin = 20;
				
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
			},
			switchToTab: function(id) {
				for(let i = 0; i < this.webviews.length; i++) {
					this.webviews[i].active = false;
					if(this.webviews[i].id == id) {
						this.webviews[i].active = true;
					}
				}
			
				$(document).find('.webview, #tabs .tab').removeClass('active');
				$(document).find('.webview#' + id + ', #tabs .tab#' + id).addClass('active');
			}		
		},
		created: function () {
			//init languages parameters for TopGUI GUI
			let interval = setInterval(this.guiInit, 200);
			setTimeout(function(){
				clearInterval(interval);
			}, 2000);

			// modify status bar opacity on hover
			setInterval(this.sendMessage, 1000/30);

			// get message firm remote if topgui is hovered
			let lastArg = undefined;
			ipcRenderer.on('navHoverMsg', function(event, arg){
				if(arg != lastArg) {
					if(arg == 't') {
						$('body').addClass('hover');
					} else {
						$('body').removeClass('hover');
					}
		
					lastArg = arg;
				}
			});
		},
		mounted: function() {
			// add default view

			this.addView({
				url: 'https://therolf.fr/topgui/',
				closable: false,
				movable: false
			}, true)
		}
	})
});