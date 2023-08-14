# OpenPilot

OpenPilot is an open-source AI programming assistant as an [extension to Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=jallen-dev.openpilot). Connect your editor to a variety of different Large Language Models including those from OpenAI and Google. Ask the LLM questions about your code base, generate new code snippets, or make changes to your existing files.

![Using OpenPilot](using_openpilot.gif)

## Context is automatically included

No need to copy & paste code into your chat. OpenPilot creates a vector store of the files in your workspace to match them based on the semantic content of your prompt. OpenPilot then sends the files along with your request so that the LLM has the context it needs to provide a better response.

## Choose your LLM

Switch between any models you have access to from OpenAI or Google. More to come soon!

## Get started

> [!WARNING]
> Using OpenAI via this extension will incur charges. It can be a good idea to set a [usage limit](https://platform.openai.com/account/billing/limits) to avoid overspending.

> [!WARNING]
> Indexing workspace and chatting with GPT requires sending source code to OpenAI. Do not use this extension for work unless you have permission from your employer.

### Bring your own keys

Generate an [OpenAI key](https://platform.openai.com/account/api-keys) or [Google PaLM key](https://makersuite.google.com/app/apikey). Your keys are stored securely inside of VS Code's Secret Storage.

### Index workspace

Indexing your workspace allows OpenPilot to automatically find files that are relevant to your chat. This requires an OpenAI key, even if you are chatting with a model that isn't GPT.

#### Install Chroma

[Chroma](https://github.com/chroma-core/chroma) is a vector store that stores the embeddings generated from your workspace files.

```sh
git clone https://github.com/chroma-core/chroma.git
cd chroma
docker-compose up -d --build
```

#### Run the Index Workspace command

Use the `...` menu in the top-right corner of the OpenPilot pane and choose `Index Workspace`

> [!NOTE]
> The vector store doesn't (yet) automatically update when your files change. Re-running the index command will incrementally update only those files that have changed since the last time you indexed.

You can still chat even if you choose not to index, you'll just have to copy & paste any code that might be needed.

## Roadmap

### Local LLM

An option to connect to a locally-running LLM for better privacy.

### Local Embeddings

Generate embeddings using a local model instead of OpenAI for better privacy and zero-cost file indexing and lookup.

### Better diffs

GPT 3.5 is bad at following instructions about how to format diffs, at least with the prompts that have been tried so far. A different approach might be needed.

### Support more 3rd-party LLMs

I've been sitting on the waitlist for other companies' APIs for quite a while. Maybe if you work for one of these companies you can hook me up 😉
