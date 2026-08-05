import { browser } from 'wxt/browser';
import { getRndInteger } from '@/entrypoints/utils/helpers';

// The marVisual marker tells the bing-visual content script this tab was opened
// by the extension, so it should drive a visual search.
const VISUAL_SEARCH_URL = 'https://www.bing.com/images?marVisual=1';
// Leave the tab open long enough for the search to run and Bing to credit the
// activity before closing it.
const CLOSE_AFTER_MS = 15000;

// Opens a focused image tab whose content script performs one Bing visual
// search, then closes it. Called at most once per day. Focus is required:
// background tabs get their timers throttled and the visual search didn't
// credit reliably there.
export async function runVisualSearch(): Promise<void> {
    const tab = await browser.tabs.create({ url: VISUAL_SEARCH_URL, active: true });
    const tabId = tab.id;
    if (tabId === undefined) return;
    setTimeout(() => {
        browser.tabs.get(tabId).then(() => browser.tabs.remove(tabId)).catch(() => {});
    }, CLOSE_AFTER_MS + getRndInteger(0, 2000));
}
