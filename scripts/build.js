const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const runtimeFiles = [
    "manifest.json", "LICENSE", "shared.js", "background.js", "content.js", "styles.css",
    "popup.html", "popup.js", "popup-locales.js", "welcome.html", "welcome.js", "welcome-locales.js"
];
const runtimeDirectories = ["icon", "assets", "_locales"];
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const readJson = file => JSON.parse(read(file));

function releaseFiles(directory) {
    return fs.readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap(entry => {
        if (entry.name.startsWith(".")) return [];
        const file = path.posix.join(directory, entry.name);
        if (entry.isDirectory()) return releaseFiles(file);
        assert(entry.isFile(), `发布文件必须是普通文件: ${file}`);
        return [file];
    });
}

function localReference(ref, from, files) {
    if (!ref || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(ref)) return;
    const pathname = ref.split(/[?#]/, 1)[0];
    const file = pathname.startsWith("/") ? pathname.slice(1) : path.posix.join(path.posix.dirname(from), pathname);
    assert(files.has(file), `${from} 引用的文件缺失或未列入发布白名单: ${file}`);
}

function check(files) {
    for (const file of files) assert(fs.lstatSync(path.join(root, file)).isFile(), `发布文件缺失: ${file}`);
    const manifest = readJson("manifest.json");
    const version = readJson("package.json").version;
    const contentVersion = read("content.js").match(/Gary插件 v(\d+\.\d+\.\d+) 已启动/)?.[1];
    assert.equal(manifest.version, version, "manifest.json 与 package.json 的版本不一致");
    assert.equal(contentVersion, version, "content.js 与 package.json 的版本不一致");

    const icons = value => typeof value === "string" ? [value] : Object.values(value || {});
    const manifestPaths = [
        ...icons(manifest.icons), ...icons(manifest.action?.default_icon), manifest.action?.default_popup,
        manifest.background?.service_worker, ...Object.values(manifest.chrome_url_overrides || {}),
        manifest.options_page, manifest.options_ui?.page, manifest.devtools_page, manifest.side_panel?.default_path,
        ...(manifest.sandbox?.pages || []),
        ...(manifest.declarative_net_request?.rule_resources || []).map(resource => resource.path),
        ...(manifest.content_scripts || []).flatMap(script => [...(script.js || []), ...(script.css || [])])
    ];
    for (const file of manifestPaths.filter(Boolean)) {
        assert(files.has(file), `manifest.json 引用的文件缺失或未列入发布白名单: ${file}`);
    }

    for (const group of manifest.web_accessible_resources || []) {
        for (const pattern of group.resources || []) {
            const expression = pattern.split("*").map(part => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*");
            const matches = new RegExp(`^${expression}$`);
            assert([...files].some(file => matches.test(file)), `manifest.json 公共资源缺失: ${pattern}`);
        }
    }

    const locales = fs.readdirSync(path.join(root, "_locales"), { withFileTypes: true })
        .filter(entry => entry.isDirectory() && !entry.name.startsWith(".")).map(entry => entry.name);
    assert(locales.includes(manifest.default_locale), "默认语言包缺失");
    const requiredMessages = new Set(["extName", "extDescription", "actionTitle"]);
    for (const command of Object.values(manifest.commands || {})) {
        for (const [, key] of (command.description || "").matchAll(/__MSG_([\w@]+)__/g)) requiredMessages.add(key);
    }
    for (const locale of locales) {
        const file = `_locales/${locale}/messages.json`;
        assert(files.has(file), `语言包缺失: ${file}`);
        const messages = readJson(file);
        assert(messages && typeof messages === "object" && !Array.isArray(messages), `${file} 必须是语言消息对象`);
        for (const [key, entry] of Object.entries(messages)) {
            assert(typeof entry?.message === "string", `${file} 的 ${key} 缺少 message 字符串`);
        }
        for (const key of requiredMessages) {
            assert(typeof messages[key]?.message === "string" && messages[key].message.trim(), `${file} 缺少有效的 ${key}`);
        }
    }

    for (const file of files) {
        if (file.endsWith(".js")) execFileSync(process.execPath, ["--check", path.join(root, file)], { stdio: "inherit" });
        if (file.endsWith(".html")) {
            for (const [, ref] of read(file).matchAll(/\b(?:src|href)=["']([^"']+)["']/gi)) localReference(ref, file, files);
        }
        if (file.endsWith(".css")) {
            for (const [, ref] of read(file).matchAll(/url\(\s*["']?([^"'\s)]+)["']?\s*\)/gi)) localReference(ref, file, files);
        }
    }
    console.log(`校验通过 · v${version} · ${locales.length} 个语言包 · ${files.size} 个发布文件`);
}

try {
    const files = new Set([...runtimeFiles, ...runtimeDirectories.flatMap(releaseFiles)]);
    check(files);
    if (!process.argv.includes("--check")) {
        const dist = path.join(root, "dist");
        fs.rmSync(dist, { recursive: true, force: true });
        for (const file of files) {
            const dest = path.join(dist, file);
            fs.mkdirSync(path.dirname(dest), { recursive: true });
            fs.copyFileSync(path.join(root, file), dest);
        }
        console.log(`已复制 ${files.size} 个文件到 dist/，可直接加载目录或压缩为发布包。`);
    }
} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
}
