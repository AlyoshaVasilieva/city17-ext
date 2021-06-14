"use strict";

import BlockingResponse = chrome.webRequest.BlockingResponse;
import WebRequestBodyDetails = chrome.webRequest.WebRequestBodyDetails;

chrome.webRequest.onBeforeRequest.addListener(
    redirectM3U,
    {urls: ["https://usher.ttvnw.net/api/channel/hls/*", "https://usher.ttvnw.net/vod/*"]},
    ["blocking"]
);

chrome.webRequest.onBeforeRequest.addListener(
    blockAdServer,
    {urls: ["https://*.amazon-adsystem.com/*"]},
    ["blocking"]
);

/** Log the request's URL and tell Chrome to block it. */
function blockAdServer(details: WebRequestBodyDetails): BlockingResponse | void {
    // This function should only be hit on VODs, since streams won't be serving ads.
    // VODs continue to serve ads without this function.
    // TODO: Use `if (window.location.toString().startsWith("https://www.twitch.tv/videos/"))` if this triggers
    //  anti-adblock code for livestreams.
    console.log(`blocking request to ad-related server: ${details.url}`)
    return {
        cancel: true
    };
}

/** Attempt to grab the M3U8 from the relay function, triggering a redirect to a data URL if successful. */
function redirectM3U(details: WebRequestBodyDetails): BlockingResponse | void {
    const base = "FUNCTION_URL_BASE";
    const source = /\/(hls|vod)\/(.+)\.m3u8/.exec(details.url);
    if (source === null) {
        console.log(`unmatched URL, source ${details.url}`);
        return;
    }

    const type = source[1];
    const endpoint = type === "hls" ? "/live/" : "/vod/";
    const id = source[2];
    const req = new XMLHttpRequest();
    // req.timeout = 11000; // only available for async requests
    // A misconfigured Azure function will, by default, hang for 5 minutes instead of giving an error.
    // But async isn't allowed in Chrome. Set timeout on Azure side to something lower.
    // Aliyun has a default 60s timeout, it shouldn't need more than ~15s worst case. (Max I've seen is ~10s)
    const url = `${base}${endpoint}${id}`;
    console.log(`calling ${url}`);
    // Ignore the deprecation warning, there is no replacement.
    req.open("GET", url, false);
    req.send();
    if (req.status !== 200 || !req.response.startsWith("#EXTM3U")) {
        // the #EXTM3U check is paranoid, but avoids an outright failure on weirdness
        console.log(`grabbing m3u8 failed, code ${req.status}, response: ${req.response}`);
        logError(type, req);
        return;
    }

    const m3u8 = stringToBase64(req.response);
    console.log(`redirecting ${type} ${id}`);
    return {
        redirectUrl: `data:application/vnd.apple.mpegurl;base64,${m3u8}`
    }
}

/** Log an error with a (hopefully) detailed message, both to the console and a toast notification. */
function logError(type: string, req: XMLHttpRequest) {
    let message = "Proxy error, no further info, you will see ads.";
    try {
        // the response *should* be a JSON object, either Aliyun's or mine
        // but still test just in case something went really wrong
        const json = JSON.parse(req.response);
        if ("errorMessage" in json) {
            message = `Proxy error, you will see ads. Backend reports "${json.errorMessage}".`;
        } else if ("debug" in json && "stage" in json) {
            if (req.status === 404 && type === "hls" && json.stage === "M3U") {
                // When loading a streamer's page (even sometimes the /videos page?) Twitch seems to attempt to
                // load the live stream, then display the most recent VOD if that fails.
                // We don't care that it 404'd, that's expected behavior.
                sendError({
                    maybeFake: true,
                    message: "Failed to load livestream (404). If you aren't trying to watch a livestream, ignore this."
                });
                return;
            }
            message = `Proxy error, you will see ads. Stage ${json.stage}, debug info ${json.debug}.`;
        }
    } catch (e) {
        // handled with default text.
    }
    sendError({maybeFake: false, message: message});
}

export interface ExtError {
    /** Marks whether this error might be fake; that is, an error a user will never be impacted by. */
    maybeFake: boolean,
    message: string,
}

/** Send an error to the content script for display. */
function sendError(err: ExtError) {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        if (tabs.length === 0 || typeof tabs[0].id === "undefined") {
            return;
        }
        chrome.tabs.sendMessage(tabs[0].id, err);
    });
}

/** Converts a string to a base64 string. Safe for use with Unicode input, unlike {@link btoa}.
 *  The M3U8 doesn't *currently* use any non-ASCII text, but I'd rather not make it so easy for Twitch. */
function stringToBase64(input: string): string {
    const enc = new TextEncoder();
    const array = enc.encode(input);
    return arrayToBase64(array);
}

/** Convert a Uint8Array to a Base64 string.
 *
 * Taken from https://github.com/WebReflection/uint8-to-base64 and lightly modified.
 *
 * ISC License
 *
 * Copyright (c) 2020, Andrea Giammarchi, @WebReflection
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE
 * OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 * PERFORMANCE OF THIS SOFTWARE. */
function arrayToBase64(array: Uint8Array): string {
    const output: string[] = [];
    for (let i = 0; i < array.length; i++) {
        output.push(String.fromCharCode(array[i]));
    }
    return btoa(output.join(""));
}
