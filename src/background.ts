
// console.log(chrome.runtime.getManifest());

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    const platform = (new URL(sender.tab?.url || "")).hostname;
    await chrome.alarms.create(`${platform}/${sender.tab?.id}/join`, { when: message.scheduled });
    sendResponse({ scheduled: message.scheduled });
    return true;
});

chrome.alarms.onAlarm.addListener((alarm) => {
    const [platform, tabId, action] = alarm.name.split('/');
    chrome.scripting.executeScript({
        target: { tabId: parseInt(tabId) },
        func: (p, t, a) => {
            window.alert([p, t, a].join('\n'));
        }, args: [platform, tabId, action],
    });
});