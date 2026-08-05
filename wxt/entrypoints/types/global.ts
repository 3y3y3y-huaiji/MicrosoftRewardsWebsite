declare global {
    interface Window {
        _marContentScriptInjected?: boolean;
        _marFirstResultClicked?: boolean;
        _marVisualSearchDone?: boolean;
    }
}
export {};
