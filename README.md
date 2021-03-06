## City17 browser extension
A browser extension to avoid ads on Twitch. See [City17][srv] for the other half
of the code. Should work in any Chrome-like browser and Firefox.

This isn't provided pre-built, you need to set it all up yourself.

[srv]: https://github.com/AlyoshaVasilieva/city17

### Building

Prerequisite: Set up City17 and ensure [you have Node and NPM installed*][npm].

The build process is somewhat weird in order to avoid publishing my function URLs,
since that would eventually cost me money.

1. Set environment variables in a file named `build_set_env_vars.ps1`
   * Assuming Aliyun functions, it looks like this, just not censored:
```powershell
$Env:FUNCTION_URL_BASE="https://################.cn-shanghai.fc.aliyuncs.com/2016-08-15/proxy/a/prx/invoke"
$Env:FUNCTION_PERM_REGEX="https://################.cn-shanghai.fc.aliyuncs.com/*"
```
2. Run `build.ps1`
3. Load the extension from the `dist` directory.
   * Chrome: Enable Developer Mode in the extensions tab and use *Load unpacked*.
   * Firefox: In the extensions tab, click the gear, select *Debug Add-ons*,
     and use *Load Temporary Add-on*. Extension will be removed on every browser
     restart.

The Powershell build process should be fairly easy to port to Linux. (It should likely
just be using NPM somehow, but I don't know how to use NPM.)

*: That link is the fast way. [Read this guide for the correct way][guide].

[guide]: https://docs.npmjs.com/downloading-and-installing-node-js-and-npm
[npm]: https://nodejs.org/en/

### Issues

* Sometimes the code running in China will time out or fail. In Chrome, an error
  will pop up and it will fall back to the normal stream with ads. In Firefox,
  it will fail silently and eventually trigger "error 2000". Reload or refresh to retry.
* A white pixel will appear in the bottom left of the Twitch page. This is an ad iframe
that fails to load due to being blocked.

### License

GNU GPLv3.
