var { obfuscate } = require("javascript-obfuscator");
var fs = require("fs");
var path = require("path");

var settingsPath = path.resolve(process.cwd(), "nwotdata/settings.json");
if (!fs.existsSync(settingsPath)) { // Do I even need this?
    settingsPath = path.resolve(process.cwd(), "settings_example.json");
}
var settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));

class Antibot {
    checkSolves = [];
    solves = [];

    hash = Math.floor(Math.random() * 999);

    verifiedDevices = false;

    constructor() {
        this.clientChecks = settings.antibot.client_checks;

        for (let i = 0; i < 3; i++) {
            this.solves.push(this.clientChecks[Math.floor(Math.random() * this.clientChecks.length)]);
        }

        for (let i = 0; i < this.solves.length; i++) {
            this.checkSolves.push(Math.floor(Math.random() * 999) + "");
        }
    }

    verifyMessage(ws, data) {
        if (data.kind == "devices") {
            this.verifiedDevices = true;
        }

        if (data.kind == "hi") {
            if (ws.sdata && ws.sdata.user) {
                var user = ws.sdata.user;
                if (user.operator || user.superuser || user.staff) return false;
            }

            if (!data.code || !this.verifiedDevices || !this.verifyCode(data.code)) {
                return true;
            }
        }
    }

    generateCode() {
        let clientChecksCode = this.solves.map((z, i) => {
            return `if(${z[0]} == ${JSON.stringify(z[1])}) parts.push("${this.checkSolves[i]}")`;
        });

        return obfuscate(
            `
                let parts = [];
                ${clientChecksCode.join(";\n")}
                return ${this.hash}*parts.map(z => z.split("").map(z => z.charCodeAt(0)).reduce((a, b)=>a+b)).reduce((a, b) => a + b);
            `,
            {
                compact: true,
                controlFlowFlattening: true,
                controlFlowFlatteningThreshold: 1,
                numbersToExpressions: true,
                simplify: true,
                stringArrayShuffle: true,
                splitStrings: true,
                stringArrayThreshold: 0.52,
            },
        ).getObfuscatedCode();
    }

    verifyCode(code) {
        let solve = this.hash *
            this.checkSolves.map((z) =>
                z.split("").map((z) => z.charCodeAt(0)).reduce((a, b) => a + b)
            ).reduce((a, b) => a + b);

        if (solve !== code) {
            console.log(
                "Antibot failed! Code:",
                code,
                "Needed:",
                solve,
                "Hash:",
                this.hash,
                "Solves:",
                this.solves,
            );
        }
        return solve == code;
    }
}

module.exports = Antibot;
