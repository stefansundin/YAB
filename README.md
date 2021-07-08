# YAB is Yet Another Build tool.

It aims to turn the *JavasScript* code output by the *tsc* *TypeScript*
compiler into code that can be directly executed on the latest *Node.js*
by performing the strict minimal amount of changes needed.

No bundling, just make it watch the `outDir` of your *TypeScript* project and
it will automatically and transparently adjust the emitted *JavaScript* files.

Currently, as I explain in more details further down,
if you transpile to *ESNext* with `"module": "ESNext"` in your `tsconfig.json`,
*Node.js* will not be able to execute your *Transpiled* *JavaScript* code if you use relative `import` statements or
some *node_modules* imports with sub-paths.

## What the heck does YAB do and why?

Just a very straightforward thing.

It **appends the `.js` file extensions to the top level import statements
in the *JavaScript* files that are generated by *TypeScript***.

This is quite useful, because, simply put:

- If you want to use the `import`/`export` syntax natively in *Node.js*
  you must set the property `"type": "module"` in your `package.json` file.

- But as soon as you have set the `"type": "module"` property,
  *Node*'s module resolution algorithm changes, and the new one
  now requires that you **import your JavaScript files
  including their `.js` extensions**.

  I.e. writing **`import foo from './foo'` won't work any longer**,
  even if `./foo.js` is a correctly defined *JavaScript*
  source file that exists, is in the right place, and exports
  a valid ES6 module.

  What you need to do **instead** is **write `import foo from './foo.js'`**.

  That works.

  **So what's the problem, you say?**

- The problem is that **TypeScript, when it emits `import` statements**,
  i.e. when you have set the `"module": "ESNext"` property in your `tsconfig.json`,
  **doesn't put the `.js` extension** in the transpiled *JavaScript* code
  that it generates - ever!

  It means that **TypeScript code freshly transpiled to ESNext and
  using ESNext modules DOES NOT RUN ON *Node.JS***.

  And **there is no option to tweak in *tsc to make it work***.

  Nothing.

  The developers of *TypeScript* are closing all *GitHub* issues related to this
  problem and say that they won't move a finger.

  The reasons why still elude me. If anyone could ELI5 *TypeScript*'s position
  on this issue I'd be glad to hear their explanation.

  It's just 3 f***ing characters to add!!

In conclusion you have to **either give-up on using ESNext modules altogether**,
or **downlevel transpile your *TypeScript* to a version of *JavaScript*
that uses `require`**.

**I don't want that, I want full ESNext. Including modules.**.

**So I built this thing today**, it was a fun project and I've learnt a ton of stuff,
and it's actually kind of useful.

What it does is **replace all relative `import` statements that lack a `.js` file extension
with statements including the `.js` extension**, only if the corresponding `.js` files
actually exist of course.

The algorithm goes something like:

- oh, here is an `import { flattenNodeTree } from './parsing/ASTUtil'` statement!
- well, it does start with a `.` so it must be a relative `import`...
- ...aaaaaand it so happens that the file `./parsing/ASTUtil.js` exists!!
- so let me replace `import { flattenNodeTree } from './parsing/ASTUtil'`
  with `import { flattenNodeTree } from './parsing/ASTUtil.js'`

**Voilà. Job done.**

I'm using `@babel/parser` to do the parsing so it should be rather robust
as I'm not just slashing in the code with approximative `RegExp`s.

## Usage:

Just invoke the main script, whichever way you may have obtained it,
and pass it a path to a directory containing `.js` files.

It will start **watching and adding the `.js` extensions** where it thinks
it makes sense.

```
node js/bin.js path/to/dir
```

**You can have *YAB* watch the `outDir` of your `TypeScript` project without any issue.**

I'm actually using the development version of *YAB* to watch the `outDir` of its own
*TypeScript* project - I wasn't able to use modules in *YAB* until I go the basic features working,
it made for a large monolith up until this point.

It's a lighter alternative to a full-on webpack if you just need to transpile *TypeScript*
and **actually run it** on *Node.js* without going through all the mess of bundling etc.

*Needless to say, there are probably bugs, use at your own risk.*

## Missing features that I have identified

- Currently YAB does not update the source-maps, I intend to fix it.
- Only top-level `import`s are supported, I don't know if I will try to support dynamic imports.
