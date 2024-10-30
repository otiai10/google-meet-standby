
// console.log(chrome.runtime.getManifest());
const btnTexts = [
    chrome.i18n.getMessage('btnJoinNow'),
    chrome.i18n.getMessage('btnAskToJoin'),
    chrome.i18n.getMessage('btnSwitchHere'),
];

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    const platform = (new URL(sender.tab?.url || "")).hostname;
    await chrome.alarms.create(`${platform}/${sender.tab?.id}/join`, { when: message.scheduled });
    sendResponse({ scheduled: message.scheduled });
    return true;
});

chrome.alarms.onAlarm.addListener((alarm) => {
    const [/* platform */, tabId, /* action */] = alarm.name.split('/');
    chrome.tabs.update(parseInt(tabId), { active: true });
    chrome.scripting.executeScript({
        target: { tabId: parseInt(tabId) },
        func: (/* p, t, a */) => {
            const [button] = Array.from(document.querySelectorAll('button')).filter(b => btnTexts.includes(b.textContent || ""));
            if (button) button.click();
        }, args: [], // [platform, tabId, action],
    });
});