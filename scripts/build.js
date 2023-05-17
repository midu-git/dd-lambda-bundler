const esbuild = require("esbuild");
const { typecheckPlugin } = require("@jgoz/esbuild-plugin-typecheck");
const ddPlugin = require("dd-trace/esbuild");

const doTypeCheck = process.env.ESBUILD_TYPECHECK === "true";

const sourceFiles = ["src/index.ts"];

const plugins = [ddPlugin];

if (doTypeCheck) {
    plugins.push(
        typecheckPlugin({
            compilerOptions: {
                skipLibCheck: true,
            },
        })
    );
}

async function main() {
    return sourceFiles.map((sourceFile) => {
        esbuild
            .build({
                entryPoints: [sourceFile],
                // we don't want pulumi packages
                // we don't need aws-sdk package
                external: ["@pulumi/*", "aws-sdk"],
                bundle: true,
                treeShaking: true,
                minify: true,
                sourcemap: true,
                entryNames: "index",
                outdir: "dist",
                platform: "node",
                target: ["node18"],
                logLevel: "info",
                plugins: plugins,
            })
            .catch((reason) => {
                console.error("Build of file", sourceFile, "failed", reason);
                return process.exit(1);
            });
    });
}

main();
