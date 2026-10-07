"use strict";
(function() {
    // The EPK is fetched from the same CDN directory as this loader.
    // This means the package works unchanged on GitHub + jsDelivr, Cloudflare,
    // or another static CDN, without hard-coding a domain.
    var script = document.currentScript;
    var epkURL = new URL("assets.epk", script && script.src ? script.src : window.location.href).href;

    window.eaglercraftXOpts.assetsURI = [
        {
            url: epkURL,
            path: "assets/minecraft/lang/"
        }
    ];

    var launchInterval = -1;
    var launchCounter = 1;
    var launchCountdownNumberElement = null;
    var launchCountdownProgressElement = null;

    function launchTick() {
        launchCountdownNumberElement.innerText = "" + Math.floor(6.0 - launchCounter * 0.06);
        launchCountdownProgressElement.style.width = "" + launchCounter + "%";
        if(++launchCounter > 100) {
            clearInterval(launchInterval);
            setTimeout(function() {
                document.getElementById("launch_countdown_screen").remove();
                main();
            }, 50);
        }
    }

    window.addEventListener("load", function() {
        launchCountdownNumberElement = document.getElementById("launchCountdownNumber");
        launchCountdownProgressElement = document.getElementById("launchCountdownProgress");
        launchInterval = setInterval(launchTick, 50);
    });
})();
