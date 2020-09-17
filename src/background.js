// YouTubeを開いたときにタイマーを登録し、
// キリのいい時刻(0,1,2分)になったらページをリロードする

chrome.tabs.onCreated.addListener((tab) => {
	if (!tab.url) {
		return;
	}
	if (new URL(tab.url).hostname !== 'www.youtube.com') {
		return;
	}
	console.log('onCreated', tab.url);
	registerTimer(tab.id);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (changeInfo.status !== 'complete') {
		return;
	}
	if (new URL(tab.url).hostname !== 'www.youtube.com') {
		return;
	}
	console.log('onUpdated', tab.url);
	registerTimer(tab.id);
});

function registerTimer(tabId) {
	console.log('registerTimer:', tabId);

	const oldTimeoutId = JSON.parse(sessionStorage.getItem('timeoutId'));
	if (oldTimeoutId !== null) {
		console.log('  clearTimeout:', oldTimeoutId);
		clearTimeout(oldTimeoutId);
	}

	function reload(tabId) {
		console.log('reload:', tabId);
		const details = {
			code: 'location.reload();'
		};
		chrome.tabs.executeScript(tabId, details, ()=>{
		    console.log('executeScript.callback:');
		});
	}

	// 次の0分 or 30分までのdelayを計算
	//const delay_ms = (30 - new Date().getMinutes()%30)*60*1000 + 1;
	// 次の0分までのdelayを計算
	// 0～2分の間は1分おきにリロードする
	const min = new Date().getMinutes();
	const delay_ms = min <= 2 ? 60*1000 : (60-min)*60*1000 + 1;
	const timeoutId = setTimeout(()=>{ reload(tabId); }, delay_ms);
	console.log('  setTimeout:', delay_ms, 'ms', delay_ms/1000/60, 'min');
	console.log('    timeoutId', timeoutId);

	sessionStorage.setItem('timeoutId', timeoutId);
}
