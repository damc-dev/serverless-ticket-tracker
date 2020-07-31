import { spawn } from "child_process";
import * as path from 'path';
import * as yargs from 'yargs';
import * as yaml from 'js-yaml';
import * as fs from 'fs';

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

    const lambdaLogicalId = await getLogicalId(template, path.resolve(lambdaDir));
    if (!lambdaLogicalId) {
        console.error("Could not find logical id for lambdaDir specified");
        return;
    }
    const envVarsFile = await updateLogicalId(lambdaDir, lambdaLogicalId);
    const invokeLambda = new InvokeLambda(lambdaLogicalId, template, envVarsFile);

    await invokeLambda.invoke();
    fs.unlinkSync(envVarsFile)

}

async function getLogicalId(template: string, lambdaPath: string): Promise<string> {
    let logicalId: string = "";
    try {
        let fileContents = fs.readFileSync('./template.yaml', 'utf8');
        let data = yaml.safeLoad(fileContents);
        let resources = data.Resources;
        for (const [key, value] of Object.entries(resources)) {
            let resource: any = value;
            if (resource.Type === "AWS::Lambda::Function" && resource?.Metadata['aws:asset:path'] === lambdaPath) {
                logicalId = key;
            }
        }
    } catch (e) {
        console.log(e);
    }
    return logicalId;
}

async function updateLogicalId(lambdaDir: string, logicalId: string) {
    let rawdata = fs.readFileSync(path.resolve(path.join(lambdaDir, "environment.json")), {
        encoding: "UTF-8"
    });
    let env = JSON.parse(rawdata);
    let environment = {
        [logicalId]: env
    }
    let envFile = path.resolve(path.join(lambdaDir, "env.json"))
    fs.writeFileSync(envFile,  JSON.stringify(environment));
    return envFile
}

main(yargs.argv).catch((err) => {
    console.error(err);
    process.exit(1);
})
