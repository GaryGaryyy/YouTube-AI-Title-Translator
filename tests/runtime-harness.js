const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { buildPublicConfig } = require('../shared.js');
const source = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));

class Element {
    constructor(tag = 'div') {
        this.tagName = tag.toUpperCase(); this.dataset = {}; this.attrs = {}; this.children = [];
        this.listeners = {}; this.style = {}; this.isConnected = true; this.textContent = ''; this.clicks = 0;
        const classes = new Set();
        this.classList = { add: (...xs) => xs.forEach(x => classes.add(x)), remove: (...xs) => xs.forEach(x => classes.delete(x)), contains: x => classes.has(x) };
    }
    setAttribute(k, v) { this.attrs[k] = String(v); }
    getAttribute(k) { return this.attrs[k] ?? null; }
    hasAttribute(k) { return Object.hasOwn(this.attrs, k); }
    removeAttribute(k) { delete this.attrs[k]; }
    get nextSibling() { return this.parentElement?.children[this.parentElement.children.indexOf(this) + 1] || null; }
    appendChild(child) { this.children.push(child); child.parentElement = this; }
    insertBefore(child, next) {
        if (next === null) this.appendChild(child);
        else { this.children.splice(this.children.indexOf(next), 0, child); child.parentElement = this; }
    }
    remove() { this.isConnected = false; if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(x => x !== this); }
    closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector) || null; }
    matches(selector) {
        return selector.split(',').some(part => {
            const tokens = part.trim().split(/\s+/);
            if (this.main && part.trim() === 'ytd-watch-metadata h1 yt-formatted-string') return true;
            const token = tokens.pop();
            const [tag] = token.split(/[.#]/);
            if (tag && tag.toUpperCase() !== this.tagName) return false;
            for (const [, prefix, name] of token.matchAll(/([.#])([\w-]+)/g)) {
                if (prefix === '#' && this.getAttribute('id') !== name) return false;
                if (prefix === '.' && !this.classList.contains(name) && !this.className?.split(/\s+/).includes(name)) return false;
            }
            return !tokens.length || !!this.parentElement?.closest(tokens.join(' '));
        });
    }
    querySelector(selector) { return this.children.find(x => x.className === selector.slice(1)) || null; }
    querySelectorAll() { return this.children.filter(x => x.className === 'gary-cn-box'); }
    getBoundingClientRect() { return { width: 200, height: 24, top: 0, bottom: 24 }; }
    addEventListener(event, fn) { (this.listeners[event] ||= []).push(fn); }
    async fire(event, data = {}) {
        let prevented = false;
        const e = { button: 0, ...data, preventDefault() { prevented = true; } };
        for (const fn of this.listeners[event] || []) await fn(e);
        if (this['on' + event]) await this['on' + event](e);
        return prevented;
    }
    click() { this.clicks++; }
}

function createRuntime(file, { language = '', stored = {}, extra = {}, setHandler, getHandler, bootstrap, chromeOverrides } = {}) {
    const changes = [], messages = [], writes = [], opened = [], timers = new Map();
    let timerId = 0, handler, installed, worker;
    const data = structuredClone(stored);
    const storageReads = [], accessLevels = [];
    const chrome = {
        i18n: { getUILanguage: () => language },
        runtime: { lastError: null, getManifest: () => JSON.parse(source('manifest.json')), onMessage: { addListener(fn) { handler = fn; } },
            onInstalled: { addListener(fn) { installed = fn; } }, getURL: p => 'chrome-extension://test/' + p,
            sendMessage(msg, callback) {
                messages.push(plain(msg));
                if (msg.type === 'getPageBootstrap') {
                    if (bootstrap) { bootstrap(callback); return; }
                    callback({ok: true, config: buildPublicConfig(data, language), cacheClearedAt: data.translationCacheClearedAt || 0});
                    return;
                }
                if (msg.type === 'cacheLookup') {
                    if (!('translationCache' in data) && !data.translationCacheMeta && !worker) return Promise.resolve({ok:true, hits:[]});
                    worker ||= createRuntime('background.js', {stored:data});
                    return worker.send(msg);
                }
                return Promise.resolve({ok: true, results: msg.items?.map(() => ({tag:'科技', translatedTitle:'Translated result'}))});
            } },
        tabs: { create(options) { opened.push(options); } },
        storage: { onChanged: { addListener(fn) { changes.push(fn); } }, local: {
            setAccessLevel(options) { accessLevels.push(plain(options)); },
            get(keys, cb) {
                storageReads.push(plain(keys));
                if (getHandler) return getHandler(keys, cb, data);
                cb(Array.isArray(keys) ? Object.fromEntries(keys.filter(k => Object.hasOwn(data, k)).map(k => [k, data[k]])) : {...keys, ...data});
            },
            set(values, cb) {
                writes.push(plain(values));
                if (setHandler) return setHandler(values, cb, chrome, data);
                Object.assign(data, structuredClone(values)); cb?.();
            },
            remove(keys, cb) {
                for (const key of [].concat(keys)) delete data[key];
                cb?.();
            }
        } }
    };
    chromeOverrides?.(chrome);
    const titles = [];
    const document = { readyState:'loading', documentElement:{}, body: new Element('body'), addEventListener() {},
        querySelectorAll: () => titles, querySelector: () => null, createElement: tag => new Element(tag) };
    const context = vm.createContext({ chrome, document, window:{addEventListener(){}, innerHeight:800},
        console:{log(){},warn(){},error(){}}, module:{exports:{}}, URL, Date,
        setTimeout(fn) { const id = ++timerId; timers.set(id, fn); return id; }, clearTimeout(id) { timers.delete(id); }, ...extra });
    const nodeModule = context.module;
    delete context.module;
    vm.runInContext(source("shared.js"), context, {filename:"shared.js"});
    context.module = nodeModule;
    if (file === "popup.js") vm.runInContext(source("popup-locales.js"), context, {filename:"popup-locales.js"});
    vm.runInContext(source(file), context, {filename:file});
    return { api:context.module.exports, context, chrome, data, titles, messages, writes, opened, timers, document, storageReads, accessLevels,
        receive(msg) { handler?.(msg, {}, () => {}); },
        change(change, area = 'local') { changes.forEach(fn => fn(change, area)); },
        install(reason) { installed({reason}); },
        send(msg, sender = {}) { return new Promise(resolve => { if (!handler(msg, sender, resolve)) resolve(undefined); }); } };
}

function title(text, { main = false, linked = true, nested = false } = {}) {
    const parent = new Element(nested ? 'a' : 'div');
    const el = new Element(main ? 'yt-formatted-string' : linked ? 'a' : 'span');
    el.textContent = text; el.main = main;
    if (linked && !main) { el.setAttribute('href', '/watch?v=first'); el.href = 'https://www.youtube.com/watch?v=first'; }
    parent.appendChild(el);
    return { el, parent, targetElement:el, isMainTitle:main };
}
const aiSettings = (targetLanguage = 'es') => ({translationMode:'ai', selectedProvider:'custom', targetLanguage, uiLanguage:'en',
    customApiKey:'test-key',customApiUrl:'https://example.test/chat/completions',customModel:'test'});
const settle = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
function shardedEntries(data) {
    return Object.entries(data).filter(([key]) => /^translationCache_b\d+$/.test(key))
        .flatMap(([, entries]) => entries).sort((a, b) => a[2] - b[2]);
}
module.exports = { source, plain, Element, createRuntime, title, aiSettings, settle, shardedEntries };
