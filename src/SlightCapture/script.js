function sleepAsync(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const cachedScripts = [];
const loadingScripts = [];

export const loadScripts = (sources) => {
    const promises = sources.map(loadScriptAsync);
    return Promise.all(promises);
}

export const loadScriptAsync = (src) => {
    // If cachedScripts array already includes src that means another instance ...
    // ... of this hook already loaded this script, so no need to load again.
    if (loadingScripts.includes(src)) {
        const promise = sleepAsync(50);
        return promise.then(() => loadScriptAsync(src));
    }
    if (cachedScripts.includes(src)) {
        return new Promise(resolve => resolve());
    }
    loadingScripts.push(src);
    // Create script
    const script = document.createElement('script');
    script.src = src;
    script.async = true;

    const removeLoadingScript = () => {
        // Remove from cachedScripts we can try loading again
        const index = loadingScripts.indexOf(src);
        if (index >= 0) loadingScripts.splice(index, 1);
    };

    return new Promise((resolve, error) => {
        // Script event listener callbacks for load and error
        const onScriptLoad = () => {
            cachedScripts.push(src);
            removeLoadingScript();
            resolve();
        };

        const onScriptError = () => {
            script.remove();
            removeLoadingScript();
            error();
        };

        script.addEventListener('load', onScriptLoad);
        script.addEventListener('error', onScriptError);

        // Add script to document body
        document.body.appendChild(script);
    });
};


