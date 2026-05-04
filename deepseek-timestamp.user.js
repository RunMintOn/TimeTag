// ==UserScript==
// @name         DeepSeek 时间戳自动追加
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  发送消息时自动在末尾追加当前时间戳（ISO 格式）
// @author       You
// @match        https://chat.deepseek.com/*
// @icon         https://chat.deepseek.com/favicon.ico
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    function getTimestamp() {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    }

    // 拦截 XHR，在 /api/v0/chat/completion 请求的 prompt 末尾追加时间戳
    const OrigXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function () {
        const xhr = new OrigXHR();
        const origOpen = xhr.open;
        const origSend = xhr.send;

        xhr.open = function (method, url, ...rest) {
            this._ts_url = url;
            this._ts_method = method;
            return origOpen.apply(this, [method, url, ...rest]);
        };

        xhr.send = function (body) {
            if (
                this._ts_method === 'POST' &&
                typeof this._ts_url === 'string' &&
                this._ts_url.includes('/api/v0/chat/completion') &&
                body &&
                typeof body === 'string'
            ) {
                try {
                    const data = JSON.parse(body);
                    if (data.prompt && typeof data.prompt === 'string' && data.prompt.trim() !== '') {
                        const ts = getTimestamp();
                        data.prompt = data.prompt + '\n' + ts;
                        body = JSON.stringify(data);
                    }
                } catch (e) {
                    // parse 失败，原样发送
                }
            }
            return origSend.apply(this, [body]);
        };

        return xhr;
    };
    window.XMLHttpRequest.prototype = OrigXHR.prototype;

})();
