## City17 Chrome extension
A Chrome extension to avoid ads on Twitch. See [City17][srv] for the other half
of the code. Should work in any browser that can load Chrome extensions.

This isn't provided pre-built, you need to set it all up yourself.

[srv]: https://github.com/AlyoshaVasilieva/city17

### Building

Prerequisite: Set up City17 and ensure [you have NPM installed](https://www.npmjs.com/get-npm).

The build process is somewhat weird in order to avoid publishing my function URLs,
since that would eventually cost me money.

1. Set environment variables in a file named `build_set_env_vars.ps1`
   * Assuming Aliyun functions, it looks like this, just not censored:
```powershell
$Env:FUNCTION_URL_BASE="https://################.cn-shanghai.fc.aliyuncs.com/2016-08-15/proxy/a/prx/invoke"
$Env:FUNCTION_PERM_REGEX="https://################.cn-shanghai.fc.aliyuncs.com/*"
```
2. Run `build.ps1`
3. Load the extension from the `dist` directory. (In Chrome this means enabling
   Developer Mode and using *Load unpacked*)

The Powershell build process should be fairly easy to port to Linux. (It should likely
just be using NPM somehow, but I don't know how to use NPM.)

### Issues

* A white pixel will appear in the bottom left of the Twitch page. This is an ad iframe
that fails to load due to being blocked.

### License

GNU GPLv3.
