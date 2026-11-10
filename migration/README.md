# 旧条目迁移通知更新

此更新只用于旧 Chrome Web Store 条目 `gjhklbipjkngmefflhbajmfnhkagbbcj`，把用户引导到长期维护的正式条目 `bhajnflcikmidmdalnjhknillnkaojhk`。

正式版入口：[Chrome Web Store](https://chromewebstore.google.com/detail/bhajnflcikmidmdalnjhknillnkaojhk)。

2026-10-01 已实际点击迁移按钮核对目标条目，商店公开页当时显示 **8.0.1**。两个条目的审核独立；用户已明确授权不等待正式 8.0.4，直接向旧条目提交迁移更新并在审核通过后发布。提前迁移的用户会先安装正式条目当时的公开版本，后续再由 Chrome 自动更新到正式 8.0.4。

## 用户看到什么

- 打开旧插件弹窗：顶部显示“请切换到正式版”和“前往正式版”按钮。
- 打开或刷新 YouTube：右下角显示同样的非阻塞提醒。用户可以点“7 天后提醒”，期间其他 YouTube 标签页也不重复显示；插件弹窗始终保留正式版入口。
- 提醒跟随旧插件已保存的界面文字，覆盖现有 14 种界面，并支持浏览器默认繁体中文。阿拉伯语从右到左显示；全屏视频时隐藏页面提醒。
- 点击按钮只在新标签页打开正式商店条目。用户仍需自行安装、填写 Key / 设置，再移除旧插件。

不会自动安装或卸载扩展、打开标签页、读取或导出 Key、向开发者发送数据。仅新增一个本机保存的提醒时间，旧插件的设置和翻译逻辑保留。两个 ID 的本机设置互相隔离，不会自动合并。

## 提交步骤

1. 核对正式条目 `bhajnflcikmidmdalnjhknillnkaojhk` 可以访问和安装。其 8.0.4 审核不阻塞旧条目的提醒更新；正式包仍为项目根目录原有的 `YouTube_AI_Title_Translator_v8.0.4.zip`。
2. 打开开发者后台的**旧条目**，核对 ID 是 `gjhklbipjkngmefflhbajmfnhkagbbcj`。
3. 在该条目的“软件包 / Package”页面上传 `YouTube_AI_Title_Translator_v8.0.4_OLD_ID_MIGRATION.zip`，提交审核并发布。这是对旧 8.0.3 的一次更新，版本号递增为 8.0.4；不新建条目。
4. Chrome 自动更新后，仍使用旧条目的用户下次打开弹窗，或打开 / 刷新 YouTube 时会看到迁移提醒。仅改商店说明无法让已安装的旧代码出现按钮。
5. 提醒版发布后可把旧条目可见性改为 Unlisted（不公开列出），并在旧条目说明中写明正式链接。保留旧条目用于这次更新；不要在通知更新发布前撤下或删除它。

2026-10-01 已向旧条目上传并提交这个迁移更新，后台状态为“待审核”，保留“审核通过后自动发布”。不等待正式条目 8.0.4 的审核。后台用户数量不提供联系方式；提醒只能触达仍安装旧插件并继续使用、且已收到更新的用户，无法保证全部 7 人都会看到。

安装包和测试结果见 [TEST_REPORT.md](TEST_REPORT.md)。

## 构建与验证

```sh
python3 migration/build.py
node --test tests/migration.test.js
```

构建以已有 `YouTube_AI_Title_Translator_v8.0.3.zip` 为基础，只修改 manifest 版本与内容脚本注册、弹窗通知脚本引用和内嵌版本元数据，并新增 `migration-notice.js`。没有增加权限，也没有修改正式版源文件或正式版安装包。运行时另有旧 ID 校验，正式 ID 永远不会显示迁移提醒。

`migration/preview.html` 是开发预览，使用模拟 Chrome API，不进入上传包。单元回归覆盖旧 ID 限定、正式链接、无自动导航、最小存储访问、七天提醒、跨标签页同步、失败重试、界面文字变化、RTL、DOM 加载和全屏隐藏。商店审核、自动更新分发以及实际用户点击须在发布后观察。
