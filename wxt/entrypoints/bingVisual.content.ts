import { defineContentScript } from '#imports';
import { getRndInteger, wait } from '@/entrypoints/utils/helpers';
import { oncePerPageRun } from '@/entrypoints/utils/oncePerPageRun';

// Stable public images (Wikimedia Commons). A random one is picked each day so
// the visual search isn't the identical request every time.
const VISUAL_SEARCH_IMAGES = [
    'https://upload.wikimedia.org/wikipedia/commons/3/3f/JPEG_example_flower.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/9/9a/Gull_portrait_ca_usa.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/a/a3/Eq_it-na_pizza-margherita_sep2005_sml.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/b/b6/Felis_catus-cat_on_snow.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/e/e0/Cup_of_coffee_with_milk.jpg',
];

const SBI_BUTTON = '#sb_sbi';       // "Search using an image" flyout toggle
const PASTE_INPUT = '#sb_imgpst';   // "paste image link to search" box
const MAX_WAIT_MS = 8000;

// Only runs on image tabs the extension opened (marVisual marker); manual
// visits to bing.com/images are left untouched.
export default defineContentScript({
    matches: ['https://www.bing.com/images*'],
    async main() {
        if (!new URLSearchParams(location.search).has('marVisual')) return;
        if (!oncePerPageRun('_marVisualSearchDone')) return;
        await runVisualSearch();
    },
});

async function runVisualSearch(): Promise<void> {
    // Open the "search using an image" flyout, then wait for its paste box.
    document.querySelector<HTMLElement>(SBI_BUTTON)?.click();
    const box = await waitForElement<HTMLInputElement>(PASTE_INPUT);
    if (!box) return;

    const image = VISUAL_SEARCH_IMAGES[getRndInteger(0, VISUAL_SEARCH_IMAGES.length - 1)];
    await wait(400 + getRndInteger(0, 600));
    box.value = image;
    box.dispatchEvent(new Event('input', { bubbles: true }));
    await wait(300 + getRndInteger(0, 400));
    // requestSubmit performs a real form submission (unlike a synthetic Enter),
    // which triggers Bing's visual search and credits the daily activity.
    box.closest('form')?.requestSubmit();
}

// Resolve once the selector appears (the flyout renders async), bounded so it
// never hangs if the markup changed.
function waitForElement<T extends Element>(selector: string): Promise<T | null> {
    return new Promise((resolve) => {
        const existing = document.querySelector<T>(selector);
        if (existing) {
            resolve(existing);
            return;
        }
        const observer = new MutationObserver(() => {
            const found = document.querySelector<T>(selector);
            if (found) {
                observer.disconnect();
                clearTimeout(timer);
                resolve(found);
            }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
        const timer = setTimeout(() => {
            observer.disconnect();
            resolve(null);
        }, MAX_WAIT_MS);
    });
}
