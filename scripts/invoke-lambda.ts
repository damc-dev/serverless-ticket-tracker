import { spawn } from "child_process";
import * as path from 'path';
import * as yargs from 'yargs';

yargs.usage("Runs the sam local invoke on a lambda")
.options({
    template: {
        demandOption: false,
        describe: "The template.yaml file to execute from",
        type: "string",
        default: path.resolve(".")
    },
    lambdaDir: {
        demandOption: true,
        describe: "The directory of the lambda to run",
        type: "string"
    }
}).showHelpOnFail(true);

declare type EnvironmentVariables = {
    [name: string]: string;
}
class InvokeLambda {
    readonly template: string;
    readonly lambdaLogicalId: string;
    readonly envVarsFile: string;

    constructor(lambdaLogicalId: string, template: string, envVarsFile: string) {
        this.lambdaLogicalId = lambdaLogicalId;
        this.template = template;
        this.envVarsFile = envVarsFile;
    }

    async invoke(): Promise<any> {
        const args: string[] = ["local", "invoke", this.lambdaLogicalId, "--env-vars", this.envVarsFile];
        return new Promise((resolve, reject) => {
            const process = spawn("sam", args, {stdio: "inherit", shell: true});
            process.on("exit", (code) => {
                if (!code) {
                    resolve()
                } else {
                    reject(new Error(`Exit code: ${code}`))
                }
            })
        })
    }
}

async function main(argv: yargs.Arguments): Promise<any> {
    const lambdaDir: string = argv.lambdaDir as string;
    const template: string = argv.template as string;
    const lambdaLogicalId = "TicketsGet3A5E5442";
    const envVarsFile = path.resolve(path.join(lambdaDir, "environment.json"))
    console.log(envVarsFile);
    const invokeLambda = new InvokeLambda(lambdaLogicalId, template, envVarsFile)
    await invokeLambda.invoke();
}

main(yargs.argv).catch((err) => {
    console.error(err);
    process.exit(1);
})
