import chalk from "chalk";

export interface ArgyOptions {
  callback: (value?: string) => void;
  prefix: "short" | "long" | "none";
  takesValue?: boolean;
  required?: boolean;
  description?: string;
}

export class Argy {
  private registered: string[] = [];
  private readonly args: Map<
    string,
    ArgyOptions & { type: "arg" | "alias"; aliasTo?: string }
  > = new Map();
  private required: string[] = [];
  private appName = "";

  private displayError(msg: string) {
    console.error(chalk.red(`Error: ${msg}`));
    process.exit(1);
  }

  private displayWarning(msg: string) {
    console.warn(chalk.yellow(`Argy warning: ${msg}`));
  }

  setAppName(name: string): void {
    this.appName = name;
  }

  addAlias(
    argName: string,
    aliasName: string,
    options: {
      prefix: ArgyOptions["prefix"];
    }
  ): void {
    const item = this.registered.find((item) => item === argName);
    if (this.registered.find((item) => item === aliasName)) {
      this.displayWarning(`"${aliasName}" will be overwritten!`);
      this.registered = this.registered.filter((item) => item !== aliasName);
      this.required = this.required.filter((item) => item !== aliasName);
    }
    if (!item) {
      this.displayError(
        "Cannot register an alias for an argument that doesn't exist!"
      );
    }
    const prefix =
      this.args.get(item!)!.prefix === "long"
        ? "--"
        : this.args.get(item!)!.prefix === "short"
        ? "-"
        : "";
    this.args.set(aliasName, {
      ...options,
      description: `Alias to "${prefix}${argName}"`,
      callback: () => {
        return;
      },
      type: "alias",
      aliasTo: argName,
    });
    this.registered.push(aliasName);
  }

  addAutoHelp(argName?: string, prefix?: ArgyOptions["prefix"]): void {
    const name = argName ? argName : "help";
    const options = {
      prefix: prefix ? prefix : "long",
      description: "Displays help information",
      callback: () => {
        console.log(
          this.appName
            ? `-- ${this.appName.toUpperCase()} - HELP --`
            : "--- HELP ---"
        );
        console.log("");
        this.registered.forEach((name) => {
          const rawItem = this.args.get(name)!;
          const item =
            rawItem.type === "alias"
              ? this.args.get(rawItem.aliasTo!)!
              : rawItem;
          const prefix =
            rawItem.prefix === "long"
              ? "--"
              : rawItem.prefix === "short"
              ? "-"
              : "";
          if (rawItem.required) {
            console.log(
              `  "${prefix}${name}${item.takesValue ? "=value" : ""}" - ${
                rawItem.description ? rawItem.description : "No description"
              }`
            );
          } else {
            console.log(
              chalk.grey(
                `  "${prefix}${name}${item.takesValue ? "=value" : ""}" - ${
                  rawItem.description ? rawItem.description : "No description"
                }`
              )
            );
          }
        });
        console.log("");
        console.log(
          this.appName
            ? `-- ${this.appName.toUpperCase()} - HELP --`
            : "--- HELP ---"
        );
        process.exit();
      },
    };
    this.addArgument(name, options);
  }

  addArgument(name: string, options: ArgyOptions): void {
    if (this.registered.find((item) => item === name)) {
      this.displayWarning(`"${name}" will be overwritten!`);
      this.registered = this.registered.filter((item) => item !== name);
      this.required = this.required.filter((item) => item !== name);
    }
    this.args.set(name, { ...options, type: "arg" });
    if (options.required) {
      this.required.push(name);
    }
    this.registered.push(name);
  }

  execArguments(): void {
    const args = process.argv.splice(2);
    const parsed: string[] = [];
    args.forEach((arg) => {
      const [key, value] = arg.split("=");
      const prefix: ArgyOptions["prefix"] = key.startsWith("--")
        ? "long"
        : key.startsWith("-")
        ? "short"
        : "none";
      const name =
        prefix === "long"
          ? key.substring(2)
          : prefix === "short"
          ? key.substring(1)
          : key;
      const rawItem = this.args.get(name);
      if (rawItem) {
        const item =
          rawItem && rawItem.type === "alias"
            ? this.args.get(rawItem.aliasTo!)
            : rawItem;
        parsed.push(rawItem.type === "alias" ? rawItem.aliasTo! : name);
        if (prefix !== rawItem.prefix) {
          return;
        }
        if (item!.takesValue) {
          if (!value) {
            this.displayError(`Value cannot be undefined "${key}=undefined"`);
          }
          item!.callback(value);
        } else {
          item!.callback();
        }
      } else {
        this.displayError(`Unknown argument (key: ${key} value: ${value})`);
      }
    });
    this.required.forEach((item) => {
      if (!parsed.find((name) => name === item)) {
        const missingItem = this.args.get(item)!;
        const prefix =
          missingItem.prefix === "long"
            ? "--"
            : missingItem.prefix === "short"
            ? "-"
            : "";
        this.displayError(
          `Missing required argument "${prefix}${item}${
            missingItem.takesValue ? "=value" : ""
          }"`
        );
      }
    });
  }
}
