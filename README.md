# YAB is Yet Another Build tool.

## What the heck does it do?

Just a very straightforward thing.

It **adds the `.js` file extensions to the import statements
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

**You can hav *YAB* watch the `outDir` of your `TypeScript` project without any issue.**
I'm actually using the development version of *YAB* to watch the `outDir` of its own
*TypeScript* project - I wasn't able to use modules until I go the basic features working,
it made for a large monolith.

It's a lighter alternative to a full-on webpack if you just need to transpile *TypeScript*
and **actually run it** on *Node.js* without going through all the mess of bundling etc.

Needless to say, there are probably bugs.

## Missing features that I have identified

- Currently YAB does not update the source-maps, I intend to fix it.
