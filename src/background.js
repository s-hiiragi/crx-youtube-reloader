"use strict";
// YouTubeを開いたときにタイマーを登録し、
// キリのいい時刻(0,1,2分)になったらページをリロードする

class SessionSetting {
	static _getValue(name) {
		return JSON.parse(sessionStorage.getItem(name));
	}
	static _setValue(name, value) {
		sessionStorage.setItem(name, JSON.stringify(value));
	}

	static get timeoutId() { return this._getValue('timeoutId'); }
	static set timeoutId(value) { this._setValue('timeoutId', value); }

	static get registeredTabId() { return this._getValue('registeredTabId'); }
	static set registeredTabId(value) { this._setValue('registeredTabId', value); } 
}

class Timer {
	static set(callback) {
		const min = new Date().getMinutes();
		const delay_ms = min <= 2 ? 60*1000 : (60-min)*60*1000 + 1;

		const timeoutId = setTimeout(callback, delay_ms);
		console.log('  setTimeout:', timeoutId, `${delay_ms} ms (${Math.round(delay_ms/1000/60)} min)`);
		return timeoutId;
	}
	static clear(timeoutId) {
		clearTimeout(timeoutId);
		console.log('  clearTimeout:', timeoutId);
	}
}

class PageAction {
	static setOn(tabId, callback=null, onerror=null) {
		const iconDetails = {
			tabId: tabId,
			path: {'32': 'icon/reload_on_icon32.png'}
		};
		chrome.pageAction.setIcon(iconDetails, ()=>{
			if (chrome.runtime.lastError) {
				if (onerror) {
					onerror(chrome.runtime.lastError.message);
				} else {
					console.error('PageAction.setOn/chrome.pageAction.setIcon',
						chrome.runtime.lastError);
				}
				return;
			}
			chrome.pageAction.setTitle({tabId: tabId, title: 'YouTube Reloader (ON)'}, ()=>{
				if (chrome.runtime.lastError) {
					if (onerror) {
						onerror(chrome.runtime.lastError.message);
					} else {
						console.error('PageAction.setOn/chrome.pageAction.setTitle',
							chrome.runtime.lastError);
					}
					return;
				}
				chrome.pageAction.show(tabId, ()=>{
					if (chrome.runtime.lastError) {
						if (onerror) {
							onerror(chrome.runtime.lastError.message);
						} else {
							console.error('PageAction.setOn/chrome.pageAction.show',
								chrome.runtime.lastError);
						}
						return;
					}
					if (callback) callback();
				});
			});
		});
	}
	static setOff(tabId, callback=null, onerror=null) {
		const iconDetails = {
			tabId: tabId,
			path: {'32': 'icon/reload_off_icon32.png'}
		};
		chrome.pageAction.setIcon(iconDetails, ()=>{
			if (chrome.runtime.lastError) {
				if (onerror) {
					onerror(chrome.runtime.lastError.message);
				} else {
					console.error('PageAction.setOff/chrome.pageAction.setIcon',
						chrome.runtime.lastError);
				}
				return;
			}
			chrome.pageAction.setTitle({tabId: tabId, title: 'YouTube Reloader (OFF)'}, ()=>{
				if (chrome.runtime.lastError) {
					if (onerror) {
						onerror(chrome.runtime.lastError.message);
					} else {
						console.error('PageAction.setOff/chrome.pageAction.setTitle',
							chrome.runtime.lastError);
					}
					return;
				}
				chrome.pageAction.show(tabId, ()=>{
					if (chrome.runtime.lastError) {
						if (onerror) {
							onerror(chrome.runtime.lastError.message);
						} else {
							console.error('PageAction.setOff/chrome.pageAction.show',
								chrome.runtime.lastError);
						}
						return;
					}
					if (callback) callback();
				});
			});
		});
	}
}


class App {
	static setTimer(tabId) {
		const registeredTabId = SessionSetting.registeredTabId;

		if (registeredTabId !== null) {
			Timer.clear(SessionSetting.timeoutId);
			PageAction.setOff(registeredTabId, null, (msg)=>{
				console.log('  App.setTimer/PageAction.setOff', msg);
			});
		}

		const timeoutId = Timer.set(()=>{ onTimeout(tabId); });
		PageAction.setOn(tabId);

		SessionSetting.registeredTabId = tabId;
		SessionSetting.timeoutId = timeoutId;
	}
	static clearTimer(tabId) {
		const registeredTabId = SessionSetting.registeredTabId;

		if (registeredTabId === tabId) {
			Timer.clear(SessionSetting.timeoutId);
			PageAction.setOff(registeredTabId);

			SessionSetting.registeredTabId = null;
			SessionSetting.timeoutId = null;
		}
	}
	static reloadTab(tabId) {
		chrome.tabs.executeScript(tabId, {code: 'location.reload();'}, ()=>{
			if (chrome.runtime.lastError) {
				console.log('  reloadTab/chrome.tabs.executeScript',
					chrome.runtime.lastError.message);
				return;
			}
		});
	}
}


chrome.tabs.onCreated.addListener((tab) => {
	if (!tab.url) return;
	if (new URL(tab.url).hostname !== 'www.youtube.com') return;

	console.log('onCreated', tab.id, tab.url);
	App.setTimer(tab.id);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (changeInfo.status !== 'complete') return;
	if (new URL(tab.url).hostname !== 'www.youtube.com') return;

	console.log('onUpdated', tab.id, tab.url);
	App.setTimer(tab.id);
});

function onTimeout(tabId) {
	console.log('onTimeout', tabId);
	App.reloadTab(tabId);
}

chrome.pageAction.onClicked.addListener((tab) => {
	console.log('pageAction.onClicked', tab.id);
	chrome.pageAction.getTitle({tabId: tab.id}, (title)=>{
		if (title === 'OFF') {
			App.setTimer(tab.id);
		} else {
			App.clearTimer(tab.id);
		}
	});	
});
