# deep-foundation deepcase

[![Gitpod](https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/deep-foundation/deepcase) 
[![Discord](https://badgen.net/badge/icon/discord?icon=discord&label&color=purple)](https://discord.gg/deep-foundation)

## Maintenance

### Refresh package-lock.json

This command deletes `node_modules`, `package-lock.json` and runs `npm i`. So everything is refreshed.

This command should be executed and the result should be commited when `@deep-foundation/*` dependencies are updated, that are at the same time are peer dependencies. So new version will be added to `package-lock.json`.

```bash
npm run package:refresh
```

### Release a new version

In this case of this repository, `package:release` uses `npm-release` inside (from `@deep-foundation/npm-automation` package). `npm-release` commands increments version in three files: `deep.json`, `package.json` and `package.json`, it also makes a commit and push.

After changes are pushed GitHub Actions publish new released version, and if npm publish succedes new release is published on GitHub as well.

```bash
npm run package:release
```

After that it might be required to release new versions of:
1. https://github.com/deep-foundation/deepcase-app