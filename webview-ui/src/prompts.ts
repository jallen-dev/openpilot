import { File } from "../../src/shared/File"

const BASE_SYSTEM_PROMPT = `You are an expert programming assistant. The user may ask you general questions or ask for help with their code. Always respond in github flavored markdown.`

export const SYSTEM_PROMPT = BASE_SYSTEM_PROMPT

export function askWhatContextIsRequired(
  prompt: string,
  candidateFileNames: string[]
) {
  let content = prompt
  content += `\n\nWhat files do you need to see, if any, in order to answer the above prompt?`

  if (candidateFileNames.length) {
    const filePaths = candidateFileNames.join(", ")
    content += ` Here are some file paths that semantically match the request: ${filePaths}`
    content += `\nKeep in mind that these are just guesses and may not be relevant.`
    content += `\nPlease confirm whether any of these files are relevant to the request, and specify any missing files.`
  }

  content += `\nReturn only an array of file paths like so: ["src/foo.js", "src/bar.js"]. If no files are needed, return an empty array: [].

Do not include any other text in your response. Respond only with the array.`
  return content
}

export function promptWithFileContext(
  prompt: string,
  files: File[],
  { produceDiffs = false } = {}
) {
  let content = `Here are ${files.length} files in my workspace that might provide context to my request below:`
  for (const file of files) {
    content += `\n\n${file.path}:\n\n\`\`\`${file.content}\`\`\``
  }

  content += `\n\n***END OF CONTEXT***\n\n`
  content += prompt

  if (produceDiffs) {
    content += `\n\nIf you suggest any code changes to the files above, provide them in diff format and follow these rules:
1. Put the code in a \`\`\`diff block.
2. Put the path to the file as a comment in the first line of the diff.
3. Show lines that were removed with a \`-\` prefix.
4. Show lines that were added with a \`+\` prefix.
5. Show a few lines surrounding the parts that change.
6. Don't show the entire file, unless the entire file changes.
7. When you omit lines, don't replace them with a comment. Just omit them.
For example:
\`\`\`diff
// src/fizzbuzz.js
- if (x % 3 = 0) {
+ if (x % 3 === 0) {
    console.log("fizz");
  }
\`\`\`
Here is another example:
\`\`\`diff
// foo.ts
  function foo() {
-   console.log("foo");
+   console.log("bar");
  }
Remember: only show the relevant parts of the file. Do not show the entire file. Remember to put it in a diff if you suggest a change to an existing file.`
  }

  return content
}
