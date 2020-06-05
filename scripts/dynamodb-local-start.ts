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
        default: path.resolve("./template.yaml")
    }
}).showHelpOnFail(true);

const getCommandOutput = async (cmd: string, args: string[]): Promise<string> => {
    //console.log("Command: ", [cmd, ...args].join(" "))
    return new Promise((resolve, reject) => {
        const proc = spawn(cmd, args, {shell: true, env: {
            ...process.env,
            AWS_PAGER: ''
        }});
        let output = "";
        proc.stdout?.on('data', (data) => {            
            output += data;
        });
        proc.on("exit", (code) => {
            if (!code) {
                resolve(output)
            } else {
                reject(new Error(`Command: ${[cmd, ...args].join(' ')} exited with code: ${code}`))
            }
        });
    });
}

const runCommand = async (cmd: string, args: string[]): Promise<any> => {
    //console.log("Command: ", [cmd, ...args].join(" "))
    return new Promise((resolve, reject) => {
        const proc = spawn(cmd, args, {stdio: "inherit", shell: true, env: {
            ...process.env,
            AWS_PAGER: ''
        }});
        proc.on("exit", (code) => {
            if (!code) {
                resolve()
            } else {
                reject(new Error(`Command: ${[cmd, ...args].join(' ')} exited with code: ${code}`))
            }
        });
    });
}

class DynamoDbLocal {
    readonly containerName: string;

    constructor(containerName?: string) {
        this.containerName = containerName || 'dynamodb'
    }

    async inspect(): Promise<any> {
        const cmd = "docker";
        const args = ["container", "inspect", this.containerName];
        const raw = await getCommandOutput(cmd, args);
        return JSON.parse(raw);
    }

    async getStatus(): Promise<string> {
        const inspect = await this.inspect();
        return inspect[0].State.Status
    }

    async isRunning(): Promise<boolean> {
        try {
            const status =  await this.getStatus()
            return status === "running";
        } catch (error) {
            return false;
        }
    }

    async start(): Promise<any> {
        const cmd = "docker"
        const args: string[] = [ 
            "run", "-d", 
            "--network", "sam-network",
            "-v", '"$PWD":/dynamodb_local_db', 
            "-p", "8000:8000", 
            "--network-alias=dynamodb", 
            "--name", "dynamodb",
            "amazon/dynamodb-local", "-jar", "DynamoDBLocal.jar", "-sharedDb"
        ];
        return await runCommand(cmd,args)
    }
}

const createTable = async (tableName: string, attributeDefinitions: string[], keySchema: string): Promise<any> => {
    const cmd = "aws"
    const args: string[] = ["dynamodb", "create-table", "--table-name", tableName];
    args.push( "--attribute-definitions", ...attributeDefinitions);

    args.push("--key-schema", keySchema);
    args.push("--endpoint-url", "http://localhost:8000");
    args.push("--provisioned-throughput", "ReadCapacityUnits=5,WriteCapacityUnits=5");

    return await runCommand(cmd,args)
}

const listTables = async (): Promise<string[]> => {
    const cmd = "aws"
    const args: string[] = [
        "dynamodb", "list-tables", 
        "--endpoint-url", "http://localhost:8000",
        "--output", "json"
    ];
    const json = JSON.parse(await getCommandOutput(cmd, args))
    return json.TableNames
}

async function main(argv: yargs.Arguments): Promise<any> {
    const lambdaDir: string = argv.lambdaDir as string;
    const template: string = argv.template as string;

    const dbLocal = new DynamoDbLocal();
    const isRunning = await dbLocal.isRunning()
    console.log("isRunning:", isRunning)
    if (isRunning) {
        console.log("DynamoDb is already running");
    } else {
        await dbLocal.start();
    }
    const tables = await listTables();

    const doc = yaml.safeLoad(fs.readFileSync(template, 'utf8'));

    const dbLogicalIds: string[] = Object.keys(doc.Resources).filter((logicalId: string) => {
        const resource = doc.Resources[logicalId]
        return resource.Type === "AWS::DynamoDB::Table"
    });
    dbLogicalIds.forEach( async (logicalId) => {
        if (tables.includes(logicalId)) {
            console.log(`DynamoDb table ${logicalId} already exists`)
        } else {
            const db = doc.Resources[logicalId]
            const attributeDefinitions = db.Properties.AttributeDefinitions.map((attribute: any)=> {
                return `AttributeName=${attribute.AttributeName},AttributeType=${attribute.AttributeType}`
            })
            const keySchema = db.Properties.KeySchema.map((key: any) => {
                return `AttributeName=${key.AttributeName},KeyType=${key.KeyType}`
            })[0]
            await createTable(logicalId, attributeDefinitions, keySchema)
        }
    })
}

main(yargs.argv).catch((err) => {
    console.error(err);
    process.exit(1);
})
