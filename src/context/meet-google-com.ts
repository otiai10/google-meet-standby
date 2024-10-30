
(async () => {
    const MAX_RETRIES = 1200;
    const RETRY_INTERVAL_MS = 100;
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const indicator = document.createElement('div');

    const timeinput = document.createElement('input');
    timeinput.type = 'time';
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 10) * 10;
    now.setMinutes(roundedMinutes);
    timeinput.value = now.toTimeString().substring(0, 5);

    const joinbutton = document.createElement('button');
    joinbutton.innerText = 'Join on time';
    joinbutton.onclick = async () => {
        const value = timeinput.value;
        const [h, m] = value.split(':');
        const scheduled = new Date();
        scheduled.setHours(parseInt(h));
        scheduled.setMinutes(parseInt(m));
        scheduled.setSeconds(0);
        scheduled.setMilliseconds(0);
        await chrome.runtime.sendMessage(chrome.runtime.id, { action: 'schedule', scheduled: scheduled.getTime() });
        timeinput.remove();
        joinbutton.remove();
        indicator.classList.add('scheduled');
        indicator.innerText = `Scheduled to join at ${value}\nYou can leave, but keep this page open`;
        container.style.border = "none";
    };

    const container = document.createElement('div');
    container.id = 'join-on-time-container';

    container.appendChild(indicator);
    container.appendChild(timeinput);
    container.appendChild(joinbutton);

    let count = 0;
    const retry = setInterval(async () => {
        count++;
        const ok = await render(container);
        if (ok != null && ok.offsetWidth > 0) {
            clearInterval(retry);
        }
        if (count > MAX_RETRIES) {
            clearInterval(retry);
        }
    }, 1000);

    const render = async (c: HTMLDivElement): Promise<HTMLDivElement | null> => {
        const sibling = await waitUntilElementFound<HTMLButtonElement>('button', button => {
            if (button.textContent == "Ask to join") return true;
            if (button.textContent == "Join now") return true;
            if (button.textContent == "Switch here") return true;
            return false;
        });
        const parent = sibling?.parentElement;
        if (!sibling || !parent) return null;
        // Insert this container next to sibling
        // parent.insertBefore(c, sibling);
        parent.appendChild(c);
        // document.body.appendChild(container);
        await sleep(1000);
        return document.querySelector<HTMLDivElement>('#join-on-time-container');
    }

    const waitUntilElementFound = async <T extends HTMLElement>(selector: string, filter: (e: T) => boolean): Promise<T | null> => {
        let count = 0;
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                count++;
                const found = Array.from(document.querySelectorAll<T>(selector)).filter(filter);
                if (found) { clearInterval(interval); resolve(found[0]); }
                if (count > MAX_RETRIES) { clearInterval(interval); resolve(null); }
            }, RETRY_INTERVAL_MS);
        });
    };

    // When the users stay idle for a while, keep the page stand-by
    // See https://github.com/otiai10/google-meet-standby/issues/1
    const observer = new MutationObserver(async (mutationsList) => {
        const mut = mutationsList.find(m => m.target.nodeName === 'DIV');
        const btns = mut ? (mut.target as Element).querySelectorAll('button') : [];
        Array.from(btns).find(b => b.textContent == "Keep waiting")?.click();
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: false });

})();