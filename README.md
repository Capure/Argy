# Argy

A simple command line args and options parser for node.

### Installation

```sh
$ yarn add argy-args
```

### Usage

```ts
import { Argy } from "argy-args";

const argy = new Argy();

argy.setAppName("Argy example");

argy.addArgument("volume", {
  prefix: "long",
  takesValue: true,
  required: true,
  callback: (value) => {
    console.log("volume: ", value);
  },
});

argy.addAlias("volume", "vol", { prefix: "short" });

argy.addAutoHelp();

argy.execArguments();
```

#### Help example

```sh
$ app --help
-- ARGY EXAMPLE - HELP --

  "--volume=value" - No description
  "-vol=value" - Alias to "--volume"
  "--help" - Displays help information

-- ARGY EXAMPLE - HELP --
```
