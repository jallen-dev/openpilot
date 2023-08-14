import {
  CancellationToken,
  Disposable,
  Uri,
  Webview,
  WebviewView,
  WebviewViewProvider,
  WebviewViewResolveContext
} from "vscode"

import MessageService from "./MessageService"
import { Extension } from "./helpers/Extension"
import { getNonce } from "./utils/getNonce"
import { getUri } from "./utils/getUri"

class OpenpilotView implements WebviewViewProvider {
  public static readonly viewType = "openpilotView"
  private static instance: OpenpilotView
  private _disposables: Disposable[] = []

  private _view?: WebviewView

  constructor(private readonly _extensionUri: Uri) {}

  public static getInstance(_extensionUri: Uri): OpenpilotView {
    if (!OpenpilotView.instance) {
      OpenpilotView.instance = new OpenpilotView(_extensionUri)
    }

    return OpenpilotView.instance
  }

  public resolveWebviewView(
    webviewView: WebviewView,
    _context: WebviewViewResolveContext,
    _token: CancellationToken
  ) {
    this._view = webviewView

    this._view.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    }

    this._view.webview.html = this._getHtmlForWebview(this._view.webview)
    this._setWebviewMessageListener(this._view.webview)
    MessageService.setWebview(this._view.webview)
  }

  /**
   * Cleans up and disposes of webview resources when the webview panel is closed.
   */
  public dispose() {
    while (this._disposables.length) {
      const disposable = this._disposables.pop()
      if (disposable) {
        disposable.dispose()
      }
    }
  }

  private _getHtmlForWebview(webview: Webview) {
    const file = "src/index.tsx"
    const localPort = "5173"
    const localServerUrl = `localhost:${localPort}`

    const styleResetUri = getUri(webview, this._extensionUri, [
      "media",
      "reset.css"
    ])
    const styleVscodeUri = getUri(webview, this._extensionUri, [
      "media",
      "vscode.css"
    ])
    // The CSS file from the React build output
    const stylesUri = getUri(webview, this._extensionUri, [
      "out",
      "webview-ui",
      "assets",
      "index.css"
    ])

    let scriptUri
    const isProd = Extension.getInstance().isProductionMode
    if (isProd) {
      scriptUri = getUri(webview, this._extensionUri, [
        "out",
        "webview-ui",
        "assets",
        "index.js"
      ])
    } else {
      scriptUri = `http://${localServerUrl}/${file}`
    }

    const nonce = getNonce()

    const reactRefresh = /*html*/ `
      <script type="module">
        import RefreshRuntime from "http://${localServerUrl}/@react-refresh"
        RefreshRuntime.injectIntoGlobalHook(window)
        window.$RefreshReg$ = () => {}
        window.$RefreshSig$ = () => (type) => type
        window.__vite_plugin_react_preamble_installed__ = true
      </script>`

    const reactRefreshHash =
      "sha256-YmMpkm5ow6h+lfI3ZRp0uys+EUCt6FOyLkJERkfVnTY="

    const csp = [
      `default-src 'none';`,
      `script-src 'unsafe-eval' https://* ${
        isProd
          ? `'nonce-${nonce}'`
          : `http://${localServerUrl} http://0.0.0.0:${localPort} '${reactRefreshHash}'`
      }`,
      `style-src ${webview.cspSource} 'self' 'unsafe-inline' https://*`,
      `font-src ${webview.cspSource}`,
      `connect-src https://* ${
        isProd
          ? ``
          : `ws://${localServerUrl} ws://0.0.0.0:${localPort} http://${localServerUrl} http://0.0.0.0:${localPort}`
      }`
    ]

    return /*html*/ `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="Content-Security-Policy" content="${csp.join("; ")}">
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" type="text/css" href="${styleResetUri}">
        <link rel="stylesheet" type="text/css" href="${styleVscodeUri}">
        <link rel="stylesheet" type="text/css" href="${stylesUri}">
        <title>OpenPilot</title>
      </head>
      <body>
        <div id="root"></div>
        ${isProd ? "" : reactRefresh}
        <script type="module" src="${scriptUri}"></script>
      </body>
    </html>`
  }

  /**
   * Sets up an event listener to listen for messages passed from the webview context and
   * executes code based on the message that is recieved.
   *
   * @param webview A reference to the extension webview
   * @param context A reference to the extension context
   */
  private _setWebviewMessageListener(webview: Webview) {
    webview.onDidReceiveMessage(
      MessageService.handleMessageFromWebview,
      undefined,
      this._disposables
    )
  }
}

export default OpenpilotView

/* 
  Substantial portions of this code were taken from vscode-front-matter
  https://github.com/estruyf/vscode-front-matter/blob/3a0fe7b4db18ef10285f908a3a4d4efe9503afeb/src/explorerView/ExplorerView.ts

  MIT License

  Copyright (c) 2019 Elio Struyf

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
  */
